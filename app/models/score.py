"""
评分记录模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class ScoreStatus(str, Enum):
    """评分状态枚举"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    MODIFIED_BY_ADMIN = "modified_by_admin"


class DimensionScore(BaseModel):
    """维度得分"""
    dimension_name: str = Field(..., description="维度名称")
    score: float = Field(..., ge=0, description="原始得分")
    weight: float = Field(..., ge=0, le=100, description="权重")
    weighted_score: float = Field(..., ge=0, description="加权得分（score * weight / 100）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_name": "专业能力",
                "score": 8.5,
                "weight": 35,
                "weighted_score": 2.975
            }
        }


class TextFeedback(BaseModel):
    """文本评语"""
    field_name: str = Field(..., description="评语字段名")
    content: str = Field(..., description="评语内容")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field_name": "综合评语",
                "content": "候选人技术基础扎实，表达清晰，有较强的学习能力。"
            }
        }


class Score(BaseModel):
    """评分记录模型"""
    id: Optional[str] = Field(None, alias="_id", description="评分ID")
    session_id: str = Field(..., description="场次ID")
    candidate_id: str = Field(..., description="候选人ID")
    interviewer_id: str = Field(..., description="评委ID")
    dimension_scores: List[DimensionScore] = Field(..., description="各维度得分")
    total_score: float = Field(..., ge=0, description="加权总分")
    text_feedbacks: List[TextFeedback] = Field(default_factory=list, description="文本评语")
    status: ScoreStatus = Field(default=ScoreStatus.DRAFT, description="评分状态")
    is_locked: bool = Field(default=False, description="是否锁定（提交后锁定）")
    submitted_at: Optional[datetime] = Field(None, description="提交时间")
    modify_reason: Optional[str] = Field(None, description="修改原因")
    modified_by: Optional[str] = Field(None, description="修改人ID（超管修改时记录）")
    modified_at: Optional[datetime] = Field(None, description="修改时间")
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
                "_id": "6761234567890abcdef50001",
                "session_id": "6761234567890abcdef20001",
                "candidate_id": "6761234567890abcdef30001",
                "interviewer_id": "6761234567890abcdef12346",
                "dimension_scores": [
                    {
                        "dimension_name": "专业能力",
                        "score": 8.5,
                        "weight": 35,
                        "weighted_score": 2.975
                    },
                    {
                        "dimension_name": "沟通表达",
                        "score": 9.0,
                        "weight": 25,
                        "weighted_score": 2.25
                    },
                    {
                        "dimension_name": "文化匹配",
                        "score": 8.0,
                        "weight": 20,
                        "weighted_score": 1.6
                    },
                    {
                        "dimension_name": "综合潜力",
                        "score": 8.5,
                        "weight": 20,
                        "weighted_score": 1.7
                    }
                ],
                "total_score": 8.525,
                "text_feedbacks": [
                    {
                        "field_name": "综合评语",
                        "content": "候选人技术基础扎实，表达清晰，有较强的学习能力。"
                    },
                    {
                        "field_name": "技术评语",
                        "content": "Java基础扎实，对Spring框架有深入理解，有分布式系统开发经验。"
                    }
                ],
                "status": "submitted",
                "is_locked": True,
                "submitted_at": "2024-03-15T10:30:00Z",
                "modified_by": None,
                "modified_at": None,
                "created_at": "2024-03-15T10:00:00Z",
                "updated_at": "2024-03-15T10:30:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'session_id' in d and d['session_id']:
            d['session_id'] = str(d['session_id'])
        if 'candidate_id' in d and d['candidate_id']:
            d['candidate_id'] = str(d['candidate_id'])
        if 'interviewer_id' in d and d['interviewer_id']:
            d['interviewer_id'] = str(d['interviewer_id'])
        if 'modified_by' in d and d['modified_by']:
            d['modified_by'] = str(d['modified_by'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "Score":
        """从MongoDB数据创建Score对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'session_id' in data and data['session_id']:
            data['session_id'] = str(data['session_id'])
        if 'candidate_id' in data and data['candidate_id']:
            data['candidate_id'] = str(data['candidate_id'])
        if 'interviewer_id' in data and data['interviewer_id']:
            data['interviewer_id'] = str(data['interviewer_id'])
        if 'modified_by' in data and data['modified_by']:
            data['modified_by'] = str(data['modified_by'])
        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['submitted_at', 'modified_at', 'created_at', 'updated_at']:
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
        if 'session_id' in data and data['session_id']:
            data['session_id'] = ObjectId(data['session_id'])
        if 'candidate_id' in data and data['candidate_id']:
            data['candidate_id'] = ObjectId(data['candidate_id'])
        if 'interviewer_id' in data and data['interviewer_id']:
            data['interviewer_id'] = ObjectId(data['interviewer_id'])
        if 'modified_by' in data and data['modified_by']:
            data['modified_by'] = ObjectId(data['modified_by'])
        return data
