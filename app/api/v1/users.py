"""
用户管理路由
处理用户CRUD、批量导入等接口（仅超级管理员）
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, require_super_admin
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    ImportResult,
    PasswordResetRequest,
    PasswordResetResponse
)
from app.schemas.common import SuccessResponse
from app.services import user_service
from app.utils.response import success_response
from math import ceil


router = APIRouter()


def get_client_info(request: Request) -> tuple[str, str]:
    """
    获取客户端信息
    
    Args:
        request: 请求对象
        
    Returns:
        tuple[str, str]: (IP地址, User-Agent)
    """
    # 获取真实IP（考虑代理）
    ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
    if not ip:
        ip = request.headers.get("X-Real-IP", "")
    if not ip:
        ip = request.client.host if request.client else "unknown"
    
    # 获取User-Agent
    user_agent = request.headers.get("User-Agent", "unknown")
    
    return ip, user_agent


@router.get("", response_model=SuccessResponse[UserListResponse], summary="获取用户列表")
async def get_users(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    role: Optional[str] = Query(default=None, description="角色筛选"),
    status: Optional[str] = Query(default=None, description="状态筛选"),
    keyword: Optional[str] = Query(default=None, description="关键词搜索"),
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取用户列表（分页、筛选）
    
    - **page**: 页码
    - **page_size**: 每页数量
    - **role**: 角色筛选（可选）
    - **status**: 状态筛选（可选）
    - **keyword**: 关键词搜索（用户名、姓名、手机号）
    
    需要超级管理员权限
    """
    users, total = await user_service.get_user_list(
        db=db,
        page=page,
        page_size=page_size,
        role=role,
        status=status,
        keyword=keyword
    )
    
    # 转换为响应格式
    user_responses = [
        UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            profile=user.profile,
            status=user.status,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        for user in users
    ]
    
    result = UserListResponse(
        items=user_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0
    )
    
    return success_response(data=result)


@router.post("", response_model=SuccessResponse[UserResponse], summary="创建用户")
async def create_user(
    request: Request,
    user_data: UserCreate,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    创建新用户
    
    - **username**: 用户名（3-50位）
    - **password**: 密码（8-20位，必须包含大小写字母、数字和特殊字符）
    - **role**: 角色（super_admin/interviewer/candidate）
    - **profile**: 用户资料
    
    需要超级管理员权限
    """
    ip_address, user_agent = get_client_info(request)
    
    user = await user_service.create_user(
        db=db,
        user_data=user_data,
        operator_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        profile=user.profile,
        status=user.status,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return success_response(data=user_response, message="用户创建成功")


@router.get("/{user_id}", response_model=SuccessResponse[UserResponse], summary="获取用户详情")
async def get_user(
    user_id: str,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取指定用户的详细信息
    
    - **user_id**: 用户ID
    
    需要超级管理员权限
    """
    user = await user_service.get_user_by_id(db=db, user_id=user_id)
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        profile=user.profile,
        status=user.status,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return success_response(data=user_response)


@router.put("/{user_id}", response_model=SuccessResponse[UserResponse], summary="更新用户信息")
async def update_user(
    request: Request,
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    更新用户信息
    
    - **user_id**: 用户ID
    - **profile**: 用户资料（可选）
    - **status**: 账户状态（可选）
    
    需要超级管理员权限
    """
    ip_address, user_agent = get_client_info(request)
    
    user = await user_service.update_user(
        db=db,
        user_id=user_id,
        user_data=user_data,
        operator_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        role=user.role,
        profile=user.profile,
        status=user.status,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return success_response(data=user_response, message="用户信息更新成功")


@router.delete("/{user_id}", response_model=SuccessResponse[None], summary="删除用户")
async def delete_user(
    request: Request,
    user_id: str,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    删除用户（软删除，状态改为inactive）
    
    - **user_id**: 用户ID
    
    注意：评委如果已有评分记录则不能删除
    
    需要超级管理员权限
    """
    ip_address, user_agent = get_client_info(request)
    
    await user_service.delete_user(
        db=db,
        user_id=user_id,
        operator_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return success_response(message="用户删除成功")


@router.post("/reset-password", response_model=SuccessResponse[PasswordResetResponse], summary="重置用户密码")
async def reset_user_password(
    request: Request,
    reset_data: PasswordResetRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    重置指定用户的密码（仅超级管理员）
    
    - **user_id**: 要重置密码的用户ID
    - **new_password**: 新密码（8-20位，必须包含大小写字母、数字和特殊字符）
    
    此功能只有超级管理员可以使用，用于帮助用户重置忘记的密码。
    新密码会经过安全哈希加密后存储，操作会记录到系统日志中。
    
    需要超级管理员权限
    """
    ip_address, user_agent = get_client_info(request)
    
    result = await user_service.reset_user_password(
        db=db,
        user_id=reset_data.user_id,
        new_password=reset_data.new_password,
        operator_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return success_response(data=result, message="密码重置成功")


@router.post("/import-interviewers", response_model=SuccessResponse[ImportResult], summary="批量导入评委")
async def import_interviewers(
    request: Request,
    file: UploadFile = File(..., description="Excel文件"),
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    批量导入评委
    
    Excel格式要求：
    - 第一行为表头：姓名、手机号、邮箱（可选）、部门（可选）
    - 从第二行开始为数据
    - 用户名自动生成为：interviewer_手机号
    - 默认密码为：手机号后6位@Abc
    
    需要超级管理员权限
    """
    ip_address, user_agent = get_client_info(request)
    
    result = await user_service.import_interviewers(
        db=db,
        file=file,
        operator_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    message = f"导入完成：成功 {result.success} 条，失败 {result.failed} 条"
    
    return success_response(data=result, message=message)
