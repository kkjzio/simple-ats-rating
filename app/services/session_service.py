"""
场次服务
处理场次的CRUD操作、二维码生成、评委绑定等
"""

from datetime import timedelta
from datetime import date as DateType
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.session import Session, SessionStatus, SessionSettings, SessionStatistics
from app.models.session_interviewer import SessionInterviewer
from app.models.user import User, UserRole
from app.models.operation_log import ActionType, ResourceType
from app.schemas.session import SessionCreate, SessionUpdate
from app.core.exceptions import ResourceNotFoundError, ValidationError, BusinessRuleError, PermissionDeniedError
from app.services.log_service import create_log
from app.utils.qrcode_utils import generate_qrcode_token, generate_qrcode_image
from app.utils.datetime import get_current_time, ensure_timezone


async def get_session_list(
    db: AsyncIOMotorDatabase,
    page: int = 1,
    page_size: int = 20,
    status: Optional[SessionStatus] = None,
    date_from: Optional[DateType] = None,
    date_to: Optional[DateType] = None,
    keyword: Optional[str] = None
) -> tuple[List[Session], int]:
    """
    获取场次列表（分页、筛选、搜索）
    
    Args:
        db: 数据库实例
        page: 页码
        page_size: 每页数量
        status: 状态筛选
        date_from: 开始日期
        date_to: 结束日期
        keyword: 搜索关键词（场次名称、岗位）
        
    Returns:
        tuple[List[Session], int]: (场次列表, 总数)
    """
    # 构建查询条件
    query = {}
    
    if status:
        query["status"] = status.value
    
    if date_from or date_to:
        date_query = {}
        if date_from:
            # 将日期转换为UTC datetime（当天开始）
            date_query["$gte"] = get_current_time().replace(
                year=date_from.year,
                month=date_from.month,
                day=date_from.day,
                hour=0,
                minute=0,
                second=0,
                microsecond=0
            )
        if date_to:
            # 将日期转换为UTC datetime（当天结束）
            date_query["$lte"] = get_current_time().replace(
                year=date_to.year,
                month=date_to.month,
                day=date_to.day,
                hour=23,
                minute=59,
                second=59,
                microsecond=999999
            )
        query["date"] = date_query
    
    if keyword:
        # 支持场次名称和岗位的模糊搜索
        query["$or"] = [
            {"name": {"$regex": keyword, "$options": "i"}},
            {"position": {"$regex": keyword, "$options": "i"}}
        ]
    
    # 计算总数
    total = await db.sessions.count_documents(query)
    
    # 分页查询，按创建时间倒序
    skip = (page - 1) * page_size
    cursor = db.sessions.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    
    sessions = []
    async for session_data in cursor:
        sessions.append(Session.from_mongo(session_data))
    
    return sessions, total


