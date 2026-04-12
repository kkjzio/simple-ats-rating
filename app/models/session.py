"""
场次模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import get_current_time, ensure_timezone


class SessionStatus(str, Enum):
    """场次状态枚举"""
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class SessionSettings(BaseModel):
    """场次设置"""
    anonymous_mode: bool = Field(default=True, description="是否匿名评分")
    pass_threshold: float = Field(default=70.0, ge=0, le=100, description="通过分数线")
    extreme_score_threshold: float = Field(default=30.0, ge=0, le=100, description="极端分预警阈值（百分比）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "anonymous_mode": True,
                "pass_threshold": 70,
                "extreme_score_threshold": 30
            }
        }


class SessionStatistics(BaseModel):
    """场次统计信息"""
    total_candidates: int = Field(default=0, ge=0, description="候选人总数")
    total_interviewers: int = Field(default=0, ge=0, description="评委总数")
    completed_scores: int = Field(default=0, ge=0, description="已完成评分数")
    average_score: float = Field(default=0.0, ge=0, description="平均分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_candidates": 25,
                "total_interviewers": 5,
                "completed_scores": 100,
                "average_score": 75.6
            }
        }


class Session(BaseModel):
    """场次模型"""
    id: Optional[str] = Field(None, alias="_id", description="场次ID")
    name: str = Field(..., min_length=1, max_length=200, description="场次名称")
    date: datetime = Field(..., description="面试日期")
    position: str = Field(..., min_length=1, max_length=100, description="岗位名称")
    round: int = Field(..., ge=1, le=10, description="面试轮次（1初面/2复面/3终面）")
    status: SessionStatus = Field(default=SessionStatus.DRAFT, description="场次状态")
    scoring_template_id: str = Field(..., description="关联评分模板ID")
    qr_code_url: Optional[str] = Field(None, description="二维码图片URL")
    qr_code_token: Optional[str] = Field(None, description="二维码访问令牌")
    qr_code_expires_at: Optional[datetime] = Field(None, description="二维码过期时间")
    settings: SessionSettings = Field(default_factory=SessionSettings, description="场次设置")
    statistics: SessionStatistics = Field(default_factory=SessionStatistics, description="统计信息")
    created_by: Optional[str] = Field(None, description="创建人ID")
    created_at: datetime = Field(default_factory=get_current_time, description="创建时间（UTC）")
    updated_at: datetime = Field(default_factory=get_current_time, description="更新时间（UTC）")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.strftime('%Y-%m-%dT%H:%M:%SZ') if v else None
        }
        json_schema_extra = {
            "example": {
                "_id": "6761234567890abcdef20001",
                "name": "2024年春招技术岗初面",
                "date": "2024-03-15T00:00:00Z",
                "position": "Java后端工程师",
                "round": 1,
                "status": "active",
                "scoring_template_id": "6761234567890abcdef10001",
                "qr_code_url": "/uploads/qrcodes/session_20001.png",
                "qr_code_token": "sess_token_abc123xyz",
                "qr_code_expires_at": "2024-03-16T00:00:00Z",
                "settings": {
                    "anonymous_mode": True,
                    "pass_threshold": 70,
                    "extreme_score_threshold": 30
                },
                "statistics": {
                    "total_candidates": 25,
                    "total_interviewers": 5,
                    "completed_scores": 100,
                    "average_score": 75.6
                },
                "created_by": "6761234567890abcdef12345",
                "created_at": "2024-03-01T00:00:00Z",
                "updated_at": "2024-03-15T18:00:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'scoring_template_id' in d and d['scoring_template_id']:
            d['scoring_template_id'] = str(d['scoring_template_id'])
        if 'created_by' in d and d['created_by']:
            d['created_by'] = str(d['created_by'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "Session":
        """从MongoDB数据创建Session对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'scoring_template_id' in data and data['scoring_template_id']:
            data['scoring_template_id'] = str(data['scoring_template_id'])
        if 'created_by' in data and data['created_by']:
            data['created_by'] = str(data['created_by'])
        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['date', 'qr_code_expires_at', 'created_at', 'updated_at']:
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
        if 'scoring_template_id' in data and data['scoring_template_id']:
            data['scoring_template_id'] = ObjectId(data['scoring_template_id'])
        if 'created_by' in data and data['created_by']:
            data['created_by'] = ObjectId(data['created_by'])
        return data
