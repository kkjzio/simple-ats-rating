"""
候选人模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class CandidateStatus(str, Enum):
    """候选人状态枚举"""
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PASSED = "passed"
    REJECTED = "rejected"
    ABSENT = "absent"


class Candidate(BaseModel):
    """候选人模型"""
    id: Optional[str] = Field(None, alias="_id", description="候选人ID")
    user_id: str = Field(..., description="关联用户ID")
    session_id: str = Field(..., description="关联场次ID")
    order: int = Field(..., ge=1, description="面试顺序号")
    resume_url: Optional[str] = Field(None, description="简历文件URL（旧字段，向后兼容）")
    resume_filename: Optional[str] = Field(None, description="简历原始文件名（旧字段，向后兼容）")
    resume_files: Optional[list] = Field(None, description="简历文件列表，每项包含 url 和 filename")
    status: CandidateStatus = Field(default=CandidateStatus.WAITING, description="候选人状态")
    notes: Optional[str] = Field(None, max_length=1000, description="备注信息")
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
                "_id": "6761234567890abcdef30001",
                "user_id": "6761234567890abcdef12347",
                "session_id": "6761234567890abcdef20001",
                "order": 1,
                "resume_url": "/uploads/resumes/wangwu_resume.pdf",
                "resume_filename": "王五_Java开发_简历.pdf",
                "status": "completed",
                "notes": "",
                "created_at": "2024-03-10T00:00:00Z",
                "updated_at": "2024-03-15T15:30:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'user_id' in d and d['user_id']:
            d['user_id'] = str(d['user_id'])
        if 'session_id' in d and d['session_id']:
            d['session_id'] = str(d['session_id'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "Candidate":
        """从MongoDB数据创建Candidate对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'user_id' in data and data['user_id']:
            data['user_id'] = str(data['user_id'])
        if 'session_id' in data and data['session_id']:
            data['session_id'] = str(data['session_id'])
        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['created_at', 'updated_at']:
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
        if 'user_id' in data and data['user_id']:
            data['user_id'] = ObjectId(data['user_id'])
        if 'session_id' in data and data['session_id']:
            data['session_id'] = ObjectId(data['session_id'])
        return data
