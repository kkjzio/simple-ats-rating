"""
依赖注入
"""
from typing import Optional, Callable
from functools import wraps
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import JWTError, jwt
from bson import ObjectId

from app.db.mongodb import get_database
from app.core.config import settings
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.models.user import User, UserRole
from app.schemas.common import PaginationParams


# HTTP Bearer认证
security = HTTPBearer()


async def get_db() -> AsyncIOMotorDatabase:
    """
    获取数据库连接
    
    Returns:
        AsyncIOMotorDatabase: 数据库实例
    """
    return await get_database()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> User:
    """
    获取当前登录用户（JWT验证）
    
    Args:
        credentials: HTTP认证凭据
        db: 数据库实例
        
    Returns:
        User: 当前用户对象
        
    Raises:
        AuthenticationError: 认证失败
    """
    token = credentials.credentials
    
    try:
        # 解码JWT token
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthenticationError(message="无效的认证令牌")
    except JWTError:
        raise AuthenticationError(message="无效的认证令牌")
    
    # 从数据库获取用户信息
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_data is None:
        raise AuthenticationError(message="用户不存在")
    
    user = User.from_mongo(user_data)
    
    # 检查用户状态
    if user.status != "active":
        raise AuthenticationError(message="账户已被禁用或锁定")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前活跃用户
    
    Args:
        current_user: 当前用户
        
    Returns:
        User: 当前用户对象
        
    Raises:
        AuthenticationError: 用户未激活
    """
    if current_user.status != "active":
        raise AuthenticationError(message="用户账户未激活")
    return current_user


def require_role(*allowed_roles: UserRole) -> Callable:
    """
    角色权限验证装饰器
    
    Args:
        *allowed_roles: 允许的角色列表
        
    Returns:
        Callable: 装饰器函数
        
    Raises:
        PermissionDeniedError: 权限不足
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 从kwargs中获取current_user
            current_user = kwargs.get('current_user')
            if not current_user:
                raise AuthenticationError(message="未提供用户认证信息")
            
            if current_user.role not in allowed_roles:
                raise PermissionDeniedError(
                    message=f"需要以下角色之一: {', '.join([r.value for r in allowed_roles])}",
                    details={
                        "required_roles": [r.value for r in allowed_roles],
                        "user_role": current_user.role.value
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求超级管理员权限
    
    Args:
        current_user: 当前用户
        
    Returns:
        User: 当前用户对象
        
    Raises:
        PermissionDeniedError: 权限不足
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise PermissionDeniedError(message="需要超级管理员权限")
    return current_user


async def require_interviewer(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求评委权限
    
    Args:
        current_user: 当前用户
        
    Returns:
        User: 当前用户对象
        
    Raises:
        PermissionDeniedError: 权限不足
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.INTERVIEWER]:
        raise PermissionDeniedError(message="需要评委或管理员权限")
    return current_user


async def require_candidate(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求候选人权限
    
    Args:
        current_user: 当前用户
        
    Returns:
        User: 当前用户对象
        
    Raises:
        PermissionDeniedError: 权限不足
    """
    if current_user.role != UserRole.CANDIDATE:
        raise PermissionDeniedError(message="需要候选人权限")
    return current_user


async def get_pagination(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量")
) -> PaginationParams:
    """
    分页参数提取
    
    Args:
        page: 页码
        page_size: 每页数量
        
    Returns:
        PaginationParams: 分页参数对象
    """
    return PaginationParams(page=page, page_size=page_size)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Optional[User]:
    """
    获取可选的当前用户（用于公开接口）
    
    Args:
        credentials: HTTP认证凭据（可选）
        db: 数据库实例
        
    Returns:
        Optional[User]: 当前用户对象或None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except AuthenticationError:
        return None
