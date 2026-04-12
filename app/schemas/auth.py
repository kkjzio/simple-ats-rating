"""
认证相关Schema
"""
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole, UserProfile
from app.utils.validators import validate_password_strength


class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名或手机号")
    password: str = Field(..., min_length=1, description="密码")
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "Admin@123"
            }
        }


class TokenResponse(BaseModel):
    """令牌响应"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 7200
            }
        }


class UserInfo(BaseModel):
    """用户信息"""
    id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    role: UserRole = Field(..., description="角色")
    profile: UserProfile = Field(..., description="用户资料")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef12345",
                "username": "admin",
                "role": "super_admin",
                "profile": {
                    "name": "系统管理员",
                    "phone": "13800138000",
                    "email": "admin@company.com",
                    "avatar": "/assets/avatars/default_admin.png",
                    "department": "人力资源部"
                }
            }
        }


class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")
    user: UserInfo = Field(..., description="用户信息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 7200,
                "user": {
                    "id": "6761234567890abcdef12345",
                    "username": "admin",
                    "role": "super_admin",
                    "profile": {
                        "name": "系统管理员",
                        "phone": "13800138000",
                        "email": "admin@company.com",
                        "avatar": "/assets/avatars/default_admin.png",
                        "department": "人力资源部"
                    }
                }
            }
        }


class RefreshTokenRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str = Field(..., description="刷新令牌")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., min_length=1, description="原密码")
    new_password: str = Field(..., min_length=8, max_length=20, description="新密码")
    confirm_password: str = Field(..., min_length=8, max_length=20, description="确认密码")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """验证新密码强度"""
        validate_password_strength(v)
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def validate_confirm_password(cls, v: str, info) -> str:
        """验证确认密码"""
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError("两次输入的密码不一致")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "old_password": "OldPass@123",
                "new_password": "NewPass@123",
                "confirm_password": "NewPass@123"
            }
        }


class ResetPasswordRequest(BaseModel):
    """重置密码请求（超管操作）"""
    user_id: str = Field(..., description="用户ID")
    new_password: str = Field(..., min_length=8, max_length=20, description="新密码")
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """验证新密码强度"""
        validate_password_strength(v)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "6761234567890abcdef12346",
                "new_password": "NewPass@123"
            }
        }
