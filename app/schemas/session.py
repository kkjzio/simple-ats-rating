"""
场次相关Schema
"""
from datetime import datetime
from datetime import date as DateType
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.session import SessionStatus
from app.utils.datetime import get_current_time, to_utc, ensure_timezone


class SessionSettingsSchema(BaseModel):
    """场次设置Schema"""
    anonymous_mode: bool = Field(default=False, description="是否匿名评分")
    pass_threshold: float = Field(default=60.0, ge=0, le=100, description="通过分数线")
    extreme_score_threshold: float = Field(default=30.0, ge=0, le=100, description="极端分预警阈值")
    
    class Config:
        json_schema_extra = {
            "example": {
                "anonymous_mode": True,
                "pass_threshold": 70.0,
                "extreme_score_threshold": 30.0
            }
        }


class SessionStatisticsSchema(BaseModel):
    """场次统计Schema"""
    total_interviewers: int = Field(default=0, ge=0, description="评委总数")
    total_candidates: int = Field(default=0, ge=0, description="候选人总数")
    scored_candidates: int = Field(default=0, ge=0, description="已评分候选人数")
    passed_candidates: int = Field(default=0, ge=0, description="通过人数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_interviewers": 5,
                "total_candidates": 20,
                "scored_candidates": 15,
                "passed_candidates": 10
            }
        }


class SessionCreate(BaseModel):
    """创建场次请求"""
    name: str = Field(..., min_length=1, max_length=100, description="场次名称")
    date: datetime = Field(
        ...,
        description="面试日期时间（支持多时区输入，后端统一转换为UTC存储）。示例：'2026-03-15T10:00:00Z'（UTC）或 '2026-03-15T18:00:00+08:00'（东8区）"
    )
    position: str = Field(..., min_length=1, max_length=100, description="面试岗位")
    round: int = Field(..., ge=1, le=10, description="面试轮次")
    scoring_template_id: str = Field(..., description="评分模板ID")
    settings: SessionSettingsSchema = Field(default_factory=SessionSettingsSchema, description="场次设置")
    description: Optional[str] = Field(None, max_length=500, description="场次描述")
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        """
        验证日期不能为过去时间
        接收任意时区的时间，统一转换为UTC时间存储
        """
        # 获取当前UTC时间
        now_utc = get_current_time()
        
        # 确保输入时间有时区信息（默认假设为UTC）
        v = ensure_timezone(v, assume_utc=True)
        
        # 转换为UTC时间进行比较和存储
        v_utc = to_utc(v)
        
        # 比较时间（都是UTC时间）
        if v_utc < now_utc:
            raise ValueError("面试日期不能为过去时间")
        
        # 返回UTC时间用于存储
        return v_utc
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "2024年春招技术岗初面",
                "date": "2026-03-15T10:00:00Z",
                "position": "Java后端工程师",
                "round": 1,
                "scoring_template_id": "6761234567890abcdef10001",
                "settings": {
                    "anonymous_mode": True,
                    "pass_threshold": 70.0,
                    "extreme_score_threshold": 30.0
                },
                "description": "春季校园招聘技术岗位初试"
            }
        }


