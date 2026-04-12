"""
场次评委关系模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class InterviewerStatus(str, Enum):
    """评委状态枚举"""
    INVITED = "invited"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class InterviewerStatistics(BaseModel):
    """评委统计信息"""
    total_assigned: int = Field(default=0, ge=0, description="分配的候选人数")
    completed_count: int = Field(default=0, ge=0, description="已完成评分数")
    average_score: float = Field(default=0.0, ge=0, description="该评委给出的平均分")
    score_std_dev: float = Field(default=0.0, ge=0, description="评分标准差")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_assigned": 25,
                "completed_count": 25,
                "average_score": 76.8,
                "score_std_dev": 8.2
            }
        }


class SessionInterviewer(BaseModel):
    """场次评委关系模型"""
    id: Optional[str] = Field(None, alias="_id", description="关系ID")
    session_id: str = Field(..., description="场次ID")
    interviewer_id: str = Field(..., description="评委ID")
    assigned_candidates: List[str] = Field(
        default_factory=list,
        description="分配的候选人ID列表（空数组表示评所有人）"
    )
    status: InterviewerStatus = Field(default=InterviewerStatus.INVITED, description="评委状态")
    joined_at: Optional[datetime] = Field(None, description="加入时间（扫码绑定时间）")
    statistics: InterviewerStatistics = Field(
        default_factory=InterviewerStatistics,
        description="评委统计信息"
    )
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
                "_id": "6761234567890abcdef40001",
                "session_id": "6761234567890abcdef20001",
                "interviewer_id": "6761234567890abcdef12346",
                "assigned_candidates": [],
                "status": "accepted",
                "joined_at": "2024-03-15T08:00:00Z",
                "statistics": {
                    "total_assigned": 25,
                    "completed_count": 25,
                    "average_score": 76.8,
                    "score_std_dev": 8.2
                },
                "created_at": "2024-03-01T00:00:00Z",
                "updated_at": "2024-03-15T18:00:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'session_id' in d and d['session_id']:
            d['session_id'] = str(d['session_id'])
        if 'interviewer_id' in d and d['interviewer_id']:
            d['interviewer_id'] = str(d['interviewer_id'])
        if 'assigned_candidates' in d and d['assigned_candidates']:
            d['assigned_candidates'] = [str(cid) for cid in d['assigned_candidates']]
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "SessionInterviewer":
        """从MongoDB数据创建SessionInterviewer对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'session_id' in data and data['session_id']:
            data['session_id'] = str(data['session_id'])
        if 'interviewer_id' in data and data['interviewer_id']:
            data['interviewer_id'] = str(data['interviewer_id'])
        if 'assigned_candidates' in data and data['assigned_candidates']:
            data['assigned_candidates'] = [str(cid) for cid in data['assigned_candidates']]
        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['joined_at', 'created_at', 'updated_at']:
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
        if 'interviewer_id' in data and data['interviewer_id']:
            data['interviewer_id'] = ObjectId(data['interviewer_id'])
        if 'assigned_candidates' in data and data['assigned_candidates']:
            data['assigned_candidates'] = [ObjectId(cid) for cid in data['assigned_candidates']]
        return data
