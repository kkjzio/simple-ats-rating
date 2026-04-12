"""
用户相关Schema
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole, UserStatus, UserProfile
from app.utils.validators import validate_phone, validate_email, validate_password_strength


class UserProfileSchema(BaseModel):
    """用户资料Schema"""
    name: str = Field(..., min_length=1, max_length=50, description="真实姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")
    department: Optional[str] = Field(None, max_length=100, description="部门")
    
    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        """验证手机号格式"""
        validate_phone(v)
        return v
    
    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        """验证邮箱格式"""
        if v:
            validate_email(v)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "张三",
                "phone": "13800138000",
                "email": "zhangsan@company.com",
                "avatar": "/uploads/avatars/zhangsan.jpg",
                "department": "人力资源部"
            }
        }


class UserCreate(BaseModel):
    """创建用户请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=8, max_length=20, description="密码")
    role: UserRole = Field(..., description="角色")
    profile: UserProfileSchema = Field(..., description="用户资料")
    
    @field_validator('password')
    @classmethod
    def validate_password_format(cls, v: str) -> str:
        """验证密码强度"""
        validate_password_strength(v)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "interviewer001",
                "password": "Pass@123",
                "role": "interviewer",
                "profile": {
                    "name": "李四",
                    "phone": "13800138001",
                    "email": "lisi@company.com",
                    "department": "技术部"
                }
            }
        }


class UserUpdate(BaseModel):
    """更新用户请求"""
    profile: Optional[UserProfileSchema] = Field(None, description="用户资料")
    status: Optional[UserStatus] = Field(None, description="账户状态")
    
    class Config:
        json_schema_extra = {
            "example": {
                "profile": {
                    "name": "李四",
                    "phone": "13800138001",
                    "email": "lisi@company.com",
                    "department": "技术部"
                },
                "status": "active"
            }
        }


class UserResponse(BaseModel):
    """用户响应"""
    id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    role: UserRole = Field(..., description="角色")
    profile: UserProfile = Field(..., description="用户资料")
    status: UserStatus = Field(..., description="账户状态")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True
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
                },
                "status": "active",
                "last_login_at": "2024-01-15T10:00:00Z",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-15T10:00:00Z"
            }
        }


class UserListResponse(BaseModel):
    """用户列表响应"""
    items: list[UserResponse] = Field(..., description="用户列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    total_pages: int = Field(..., ge=0, description="总页数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "6761234567890abcdef12345",
                        "username": "admin",
                        "role": "super_admin",
                        "profile": {
                            "name": "系统管理员",
                            "phone": "13800138000",
                            "email": "admin@company.com",
                            "avatar": "/assets/avatars/default_admin.png",
                            "department": "人力资源部"
                        },
                        "status": "active",
                        "last_login_at": "2024-03-15T10:00:00Z",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2024-01-15T10:00:00Z"
                    }
                ],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5
            }
        }


class ImportInterviewerRow(BaseModel):
    """导入评委行数据"""
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    department: Optional[str] = Field(None, description="部门")
    
    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        """验证手机号格式"""
        validate_phone(v)
        return v
    
    @field_validator('email')
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        """验证邮箱格式"""
        if v:
            validate_email(v)
        return v


class ImportResult(BaseModel):
    """导入结果"""
    total: int = Field(..., ge=0, description="总数")
    success: int = Field(..., ge=0, description="成功数")
    failed: int = Field(..., ge=0, description="失败数")
    errors: list[dict] = Field(default_factory=list, description="错误列表")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 10,
                "success": 8,
                "failed": 2,
                "errors": [
                    {
                        "row": 3,
                        "reason": "手机号已存在"
                    },
                    {
                        "row": 5,
                        "reason": "邮箱格式错误"
                    }
                ]
            }
        }


class PasswordResetRequest(BaseModel):
    """密码重置请求"""
    user_id: str = Field(..., description="要重置密码的用户ID")
    new_password: str = Field(..., min_length=8, max_length=20, description="新密码")
    
    @field_validator('new_password')
    @classmethod
    def validate_password_format(cls, v: str) -> str:
        """验证密码强度"""
        validate_password_strength(v)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "6761234567890abcdef12345",
                "new_password": "NewPass@123"
            }
        }


class PasswordResetResponse(BaseModel):
    """密码重置响应"""
    user_id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    message: str = Field(..., description="操作结果消息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "6761234567890abcdef12345",
                "username": "interviewer001",
                "message": "密码重置成功"
            }
        }
