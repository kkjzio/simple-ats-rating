"""
操作日志模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class ActionType(str, Enum):
    """操作类型枚举"""
    # 用户相关
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_PASSWORD_RESET = "user_password_reset"
    
    # 场次相关
    SESSION_CREATE = "session_create"
    SESSION_UPDATE = "session_update"
    SESSION_DELETE = "session_delete"
    SESSION_STATUS_CHANGE = "session_status_change"
    SESSION_QR_REGENERATE = "session_qr_regenerate"
    
    # 候选人相关
    CANDIDATE_CREATE = "candidate_create"
    CANDIDATE_IMPORT = "candidate_import"
    CANDIDATE_UPDATE = "candidate_update"
    CANDIDATE_DELETE = "candidate_delete"
    CANDIDATE_ORDER_CHANGE = "candidate_order_change"
    
    # 评分相关
    SCORE_DRAFT_SAVE = "score_draft_save"
    SCORE_SUBMIT = "score_submit"
    SCORE_ADMIN_MODIFY = "score_admin_modify"
    SCORE_ADMIN_DELETE = "score_admin_delete"
    
    # 模板相关
    TEMPLATE_CREATE = "template_create"
    TEMPLATE_UPDATE = "template_update"
    TEMPLATE_DELETE = "template_delete"
    
    # 导出相关
    EXPORT_CANDIDATE_SCORES = "export_candidate_scores"
    EXPORT_INTERVIEWER_STATS = "export_interviewer_stats"


class ResourceType(str, Enum):
    """资源类型枚举"""
    SESSION = "session"
    CANDIDATE = "candidate"
    SCORE = "score"
    USER = "user"
    TEMPLATE = "template"


class OperationLog(BaseModel):
    """操作日志模型"""
    id: Optional[str] = Field(None, alias="_id", description="日志ID")
    user_id: str = Field(..., description="操作人ID")
    action: ActionType = Field(..., description="操作类型")
    resource_type: ResourceType = Field(..., description="资源类型")
    resource_id: Optional[str] = Field(None, description="资源ID")
    details: dict[str, Any] = Field(default_factory=dict, description="详细信息")
    ip_address: Optional[str] = Field(None, description="IP地址")
    user_agent: Optional[str] = Field(None, description="浏览器UA")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "_id": "6761234567890abcdef60001",
                "user_id": "6761234567890abcdef12346",
                "action": "score_submit",
                "resource_type": "score",
                "resource_id": "6761234567890abcdef50001",
                "details": {
                    "session_name": "2024年春招技术岗初面",
                    "candidate_name": "王五",
                    "total_score": 8.525,
                    "dimension_scores": [
                        {"dimension_name": "专业能力", "score": 8.5},
                        {"dimension_name": "沟通表达", "score": 9.0},
                        {"dimension_name": "文化匹配", "score": 8.0},
                        {"dimension_name": "综合潜力", "score": 8.5}
                    ]
                },
                "ip_address": "192.168.1.100",
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) ...",
                "created_at": "2024-03-15T10:30:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'user_id' in d and d['user_id']:
            d['user_id'] = str(d['user_id'])
        if 'resource_id' in d and d['resource_id']:
            d['resource_id'] = str(d['resource_id'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "OperationLog":
        """从MongoDB数据创建OperationLog对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'user_id' in data and data['user_id']:
            data['user_id'] = str(data['user_id'])
        if 'resource_id' in data and data['resource_id']:
            data['resource_id'] = str(data['resource_id'])
        # 确保 datetime 字段带有 UTC 时区信息
        if 'created_at' in data and data['created_at'] is not None:
            data['created_at'] = ensure_timezone(data['created_at'], assume_utc=True)
        return cls(**data)
    
    def to_mongo(self) -> dict:
        """转换为MongoDB文档格式"""
        data = self.dict(by_alias=True, exclude_none=True)  # 改为exclude_none=True，排除None值
        if '_id' in data and data['_id']:
            data['_id'] = ObjectId(data['_id'])
        elif '_id' in data:
            del data['_id']
        
        # 处理user_id
        if 'user_id' in data and data['user_id']:
            data['user_id'] = ObjectId(data['user_id'])
        
        # 处理resource_id
        if 'resource_id' in data and data['resource_id']:
            data['resource_id'] = ObjectId(data['resource_id'])
        
        return data
