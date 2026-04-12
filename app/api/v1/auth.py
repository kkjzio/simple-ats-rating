"""
认证路由
处理用户登录、登出、令牌刷新、密码修改等认证相关接口
"""

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    TokenResponse,
    ChangePasswordRequest,
    UserInfo
)
from app.schemas.common import SuccessResponse
from app.services import auth_service
from app.utils.response import success_response


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


@router.post("/login", response_model=SuccessResponse[LoginResponse], summary="用户登录")
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    用户登录接口
    
    - **username**: 用户名或手机号
    - **password**: 密码
    
    返回访问令牌和用户信息
    """
    ip_address, user_agent = get_client_info(request)
    
    result = await auth_service.login(
        db=db,
        username=login_data.username,
        password=login_data.password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return success_response(data=result, message="登录成功")


@router.post("/refresh", response_model=SuccessResponse[TokenResponse], summary="刷新令牌")
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    刷新访问令牌
    
    - **refresh_token**: 刷新令牌
    
    返回新的访问令牌和刷新令牌
    """
    result = await auth_service.refresh_token(
        db=db,
        refresh_token=refresh_data.refresh_token
    )
    
    return success_response(data=result, message="令牌刷新成功")


@router.post("/logout", response_model=SuccessResponse[None], summary="用户登出")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    用户登出接口
    
    需要认证
    """
    ip_address, user_agent = get_client_info(request)
    
    await auth_service.logout(
        db=db,
        user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return success_response(message="登出成功")


@router.get("/me", response_model=SuccessResponse[UserInfo], summary="获取当前用户信息")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    获取当前登录用户的信息
    
    需要认证
    """
    user_info = UserInfo(
        id=current_user.id,
        username=current_user.username,
        role=current_user.role,
        profile=current_user.profile
    )
    
    return success_response(data=user_info)


@router.post("/change-password", response_model=SuccessResponse[None], summary="修改密码")
async def change_password(
    request: Request,
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    修改当前用户密码
    
    - **old_password**: 原密码
    - **new_password**: 新密码（8-20位，必须包含大小写字母、数字和特殊字符）
    - **confirm_password**: 确认密码
    
    需要认证
    """
    ip_address, user_agent = get_client_info(request)
    
    await auth_service.change_password(
        db=db,
        user_id=current_user.id,
        old_password=password_data.old_password,
        new_password=password_data.new_password,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return success_response(message="密码修改成功，请重新登录")
