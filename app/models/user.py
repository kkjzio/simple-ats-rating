"""
用户模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class UserRole(str, Enum):
    """用户角色枚举"""
    SUPER_ADMIN = "super_admin"
    INTERVIEWER = "interviewer"
    CANDIDATE = "candidate"


class UserStatus(str, Enum):
    """用户状态枚举"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    LOCKED = "locked"


class UserProfile(BaseModel):
    """用户资料"""
    name: str = Field(..., description="真实姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")
    department: Optional[str] = Field(None, description="部门")
    
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


class User(BaseModel):
    """用户模型"""
    id: Optional[str] = Field(None, alias="_id", description="用户ID")
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password_hash: str = Field(..., description="密码哈希（bcrypt加密）")
    role: UserRole = Field(..., description="角色")
    profile: UserProfile = Field(..., description="用户资料")
    status: UserStatus = Field(default=UserStatus.ACTIVE, description="账户状态")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "_id": "6761234567890abcdef12345",
                "username": "admin",
                "password": "$2b$10$...",
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
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "User":
        """从MongoDB数据创建User对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])

        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['last_login_at', 'created_at', 'updated_at']:
            if field in data and data[field] is not None:
                data[field] = ensure_timezone(data[field], assume_utc=True)

        return cls(**data)
    
    def to_mongo(self) -> dict:
        """转换为MongoDB文档格式"""
        data = self.dict(by_alias=True, exclude_none=False)
        if '_id' in data and data['_id']:
            data['_id'] = ObjectId(data['_id'])
        elif '_id' in data:
            del data['_id']
        return data