async def get_session_by_id(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> Session:
    """
    根据ID获取场次详情
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        Session: 场次对象
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    try:
        session_data = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    if not session_data:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    return Session.from_mongo(session_data)


async def create_session(
    db: AsyncIOMotorDatabase,
    session_data: SessionCreate,
    current_user: User
) -> Session:
    """
    创建场次
    
    Args:
        db: 数据库实例
        session_data: 场次创建数据
        current_user: 当前用户
        
    Returns:
        Session: 创建的场次对象
        
    Raises:
        ResourceNotFoundError: 评分模板不存在
        ValidationError: 数据验证失败
    """
    # 验证评分模板是否存在
    try:
        template = await db.scoring_templates.find_one({"_id": ObjectId(session_data.scoring_template_id)})
        if not template:
            raise ResourceNotFoundError(resource_type="评分模板", resource_id=session_data.scoring_template_id)
    except Exception as e:
        if isinstance(e, ResourceNotFoundError):
            raise
        raise ResourceNotFoundError(resource_type="评分模板", resource_id=session_data.scoring_template_id)
    
    # 生成二维码token
    qr_token = generate_qrcode_token()
    
    # 生成二维码图片
    _, qr_url = generate_qrcode_image(qr_token)
    
    # 设置二维码过期时间（24小时）
    qr_expires_at = get_current_time() + timedelta(hours=24)
    
    # 创建场次对象
    now = get_current_time()
    session_date = session_data.date
    
    session = Session(
        name=session_data.name,
        date=session_date,
        position=session_data.position,
        round=session_data.round,
        status=SessionStatus.DRAFT,
        scoring_template_id=session_data.scoring_template_id,
        qr_code_url=qr_url,
        qr_code_token=qr_token,
        qr_code_expires_at=qr_expires_at,
        settings=SessionSettings(**session_data.settings.model_dump()),
        statistics=SessionStatistics(),
        created_by=current_user.id,
        created_at=now,
        updated_at=now
    )
    
    # 插入数据库
    result = await db.sessions.insert_one(session.to_mongo())
    session.id = str(result.inserted_id)
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_CREATE,
        resource_type=ResourceType.SESSION,
        resource_id=session.id,
        details={
            "session_name": session.name,
            "position": session.position,
            "round": session.round
        }
    )
    
    return session


async def update_session(
    db: AsyncIOMotorDatabase,
    session_id: str,
    session_data: SessionUpdate,
    current_user: User
) -> Session:
    """
    更新场次
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        session_data: 场次更新数据
        current_user: 当前用户
        
    Returns:
        Session: 更新后的场次对象
        
    Raises:
        ResourceNotFoundError: 场次不存在
        BusinessRuleError: 业务规则错误（已完成等）
    """
    # 检查场次是否存在
    session = await get_session_by_id(db, session_id)
    
    # 检查是否已完成
    if session.status == SessionStatus.COMPLETED:
        raise BusinessRuleError(
            message="已完成的场次不能修改",
            details={"session_id": session_id, "session_name": session.name}
        )
    
    # 如果修改了评分模板，检查是否已有评分记录
    if session_data.scoring_template_id and session_data.scoring_template_id != session.scoring_template_id:
        score_count = await db.scores.count_documents({"session_id": ObjectId(session_id)})
        if score_count > 0:
            raise BusinessRuleError(
                message="该场次已有评分记录，不能修改评分模板",
                details={
                    "session_id": session_id,
                    "session_name": session.name,
                    "score_count": score_count
                }
            )
        
        # 验证新模板是否存在
        try:
            template = await db.scoring_templates.find_one({"_id": ObjectId(session_data.scoring_template_id)})
            if not template:
                raise ResourceNotFoundError(resource_type="评分模板", resource_id=session_data.scoring_template_id)
        except Exception as e:
            if isinstance(e, ResourceNotFoundError):
                raise
            raise ResourceNotFoundError(resource_type="评分模板", resource_id=session_data.scoring_template_id)
    
    # 构建更新数据
    update_data = {}
    
    if session_data.name is not None:
        update_data["name"] = session_data.name
    
    if session_data.date is not None:
        update_data["date"] = session_data.date
    
    if session_data.position is not None:
        update_data["position"] = session_data.position
    
    if session_data.round is not None:
        update_data["round"] = session_data.round
    
    if session_data.scoring_template_id is not None:
        update_data["scoring_template_id"] = ObjectId(session_data.scoring_template_id)
    
    if session_data.settings is not None:
        update_data["settings"] = session_data.settings.model_dump()
    
    if session_data.description is not None:
        update_data["description"] = session_data.description
    
    # 更新时间
    update_data["updated_at"] = get_current_time()
    
    # 执行更新
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_data}
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_UPDATE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name,
            "updated_fields": list(update_data.keys())
        }
    )
    
    # 返回更新后的场次
    return await get_session_by_id(db, session_id)


async def delete_session(
    db: AsyncIOMotorDatabase,
    session_id: str,
    current_user: User
) -> None:
    """
    删除场次
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        current_user: 当前用户
        
    Raises:
        ResourceNotFoundError: 场次不存在
        BusinessRuleError: 业务规则错误（有评分记录等）
    """
    # 检查场次是否存在
    session = await get_session_by_id(db, session_id)
    
    # 检查是否有评分记录
    score_count = await db.scores.count_documents({"session_id": ObjectId(session_id)})
    if score_count > 0:
        raise BusinessRuleError(
            message="该场次已有评分记录，不能删除，只能归档",
            details={
                "session_id": session_id,
                "session_name": session.name,
                "score_count": score_count
            }
        )
    
    # 删除关联的session_interviewers记录
    await db.session_interviewers.delete_many({"session_id": ObjectId(session_id)})
    
    # 物理删除场次
    await db.sessions.delete_one({"_id": ObjectId(session_id)})
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_DELETE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name
        }
    )


async def update_session_status(
    db: AsyncIOMotorDatabase,
    session_id: str,
    new_status: SessionStatus,
    current_user: User
) -> Session:
    """
    更新场次状态
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        new_status: 新状态
        current_user: 当前用户
        
    Returns:
        Session: 更新后的场次对象
        
    Raises:
        ResourceNotFoundError: 场次不存在
        BusinessRuleError: 状态流转不合法
    """
    # 检查场次是否存在
    session = await get_session_by_id(db, session_id)
    
    # 验证状态流转合法性
    valid_transitions = {
        SessionStatus.DRAFT: [SessionStatus.ACTIVE],
        SessionStatus.ACTIVE: [SessionStatus.COMPLETED],
        SessionStatus.COMPLETED: [SessionStatus.ARCHIVED],
        SessionStatus.ARCHIVED: []
    }
    
    if new_status not in valid_transitions.get(session.status, []):
        raise BusinessRuleError(
            message=f"不能从 {session.status.value} 状态转换到 {new_status.value} 状态",
            details={
                "session_id": session_id,
                "current_status": session.status.value,
                "new_status": new_status.value
            }
        )
    
    # 更新状态
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": new_status.value, "updated_at": get_current_time()}}
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_UPDATE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name,
            "action": "update_status",
            "old_status": session.status.value,
            "new_status": new_status.value
        }
    )
    
    # 返回更新后的场次
    return await get_session_by_id(db, session_id)


async def regenerate_qrcode(
    db: AsyncIOMotorDatabase,
    session_id: str,
    current_user: User
) -> Dict[str, Any]:
    """
    重新生成二维码
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        current_user: 当前用户
        
    Returns:
        Dict[str, Any]: 二维码信息
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    # 检查场次是否存在
    session = await get_session_by_id(db, session_id)
    
    # 生成新的token
    qr_token = generate_qrcode_token()
    
    # 生成新的二维码图片
    _, qr_url = generate_qrcode_image(qr_token)
    
    # 设置新的过期时间
    qr_expires_at = get_current_time() + timedelta(hours=24)
    
    # 更新数据库
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "qr_code_url": qr_url,
                "qr_code_token": qr_token,
                "qr_code_expires_at": qr_expires_at,
                "updated_at": get_current_time()
            }
        }
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_UPDATE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name,
            "action": "regenerate_qrcode"
        }
    )
    
    return {
        "qr_code_url": qr_url,
        "qr_code_token": qr_token,
        "expires_at": qr_expires_at
    }


