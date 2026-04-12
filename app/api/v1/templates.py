"""
评分模板路由
仅超级管理员可访问
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, require_super_admin , require_interviewer
from app.models.user import User
from app.schemas.template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse
)
from app.schemas.common import MessageResponse
from app.services import template_service
from app.utils.response import success_response
import math


router = APIRouter()


@router.get("", response_model=TemplateListResponse, summary="获取模板列表")
async def get_templates(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(default=None, description="搜索关键词"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    获取评分模板列表（分页、搜索）
    
    - **page**: 页码，从1开始
    - **page_size**: 每页数量，最大100
    - **keyword**: 搜索关键词，支持模板名称和描述的模糊搜索
    
    需要超级管理员权限
    """
    templates, total = await template_service.get_template_list(
        db=db,
        page=page,
        page_size=page_size,
        keyword=keyword
    )
    
    # 转换为响应格式
    items = [
        TemplateResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            dimensions=t.dimensions,
            text_fields=t.text_fields,
            is_default=t.is_default,
            is_system=t.is_system,
            created_by=str(t.created_by) if t.created_by else None,
            created_at=t.created_at,
            updated_at=t.updated_at
        )
        for t in templates
    ]
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return TemplateListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{template_id}", response_model=TemplateResponse, summary="获取模板详情")
async def get_template(
    template_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """
    根据ID获取模板详情
    
    - **template_id**: 模板ID
    
    需要超级管理员权限或评委权限
    """
    template = await template_service.get_template_by_id(db, template_id)
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        dimensions=template.dimensions,
        text_fields=template.text_fields,
        is_default=template.is_default,
        is_system=template.is_system,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


@router.post("", response_model=TemplateResponse, summary="创建模板", status_code=201)
async def create_template(
    template_data: TemplateCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    创建评分模板
    
    - **name**: 模板名称（必填，1-100字符）
    - **description**: 模板描述（可选，最多500字符）
    - **dimensions**: 评分维度列表（必填，1-10个维度）
        - **name**: 维度名称（必填，1-50字符）
        - **weight**: 权重（必填，0-100，所有维度权重之和必须等于100）
        - **max_score**: 最高分（必填，1-100）
        - **score_type**: 评分类型（可选，默认decimal）
        - **description**: 维度说明（可选，最多200字符）
    - **text_fields**: 文本评语字段（可选）
        - **name**: 字段名称（必填，1-50字符）
        - **required**: 是否必填（可选，默认false）
        - **max_length**: 最大字符数（可选，默认500，1-2000）
        - **placeholder**: 输入提示（可选，最多100字符）
    
    需要超级管理员权限
    
    **验证规则**：
    - 所有维度权重之和必须等于100
    - 维度名称不能重复
    - 至少有1个维度，最多10个维度
    """
    template = await template_service.create_template(
        db=db,
        template_data=template_data,
        current_user=current_user
    )
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        dimensions=template.dimensions,
        text_fields=template.text_fields,
        is_default=template.is_default,
        is_system=template.is_system,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


@router.put("/{template_id}", response_model=TemplateResponse, summary="更新模板")
async def update_template(
    template_id: str,
    template_data: TemplateUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    更新评分模板
    
    - **template_id**: 模板ID
    - **name**: 模板名称（可选，1-100字符）
    - **description**: 模板描述（可选，最多500字符）
    - **dimensions**: 评分维度列表（可选，1-10个维度）
    - **text_fields**: 文本评语字段（可选）
    
    需要超级管理员权限
    
    **业务规则**：
    - 系统预置模板（is_system=True）不能修改
    - 被场次使用的模板不能修改
    - 如果更新维度，权重之和必须等于100
    """
    template = await template_service.update_template(
        db=db,
        template_id=template_id,
        template_data=template_data,
        current_user=current_user
    )
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        dimensions=template.dimensions,
        text_fields=template.text_fields,
        is_default=template.is_default,
        is_system=template.is_system,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


@router.delete("/{template_id}", response_model=MessageResponse, summary="删除模板")
async def delete_template(
    template_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    删除评分模板
    
    - **template_id**: 模板ID
    
    需要超级管理员权限
    
    **业务规则**：
    - 系统预置模板（is_system=True）不能删除
    - 默认模板（is_default=True）不能删除
    - 被场次使用的模板不能删除
    """
    await template_service.delete_template(
        db=db,
        template_id=template_id,
        current_user=current_user
    )
    
    return MessageResponse(message="模板删除成功")


@router.post("/{template_id}/set-default", response_model=TemplateResponse, summary="设置默认模板")
async def set_default_template(
    template_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    设置默认模板
    
    - **template_id**: 模板ID
    
    需要超级管理员权限
    
    **说明**：
    - 同一时间只能有一个默认模板
    - 设置新的默认模板时，会自动取消其他模板的默认状态
    """
    template = await template_service.set_default_template(
        db=db,
        template_id=template_id,
        current_user=current_user
    )
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        description=template.description,
        dimensions=template.dimensions,
        text_fields=template.text_fields,
        is_default=template.is_default,
        is_system=template.is_system,
        created_by=str(template.created_by) if template.created_by else None,
        created_at=template.created_at,
        updated_at=template.updated_at
    )
