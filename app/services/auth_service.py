"""
认证服务
处理用户登录、登出、令牌刷新、密码修改等认证相关业务逻辑
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.models.user import User, UserStatus
from app.models.operation_log import ActionType, ResourceType
from app.schemas.auth import LoginResponse, TokenResponse, UserInfo
from app.utils.validators import validate_password_strength


async def login(
    db: AsyncIOMotorDatabase,
    username: str,
    password: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> LoginResponse:
    """
    用户登录
    
    Args:
        db: 数据库实例
        username: 用户名或手机号
        password: 密码
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        LoginResponse: 登录响应（包含token和用户信息）
        
    Raises:
        AuthenticationError: 认证失败
    """
    # 查找用户（支持用户名或手机号登录）
    user_data = await db.users.find_one({
        "$or": [
            {"username": username},
            {"profile.phone": username}
        ]
    })
    if not user_data:
        raise AuthenticationError(message="用户名或密码错误")
    
    user = User.from_mongo(user_data)
    
    # 验证密码
    if not verify_password(password, user.password_hash):
        raise AuthenticationError(message="用户名或密码错误")
    
    # 检查账户状态
    if user.status == UserStatus.INACTIVE:
        raise AuthenticationError(message="账户已被禁用，请联系管理员")
    elif user.status == UserStatus.LOCKED:
        raise AuthenticationError(message="账户已被锁定，请联系管理员")
    
    # 生成访问令牌
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    # 生成刷新令牌（有效期为访问令牌的2倍）
    refresh_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes * 2)
    refresh_token = create_access_token(
        data={"sub": user.id, "type": "refresh"},
        expires_delta=refresh_token_expires
    )
    
    # 更新最后登录时间
    await db.users.update_one(
        {"_id": ObjectId(user.id)},
        {"$set": {"last_login_at": datetime.utcnow()}}
    )
    
    # 记录登录日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=user.id,
        action=ActionType.USER_LOGIN,
        resource_type=ResourceType.USER,
        resource_id=user.id,
        details={
            "username": username,
            "login_time": datetime.utcnow().isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # 构造响应
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,  # 转换为秒
        user=UserInfo(
            id=user.id,
            username=user.username,
            role=user.role,
            profile=user.profile
        )
    )


async def refresh_token(
    db: AsyncIOMotorDatabase,
    refresh_token: str
) -> TokenResponse:
    """
    刷新访问令牌
    
    Args:
        db: 数据库实例
        refresh_token: 刷新令牌
        
    Returns:
        TokenResponse: 新的访问令牌
        
    Raises:
        AuthenticationError: 令牌无效
    """
    from app.core.security import decode_access_token
    
    # 解码刷新令牌
    payload = decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise AuthenticationError(message="无效的刷新令牌")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError(message="无效的刷新令牌")
    
    # 验证用户是否存在且状态正常
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise AuthenticationError(message="用户不存在")
    
    user = User.from_mongo(user_data)
    if user.status != UserStatus.ACTIVE:
        raise AuthenticationError(message="账户已被禁用或锁定")
    
    # 生成新的访问令牌
    access_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    # 生成新的刷新令牌
    refresh_token_expires = timedelta(minutes=settings.jwt_access_token_expire_minutes * 2)
    new_refresh_token = create_access_token(
        data={"sub": user.id, "type": "refresh"},
        expires_delta=refresh_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60
    )


async def logout(
    db: AsyncIOMotorDatabase,
    user_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """
    用户登出
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        ip_address: IP地址
        user_agent: 浏览器UA
    """
    # 记录登出日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=user_id,
        action=ActionType.USER_LOGOUT,
        resource_type=ResourceType.USER,
        resource_id=user_id,
        details={
            "logout_time": datetime.utcnow().isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )


async def change_password(
    db: AsyncIOMotorDatabase,
    user_id: str,
    old_password: str,
    new_password: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """
    修改密码
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        old_password: 旧密码
        new_password: 新密码
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Raises:
        AuthenticationError: 旧密码错误
        ValidationError: 新密码不符合要求
    """
    # 获取用户信息
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise AuthenticationError(message="用户不存在")
    
    user = User.from_mongo(user_data)
    
    # 验证旧密码
    if not verify_password(old_password, user.password_hash):
        raise AuthenticationError(message="原密码错误")
    
    # 验证新密码强度
    try:
        validate_password_strength(new_password)
    except ValueError as e:
        raise ValidationError(message=str(e))
    
    # 检查新密码是否与旧密码相同
    if old_password == new_password:
        raise ValidationError(message="新密码不能与原密码相同")
    
    # 更新密码
    new_password_hash = get_password_hash(new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # 记录操作日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=user_id,
        action=ActionType.USER_PASSWORD_RESET,
        resource_type=ResourceType.USER,
        resource_id=user_id,
        details={
            "change_time": datetime.utcnow().isoformat(),
            "changed_by": "self"
        },
        ip_address=ip_address,
        user_agent=user_agent
    )