async def join_session_by_qrcode(
    db: AsyncIOMotorDatabase,
    qr_code_token: str,
    current_user: User
) -> Session:
    """
    评委扫码绑定场次
    
    Args:
        db: 数据库实例
        qr_code_token: 二维码token
        current_user: 当前用户
        
    Returns:
        Session: 场次对象
        
    Raises:
        ResourceNotFoundError: token无效
        ValidationError: token过期
        PermissionDeniedError: 用户角色不是评委
        BusinessRuleError: 已绑定
    """
    # 检查用户角色
    if current_user.role != UserRole.INTERVIEWER:
        raise PermissionDeniedError(message="只有评委可以扫码绑定场次")
    
    # 查找场次
    session_data = await db.sessions.find_one({"qr_code_token": qr_code_token})
    if not session_data:
        raise ResourceNotFoundError(resource_type="二维码", resource_id=qr_code_token)
    
    session = Session.from_mongo(session_data)
    
    # 检查token是否过期
    if session.qr_code_expires_at and session.qr_code_expires_at < get_current_time():
        raise ValidationError(
            message="二维码已过期",
            details={"expires_at": session.qr_code_expires_at.isoformat()}
        )
    
    # 检查是否已绑定
    existing = await db.session_interviewers.find_one({
        "session_id": ObjectId(session.id),
        "interviewer_id": ObjectId(current_user.id)
    })
    
    if existing:
        raise BusinessRuleError(
            message="您已绑定该场次",
            details={"session_id": session.id, "session_name": session.name}
        )
    
    # 创建绑定记录
    now = get_current_time()
    interviewer_record = SessionInterviewer(
        session_id=session.id,
        interviewer_id=current_user.id,
        joined_at=now
    )
    
    await db.session_interviewers.insert_one(interviewer_record.to_mongo())
    
    # 更新场次统计信息
    interviewer_count = await db.session_interviewers.count_documents({"session_id": ObjectId(session.id)})
    await db.sessions.update_one(
        {"_id": ObjectId(session.id)},
        {"$set": {"statistics.total_interviewers": interviewer_count}}
    )
    
    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_JOIN,
        resource_type=ResourceType.SESSION,
        resource_id=session.id,
        details={
            "session_name": session.name,
            "interviewer_name": current_user.username
        }
    )
    
    return session


