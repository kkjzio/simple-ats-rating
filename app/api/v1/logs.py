"""
日志路由
处理操作日志查询接口（仅超级管理员）
"""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from math import ceil

from app.api.deps import get_db, require_super_admin
from app.models.user import User
from app.models.operation_log import OperationLog
from app.schemas.common import SuccessResponse
from app.services import log_service
from app.utils.response import success_response
from pydantic import BaseModel, Field


router = APIRouter()


class OperationLogResponse(BaseModel):
    """操作日志响应"""
    id: str = Field(..., description="日志ID")
    user_id: str = Field(..., description="操作人ID")
    action: str = Field(..., description="操作类型")
    resource_type: str = Field(..., description="资源类型")
    resource_id: Optional[str] = Field(None, description="资源ID")
    details: dict = Field(..., description="详细信息")
    ip_address: Optional[str] = Field(None, description="IP地址")
    user_agent: Optional[str] = Field(None, description="浏览器UA")
    created_at: str = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class LogListResponse(BaseModel):
    """日志列表响应"""
    items: list[OperationLogResponse] = Field(..., description="日志列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    total_pages: int = Field(..., ge=0, description="总页数")


@router.get("", response_model=SuccessResponse[LogListResponse], summary="获取操作日志列表")
async def get_logs(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    user_id: Optional[str] = Query(default=None, description="操作人ID筛选"),
    action: Optional[str] = Query(default=None, description="操作类型筛选"),
    resource_type: Optional[str] = Query(default=None, description="资源类型筛选"),
    date_from: Optional[date] = Query(default=None, description="开始日期"),
    date_to: Optional[date] = Query(default=None, description="结束日期"),
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取操作日志列表（分页、筛选）
    
    - **page**: 页码
    - **page_size**: 每页数量
    - **user_id**: 操作人ID筛选（可选）
    - **action**: 操作类型筛选（可选）
    - **resource_type**: 资源类型筛选（可选）
    - **date_from**: 开始日期（可选）
    - **date_to**: 结束日期（可选）
    
    需要超级管理员权限
    """
    logs, total = await log_service.get_logs(
        db=db,
        page=page,
        page_size=page_size,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        date_from=date_from,
        date_to=date_to
    )
    
    # 转换为响应格式
    log_responses = [
        OperationLogResponse(
            id=log.id,
            user_id=log.user_id,
            action=log.action.value,
            resource_type=log.resource_type.value,
            resource_id=log.resource_id,
            details=log.details,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            created_at=log.created_at.isoformat()
        )
        for log in logs
    ]
    
    result = LogListResponse(
        items=log_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0
    )
    
    return success_response(data=result)
