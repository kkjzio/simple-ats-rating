"""
评分模板服务
处理评分模板的CRUD操作
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.template import ScoringTemplate, Dimension, TextField
from app.models.user import User
from app.models.operation_log import ActionType, ResourceType
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.core.exceptions import ResourceNotFoundError, ValidationError, BusinessRuleError
from app.services.log_service import create_log
from app.utils.validators import validate_template_weights


async def get_template_list(
    db: AsyncIOMotorDatabase,
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None
) -> tuple[List[ScoringTemplate], int]:
    """
    获取模板列表（分页、搜索）
    
    Args:
        db: 数据库实例
        page: 页码
        page_size: 每页数量
        keyword: 搜索关键词（模板名称、描述）
        
    Returns:
        tuple[List[ScoringTemplate], int]: (模板列表, 总数)
    """
    # 构建查询条件
    query = {}
    
    if keyword:
        # 支持模板名称和描述的模糊搜索
        query["$or"] = [
            {"name": {"$regex": keyword, "$options": "i"}},
            {"description": {"$regex": keyword, "$options": "i"}}
        ]
    
    # 计算总数
    total = await db.scoring_templates.count_documents(query)
    
    # 分页查询，按创建时间倒序
    skip = (page - 1) * page_size
    cursor = db.scoring_templates.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    
    templates = []
    async for template_data in cursor:
        templates.append(ScoringTemplate.from_mongo(template_data))
    
    return templates, total


async def get_template_by_id(
    db: AsyncIOMotorDatabase,
    template_id: str
) -> ScoringTemplate:
    """
    根据ID获取模板详情
    
    Args:
        db: 数据库实例
        template_id: 模板ID
        
    Returns:
        ScoringTemplate: 模板对象
        
    Raises:
        ResourceNotFoundError: 模板不存在
    """
    try:
        template_data = await db.scoring_templates.find_one({"_id": ObjectId(template_id)})
    except Exception:
        raise ResourceNotFoundError(resource_type="模板", resource_id=template_id)
    
    if not template_data:
        raise ResourceNotFoundError(resource_type="模板", resource_id=template_id)
    
    return ScoringTemplate.from_mongo(template_data)


async def create_template(
    db: AsyncIOMotorDatabase,
    template_data: TemplateCreate,
    current_user: User
) -> ScoringTemplate:
    """
    创建评分模板
    
    Args:
        db: 数据库实例
        template_data: 模板创建数据
        current_user: 当前用户
        
    Returns:
        ScoringTemplate: 创建的模板对象
        
    Raises:
        ValidationError: 数据验证失败
    """
    # 转换维度和文本字段 (验证已在schema层完成)
    dimensions = [
        Dimension(
            name=d.name,
            weight=d.weight,
            max_score=d.max_score,
            score_type=d.score_type,
            description=d.description
        )
        for d in template_data.dimensions
    ]
    
    text_fields = [
        TextField(
            name=f.name,
            required=f.required,
            max_length=f.max_length,
            placeholder=f.placeholder
        )
        for f in template_data.text_fields
    ]
    
    # 创建模板对象
    now = datetime.utcnow()
    template = ScoringTemplate(
        name=template_data.name,
        description=template_data.description,
        dimensions=dimensions,
        text_fields=text_fields,
        is_default=False,
        is_system=False,
        created_by=current_user.id,  # 直接使用字符串ID
        created_at=now,
        updated_at=now
    )
    
    # 插入数据库
    result = await db.scoring_templates.insert_one(template.to_mongo())
    template.id = str(result.inserted_id)
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.TEMPLATE_CREATE,
        resource_type=ResourceType.TEMPLATE,
        resource_id=template.id,
        details={
            "template_name": template.name,
            "dimensions_count": len(dimensions)
        }
    )
    
    return template


async def update_template(
    db: AsyncIOMotorDatabase,
    template_id: str,
    template_data: TemplateUpdate,
    current_user: User
) -> ScoringTemplate:
    """
    更新评分模板
    
    Args:
        db: 数据库实例
        template_id: 模板ID
        template_data: 模板更新数据
        current_user: 当前用户
        
    Returns:
        ScoringTemplate: 更新后的模板对象
        
    Raises:
        ResourceNotFoundError: 模板不存在
        BusinessRuleError: 业务规则错误（系统模板、被使用等）
        ValidationError: 数据验证失败
    """
    # 检查模板是否存在
    template = await get_template_by_id(db, template_id)
    
    # 检查是否为系统预置模板
    if template.is_system:
        raise BusinessRuleError(
            message="系统预置模板不能修改",
            details={"template_id": template_id, "template_name": template.name}
        )
    
    # 检查是否有 active 状态的场次正在使用该模板
    active_session_count = await db.sessions.count_documents({
        "scoring_template_id": ObjectId(template_id),
        "status": "active"
    })
    if active_session_count > 0:
        raise BusinessRuleError(
            message="已有正在激活的面试场次正在使用该模板",
            details={
                "template_id": template_id,
                "template_name": template.name,
                "active_session_count": active_session_count
            }
        )
    
    # 构建更新数据
    update_data = {}
    
    if template_data.name is not None:
        update_data["name"] = template_data.name
    
    if template_data.description is not None:
        update_data["description"] = template_data.description
    
    if template_data.dimensions is not None:
        # 转换维度 (验证已在schema层完成)
        dimensions = [
            Dimension(
                name=d.name,
                weight=d.weight,
                max_score=d.max_score,
                score_type=d.score_type,
                description=d.description
            )
            for d in template_data.dimensions
        ]
        update_data["dimensions"] = [d.model_dump() for d in dimensions]
    
    if template_data.text_fields is not None:
        # 转换文本字段
        text_fields = [
            TextField(
                name=f.name,
                required=f.required,
                max_length=f.max_length,
                placeholder=f.placeholder
            )
            for f in template_data.text_fields
        ]
        update_data["text_fields"] = [f.model_dump() for f in text_fields]
    
    # 更新时间
    update_data["updated_at"] = datetime.utcnow()
    
    # 执行更新
    await db.scoring_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": update_data}
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.TEMPLATE_UPDATE,
        resource_type=ResourceType.TEMPLATE,
        resource_id=template_id,
        details={
            "template_name": template.name,
            "updated_fields": list(update_data.keys())
        }
    )
    
    # 返回更新后的模板
    return await get_template_by_id(db, template_id)


async def delete_template(
    db: AsyncIOMotorDatabase,
    template_id: str,
    current_user: User
) -> None:
    """
    删除评分模板
    
    Args:
        db: 数据库实例
        template_id: 模板ID
        current_user: 当前用户
        
    Raises:
        ResourceNotFoundError: 模板不存在
        BusinessRuleError: 业务规则错误（系统模板、默认模板、被使用等）
    """
    # 检查模板是否存在
    template = await get_template_by_id(db, template_id)
    
    # 检查是否为系统预置模板
    if template.is_system:
        raise BusinessRuleError(
            message="系统预置模板不能删除",
            details={"template_id": template_id, "template_name": template.name}
        )
    
    # 检查是否为默认模板
    if template.is_default:
        raise BusinessRuleError(
            message="默认模板不能删除",
            details={"template_id": template_id, "template_name": template.name}
        )
    
    # 检查模板是否被场次使用
    session_count = await db.sessions.count_documents({"template_id": ObjectId(template_id)})
    if session_count > 0:
        raise BusinessRuleError(
            message="该模板已被场次使用，不能删除",
            details={
                "template_id": template_id,
                "template_name": template.name,
                "session_count": session_count
            }
        )
    
    # 物理删除模板
    await db.scoring_templates.delete_one({"_id": ObjectId(template_id)})
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.TEMPLATE_DELETE,
        resource_type=ResourceType.TEMPLATE,
        resource_id=template_id,
        details={
            "template_name": template.name
        }
    )


async def set_default_template(
    db: AsyncIOMotorDatabase,
    template_id: str,
    current_user: User
) -> ScoringTemplate:
    """
    设置默认模板
    
    Args:
        db: 数据库实例
        template_id: 模板ID
        current_user: 当前用户
        
    Returns:
        ScoringTemplate: 设置后的模板对象
        
    Raises:
        ResourceNotFoundError: 模板不存在
    """
    # 检查模板是否存在
    template = await get_template_by_id(db, template_id)
    
    # 将所有模板的is_default设为False
    await db.scoring_templates.update_many(
        {},
        {"$set": {"is_default": False}}
    )
    
    # 将指定模板的is_default设为True
    await db.scoring_templates.update_one(
        {"_id": ObjectId(template_id)},
        {"$set": {"is_default": True, "updated_at": datetime.utcnow()}}
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.TEMPLATE_UPDATE,
        resource_type=ResourceType.TEMPLATE,
        resource_id=template_id,
        details={
            "template_name": template.name,
            "action": "set_default"
        }
    )
    
    # 返回更新后的模板
    return await get_template_by_id(db, template_id)