async def assign_interviewers(
    db: AsyncIOMotorDatabase,
    session_id: str,
    interviewer_ids: List[str],
    current_user: User
) -> int:
    """
    分配评委

    Args:
        db: 数据库实例
        session_id: 场次ID
        interviewer_ids: 评委ID列表
        current_user: 当前用户

    Returns:
        int: 新增的评委数量

    Raises:
        ResourceNotFoundError: 场次不存在或评委不存在
    """
    # 检查场次是否存在
    session = await get_session_by_id(db, session_id)

    # 验证所有评委是否存在且角色正确
    for interviewer_id in interviewer_ids:
        try:
            user = await db.users.find_one({"_id": ObjectId(interviewer_id)})
            if not user:
                raise ResourceNotFoundError(resource_type="评委", resource_id=interviewer_id)
            if user.get("role") != UserRole.INTERVIEWER.value:
                raise ValidationError(
                    message=f"用户 {interviewer_id} 不是评委角色",
                    details={"user_id": interviewer_id}
                )
        except Exception as e:
            if isinstance(e, (ResourceNotFoundError, ValidationError)):
                raise
            raise ResourceNotFoundError(resource_type="评委", resource_id=interviewer_id)

    # 批量创建绑定记录（跳过已存在的）
    now = get_current_time()
    added_count = 0

    for interviewer_id in interviewer_ids:
        # 检查是否已绑定
        existing = await db.session_interviewers.find_one({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(interviewer_id)
        })

        if not existing:
            interviewer_record = SessionInterviewer(
                session_id=session_id,
                interviewer_id=interviewer_id,
                joined_at=now
            )
            await db.session_interviewers.insert_one(interviewer_record.to_mongo())
            added_count += 1

    # 更新场次统计信息
    interviewer_count = await db.session_interviewers.count_documents({"session_id": ObjectId(session_id)})
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"statistics.total_interviewers": interviewer_count}}
    )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_UPDATE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name,
            "action": "assign_interviewers",
            "added_count": added_count,
            "total_interviewers": interviewer_count
        }
    )

    return added_count


async def remove_interviewer(
    db: AsyncIOMotorDatabase,
    session_id: str,
    interviewer_id: str,
    current_user: User
) -> None:
    """解绑场次评委（仅 draft 场次允许）"""
    session = await get_session_by_id(db, session_id)

    if session.status != SessionStatus.DRAFT:
        raise BusinessRuleError(
            message="仅草稿场次允许管理评委",
            details={
                "session_id": session_id,
                "session_status": session.status.value
            }
        )

    existing = await db.session_interviewers.find_one({
        "session_id": ObjectId(session_id),
        "interviewer_id": ObjectId(interviewer_id)
    })

    if not existing:
        raise BusinessRuleError(
            message="该评委未绑定到当前场次",
            details={
                "session_id": session_id,
                "interviewer_id": interviewer_id
            }
        )

    await db.session_interviewers.delete_one({"_id": existing["_id"]})

    interviewer_count = await db.session_interviewers.count_documents({"session_id": ObjectId(session_id)})
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"statistics.total_interviewers": interviewer_count}}
    )

    await create_log(
        db=db,
        user_id=current_user.id,
        action=ActionType.SESSION_UPDATE,
        resource_type=ResourceType.SESSION,
        resource_id=session_id,
        details={
            "session_name": session.name,
            "action": "remove_interviewer",
            "interviewer_id": interviewer_id,
            "total_interviewers": interviewer_count
        }
    )


async def get_session_interviewers(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> List[Dict[str, Any]]:
    """
    获取场次评委列表
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        List[Dict[str, Any]]: 评委信息列表
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    # 检查场次是否存在
    await get_session_by_id(db, session_id)
    
    # 查询评委绑定记录
    cursor = db.session_interviewers.find({"session_id": ObjectId(session_id)})
    
    interviewers = []
    async for record in cursor:
        # 获取评委详细信息
        user = await db.users.find_one({"_id": record["interviewer_id"]})
        if user:
            # 从 profile 中获取用户信息（用户数据存储在 profile 对象中）
            profile = user.get("profile", {})

            # 确保 joined_at 带有时区信息
            joined_at = record.get("joined_at")
            if joined_at is not None:
                joined_at = ensure_timezone(joined_at, assume_utc=True)

            interviewers.append({
                "id": str(user["_id"]),
                "username": user.get("username"),
                "real_name": profile.get("name"),
                "email": profile.get("email"),
                "joined_at": joined_at
            })
    
    return interviewers