class SessionUpdate(BaseModel):
    """更新场次请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="场次名称")
    date: Optional[datetime] = Field(None, description="面试日期时间")
    position: Optional[str] = Field(None, min_length=1, max_length=100, description="面试岗位")
    round: Optional[int] = Field(None, ge=1, le=10, description="面试轮次")
    scoring_template_id: Optional[str] = Field(None, description="评分模板ID")
    settings: Optional[SessionSettingsSchema] = Field(None, description="场次设置")
    description: Optional[str] = Field(None, max_length=500, description="场次描述")
    
    @field_validator('date')
    @classmethod
    def validate_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """
        验证日期不能为过去时间
        接收任意时区的时间，统一转换为UTC时间存储
        """
        if v is not None:
            # 获取当前UTC时间
            now_utc = get_current_time()
            
            # 确保输入时间有时区信息（默认假设为UTC）
            v = ensure_timezone(v, assume_utc=True)
            
            # 转换为UTC时间进行比较和存储
            v_utc = to_utc(v)
            
            # 比较时间（都是UTC时间）
            if v_utc < now_utc:
                raise ValueError("面试日期不能为过去时间")
            
            # 返回UTC时间用于存储
            return v_utc
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "2024年春招技术岗初面（更新）",
                "settings": {
                    "pass_threshold": 75.0
                }
            }
        }


class SessionResponse(BaseModel):
    """场次响应"""
    id: str = Field(..., description="场次ID")
    name: str = Field(..., description="场次名称")
    date: datetime = Field(..., description="面试日期时间（UTC）")
    position: str = Field(..., description="面试岗位")
    round: int = Field(..., description="面试轮次")
    status: SessionStatus = Field(..., description="场次状态")
    scoring_template_id: str = Field(..., description="评分模板ID")
    settings: SessionSettingsSchema = Field(..., description="场次设置")
    statistics: SessionStatisticsSchema = Field(..., description="统计信息")
    description: Optional[str] = Field(None, description="场次描述")
    qr_code_url: Optional[str] = Field(None, description="二维码URL")
    qr_code_expires_at: Optional[datetime] = Field(None, description="二维码过期时间（UTC）")
    created_by: str = Field(..., description="创建人ID")
    created_at: datetime = Field(..., description="创建时间（UTC）")
    updated_at: datetime = Field(..., description="更新时间（UTC）")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef20001",
                "name": "2024年春招技术岗初面",
                "date": "2026-03-15T10:00:00Z",
                "position": "Java后端工程师",
                "round": 1,
                "status": "active",
                "scoring_template_id": "6761234567890abcdef10001",
                "settings": {
                    "anonymous_mode": True,
                    "pass_threshold": 70.0,
                    "extreme_score_threshold": 30.0
                },
                "statistics": {
                    "total_interviewers": 5,
                    "total_candidates": 20,
                    "scored_candidates": 15,
                    "passed_candidates": 10
                },
                "description": "春季校园招聘技术岗位初试",
                "qr_code_url": "/uploads/qrcodes/abc123.png",
                "qr_code_expires_at": "2026-03-16T10:00:00Z",
                "created_by": "6761234567890abcdef12345",
                "created_at": "2026-02-06T03:00:00Z",
                "updated_at": "2026-02-06T03:00:00Z"
            }
        }


class SessionListResponse(BaseModel):
    """场次列表响应"""
    items: List[SessionResponse] = Field(..., description="场次列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    total_pages: int = Field(..., ge=0, description="总页数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": "6761234567890abcdef20001",
                        "name": "2024年春招技术岗初面",
                        "date": "2026-03-15T10:00:00Z",
                        "position": "Java后端工程师",
                        "round": 1,
                        "status": "active",
                        "scoring_template_id": "6761234567890abcdef10001",
                        "settings": {
                            "anonymous_mode": True,
                            "pass_threshold": 70.0,
                            "extreme_score_threshold": 30.0
                        },
                        "statistics": {
                            "total_interviewers": 5,
                            "total_candidates": 20,
                            "scored_candidates": 15,
                            "passed_candidates": 10
                        },
                        "description": "春季校园招聘技术岗位初试",
                        "qr_code_url": "/uploads/qrcodes/abc123.png",
                        "qr_code_expires_at": "2026-03-16T10:00:00Z",
                        "created_by": "6761234567890abcdef12345",
                        "created_at": "2026-02-06T03:00:00Z",
                        "updated_at": "2026-02-06T03:00:00Z"
                    },
                    {
                        "id": "6761234567890abcdef20002",
                        "name": "2024年春招技术岗复面",
                        "date": "2026-03-20T14:00:00Z",
                        "position": "Python后端工程师",
                        "round": 2,
                        "status": "draft",
                        "scoring_template_id": "6761234567890abcdef10002",
                        "settings": {
                            "anonymous_mode": False,
                            "pass_threshold": 75.0,
                            "extreme_score_threshold": 25.0
                        },
                        "statistics": {
                            "total_interviewers": 3,
                            "total_candidates": 10,
                            "scored_candidates": 0,
                            "passed_candidates": 0
                        },
                        "description": "春季校园招聘技术岗位复试",
                        "qr_code_url": "/uploads/qrcodes/def456.png",
                        "qr_code_expires_at": "2026-03-21T14:00:00Z",
                        "created_by": "6761234567890abcdef12345",
                        "created_at": "2026-02-06T05:00:00Z",
                        "updated_at": "2026-02-06T05:00:00Z"
                    }
                ],
                "total": 10,
                "page": 1,
                "page_size": 20,
                "total_pages": 1
            }
        }


class QRCodeResponse(BaseModel):
    """二维码响应"""
    qr_code_url: str = Field(..., description="二维码URL")
    qr_code_token: str = Field(..., description="二维码Token")
    expires_at: datetime = Field(..., description="过期时间")
    
    class Config:
        json_schema_extra = {
            "example": {
                "qr_code_url": "/uploads/qrcodes/abc123.png",
                "qr_code_token": "abc123-def456-ghi789",
                "expires_at": "2024-03-14T00:00:00Z"
            }
        }


class JoinSessionRequest(BaseModel):
    """评委扫码绑定请求"""
    qr_code_token: str = Field(..., min_length=1, description="二维码Token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "qr_code_token": "abc123-def456-ghi789"
            }
        }


class AssignInterviewersRequest(BaseModel):
    """分配评委请求"""
    interviewer_ids: List[str] = Field(..., min_length=1, description="评委ID列表")
    
    class Config:
        json_schema_extra = {
            "example": {
                "interviewer_ids": [
                    "6761234567890abcdef12345",
                    "6761234567890abcdef12346"
                ]
            }
        }


class UpdateStatusRequest(BaseModel):
    """更新状态请求"""
    status: SessionStatus = Field(..., description="新状态")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "active"
            }
        }


class InterviewerInfo(BaseModel):
    """评委信息"""
    id: str = Field(..., description="评委ID")
    username: str = Field(..., description="用户名")
    real_name: Optional[str] = Field(None, description="真实姓名")
    email: Optional[str] = Field(None, description="邮箱")
    joined_at: datetime = Field(..., description="加入时间")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef12345",
                "username": "interviewer1",
                "real_name": "张三",
                "email": "interviewer1@example.com",
                "joined_at": "2024-03-01T00:00:00Z"
            }
        }


class SessionInterviewersResponse(BaseModel):
    """场次评委列表响应"""
    session_id: str = Field(..., description="场次ID")
    interviewers: List[InterviewerInfo] = Field(..., description="评委列表")
    total: int = Field(..., ge=0, description="评委总数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "6761234567890abcdef20001",
                "interviewers": [],
                "total": 5
            }
        }
