"""
评分相关Schema
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class DimensionScoreSchema(BaseModel):
    """维度评分Schema（用于请求）"""
    dimension_name: str = Field(..., description="维度名称")
    score: float = Field(..., ge=0, description="原始得分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_name": "专业能力",
                "score": 8.5
            }
        }


class TextFeedbackSchema(BaseModel):
    """文本评语Schema（用于请求）"""
    field_name: str = Field(..., description="评语字段名")
    content: str = Field(..., description="评语内容")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field_name": "综合评语",
                "content": "候选人表现优秀"
            }
        }


class ScoreDraft(BaseModel):
    """保存草稿请求"""
    dimension_scores: List[DimensionScoreSchema] = Field(..., description="各维度得分")
    text_feedbacks: List[TextFeedbackSchema] = Field(default_factory=list, description="文本评语")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_scores": [
                    {"dimension_name": "专业能力", "score": 8.5},
                    {"dimension_name": "沟通表达", "score": 9.0}
                ],
                "text_feedbacks": [
                    {"field_name": "综合评语", "content": "候选人表现优秀"}
                ]
            }
        }


class ScoreSubmit(BaseModel):
    """提交评分请求（无需额外参数，直接提交已保存的草稿）"""
    pass


class DimensionScoreResponse(BaseModel):
    """维度评分响应"""
    dimension_name: str = Field(..., description="维度名称")
    score: float = Field(..., description="原始得分")
    weight: float = Field(..., description="权重")
    weighted_score: float = Field(..., description="加权得分")
    max_score: float = Field(..., description="最高分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_name": "专业能力",
                "score": 8.5,
                "weight": 35,
                "weighted_score": 2.975,
                "max_score": 10
            }
        }


class TextFeedbackResponse(BaseModel):
    """文本评语响应"""
    field_name: str = Field(..., description="评语字段名")
    content: str = Field(..., description="评语内容")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field_name": "综合评语",
                "content": "候选人技术基础扎实，表达清晰，有较强的学习能力。"
            }
        }


class ScoreResponse(BaseModel):
    """评分响应"""
    id: str = Field(..., alias="_id", description="评分ID")
    session_id: str = Field(..., description="场次ID")
    candidate_id: str = Field(..., description="候选人ID")
    interviewer_id: str = Field(..., description="评委ID")
    dimension_scores: List[DimensionScoreResponse] = Field(..., description="各维度得分")
    total_score: float = Field(..., description="加权总分")
    text_feedbacks: List[TextFeedbackResponse] = Field(..., description="文本评语")
    status: str = Field(..., description="评分状态")
    is_locked: bool = Field(..., description="是否锁定")
    submitted_at: Optional[str] = Field(None, description="提交时间")
    modified_by: Optional[str] = Field(None, description="修改人ID")
    modified_at: Optional[str] = Field(None, description="修改时间")
    created_at: str = Field(..., description="创建时间")
    updated_at: str = Field(..., description="更新时间")
    
    class Config:
        populate_by_name = True
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
                        "weighted_score": 2.975,
                        "max_score": 10
                    }
                ],
                "total_score": 8.525,
                "text_feedbacks": [
                    {
                        "field_name": "综合评语",
                        "content": "候选人技术基础扎实"
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


class ScoreDetailResponse(BaseModel):
    """评分详情响应"""
    score: ScoreResponse = Field(..., description="评分信息")
    interviewer_name: Optional[str] = Field(None, description="评委姓名")
    candidate_name: Optional[str] = Field(None, description="候选人姓名")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score": {
                    "_id": "6761234567890abcdef50001",
                    "session_id": "6761234567890abcdef20001",
                    "candidate_id": "6761234567890abcdef30001",
                    "interviewer_id": "6761234567890abcdef12346",
                    "dimension_scores": [],
                    "total_score": 8.525,
                    "text_feedbacks": [],
                    "status": "submitted",
                    "is_locked": True,
                    "submitted_at": "2024-03-15T10:30:00Z",
                    "created_at": "2024-03-15T10:00:00Z",
                    "updated_at": "2024-03-15T10:30:00Z"
                },
                "interviewer_name": "张三",
                "candidate_name": "王五"
            }
        }


class CandidateScoreInfo(BaseModel):
    """候选人评分信息"""
    score_id: str = Field(..., description="评分ID")
    interviewer_id: str = Field(..., description="评委ID")
    interviewer_name: str = Field(..., description="评委姓名")
    total_score: float = Field(..., description="总分")
    status: str = Field(..., description="评分状态")
    submitted_at: Optional[str] = Field(None, description="提交时间")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score_id": "6761234567890abcdef50001",
                "interviewer_id": "6761234567890abcdef12346",
                "interviewer_name": "张三",
                "total_score": 8.525,
                "status": "submitted",
                "submitted_at": "2024-03-15T10:30:00Z"
            }
        }


class ScoreStatistics(BaseModel):
    """评分统计信息"""
    total_scores: int = Field(..., description="总评分数")
    average_score: float = Field(..., description="平均分")
    max_score: float = Field(..., description="最高分")
    min_score: float = Field(..., description="最低分")
    std_dev: float = Field(..., description="标准差")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_scores": 5,
                "average_score": 82.5,
                "max_score": 90.0,
                "min_score": 75.0,
                "std_dev": 5.2
            }
        }


class CandidateScoresResponse(BaseModel):
    """候选人所有评分响应"""
    candidate_id: str = Field(..., description="候选人ID")
    candidate_name: str = Field(..., description="候选人姓名")
    scores: List[ScoreResponse] = Field(..., description="所有评分")
    statistics: ScoreStatistics = Field(..., description="统计信息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "6761234567890abcdef30001",
                "candidate_name": "王五",
                "scores": [],
                "statistics": {
                    "total_scores": 5,
                    "average_score": 82.5,
                    "max_score": 90.0,
                    "min_score": 75.0,
                    "std_dev": 5.2
                }
            }
        }


class AdminModifyScoreRequest(BaseModel):
    """超管修改评分请求"""
    dimension_scores: List[DimensionScoreSchema] = Field(..., description="各维度得分")
    text_feedbacks: List[TextFeedbackSchema] = Field(default_factory=list, description="文本评语")
    modify_reason: str = Field(..., min_length=1, max_length=500, description="修改原因")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_scores": [
                    {"dimension_name": "专业能力", "score": 9.0},
                    {"dimension_name": "沟通表达", "score": 8.5}
                ],
                "text_feedbacks": [
                    {"field_name": "综合评语", "content": "修改后的评语"}
                ],
                "modify_reason": "评委打分有误，需要调整"
            }
        }


class CandidateWithScoreStatus(BaseModel):
    """带评分状态的候选人信息"""
    candidate_id: str = Field(..., description="候选人ID")
    user_id: str = Field(..., description="用户ID")
    name: str = Field(..., description="候选人姓名")
    order: int = Field(..., description="面试顺序号")
    status: str = Field(..., description="候选人状态")
    score_status: str = Field(..., description="评分状态：pending/completed")
    score_id: Optional[str] = Field(None, description="评分ID（如果已评分）")
    total_score: Optional[float] = Field(None, description="总分（如果已评分）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "6761234567890abcdef30001",
                "user_id": "6761234567890abcdef12347",
                "name": "王五",
                "order": 1,
                "status": "waiting",
                "score_status": "pending",
                "score_id": None,
                "total_score": None
            }
        }


class SessionInfo(BaseModel):
    """场次信息"""
    session_id: str = Field(..., description="场次ID")
    name: str = Field(..., description="场次名称")
    position: str = Field(..., description="岗位名称")
    date: str = Field(..., description="面试日期")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "6761234567890abcdef20001",
                "name": "2024年春招技术岗初面",
                "position": "Java后端工程师",
                "date": "2024-03-15T00:00:00Z"
            }
        }


class ScoringProgress(BaseModel):
    """评分进度"""
    total_candidates: int = Field(..., description="总候选人数")
    completed_count: int = Field(..., description="已完成评分数")
    pending_count: int = Field(..., description="待评分数")
    completion_rate: float = Field(..., description="完成率（百分比）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_candidates": 25,
                "completed_count": 20,
                "pending_count": 5,
                "completion_rate": 80.0
            }
        }


class MyCandidatesResponse(BaseModel):
    """评委待评列表响应"""
    session: SessionInfo = Field(..., description="场次信息")
    template: dict = Field(..., description="评分模板")
    candidates: List[CandidateWithScoreStatus] = Field(..., description="候选人列表")
    progress: ScoringProgress = Field(..., description="评分进度")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session": {
                    "session_id": "6761234567890abcdef20001",
                    "name": "2024年春招技术岗初面",
                    "position": "Java后端工程师",
                    "date": "2024-03-15T00:00:00Z"
                },
                "template": {},
                "candidates": [],
                "progress": {
                    "total_candidates": 25,
                    "completed_count": 20,
                    "pending_count": 5,
                    "completion_rate": 80.0
                }
            }
        }


class ExtremeScoreWarning(BaseModel):
    """极端分预警"""
    is_extreme: bool = Field(..., description="是否为极端分")
    deviation: Optional[float] = Field(None, description="偏差值")
    threshold: Optional[float] = Field(None, description="阈值")
    message: Optional[str] = Field(None, description="预警信息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_extreme": True,
                "deviation": 35.5,
                "threshold": 30.0,
                "message": "该评分与其他评委的平均分偏差较大，请确认评分是否准确"
            }
        }


class MySessionItem(BaseModel):
    """我的场次列表项"""
    session_id: str = Field(..., description="场次ID")
    name: str = Field(..., description="场次名称")
    position: str = Field(..., description="岗位名称")
    date: str = Field(..., description="面试日期")
    status: str = Field(..., description="场次状态")
    progress: ScoringProgress = Field(..., description="评分进度")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "6761234567890abcdef20001",
                "name": "2024年春招技术岗初面",
                "position": "Java后端工程师",
                "date": "2024-03-15T00:00:00Z",
                "status": "active",
                "progress": {
                    "total_candidates": 25,
                    "completed_count": 20,
                    "pending_count": 5,
                    "completion_rate": 80.0
                }
            }
        }


class MySessionsResponse(BaseModel):
    """我的场次列表响应"""
    sessions: List[MySessionItem] = Field(..., description="场次列表")
    
    class Config:
        json_schema_extra = {
            "example": {
                "sessions": [
                    {
                        "session_id": "6761234567890abcdef20001",
                        "name": "2024年春招技术岗初面",
                        "position": "Java后端工程师",
                        "date": "2024-03-15T00:00:00Z",
                        "status": "active",
                        "progress": {
                            "total_candidates": 25,
                            "completed_count": 20,
                            "pending_count": 5,
                            "completion_rate": 80.0
                        }
                    }
                ]
            }
        }


class ScoreHistoryItem(BaseModel):
    """评分历史项"""
    score_id: str = Field(..., description="评分ID")
    session_id: str = Field(..., description="场次ID")
    session_name: str = Field(..., description="场次名称")
    candidate_id: str = Field(..., description="候选人ID")
    candidate_name: str = Field(..., description="候选人姓名")
    total_score: float = Field(..., description="总分")
    status: str = Field(..., description="评分状态")
    submitted_at: Optional[str] = Field(None, description="提交时间")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score_id": "6761234567890abcdef50001",
                "session_id": "6761234567890abcdef20001",
                "session_name": "2024年春招技术岗初面",
                "candidate_id": "6761234567890abcdef30001",
                "candidate_name": "王五",
                "total_score": 85.5,
                "status": "submitted",
                "submitted_at": "2024-03-15T10:30:00Z"
            }
        }


class MyScoreHistoryResponse(BaseModel):
    """我的评分历史响应"""
    items: List[ScoreHistoryItem] = Field(..., description="评分历史列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页大小")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20
            }
        }


class SessionStatsResponse(BaseModel):
    """场次统计响应（评委视角）"""
    session_info: SessionInfo = Field(..., description="场次信息")
    overall_stats: dict = Field(..., description="整体统计")
    my_stats: dict = Field(..., description="个人统计")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_info": {
                    "session_id": "6761234567890abcdef20001",
                    "name": "2024年春招技术岗初面",
                    "position": "Java后端工程师",
                    "date": "2024-03-15T00:00:00Z"
                },
                "overall_stats": {
                    "total_candidates": 25,
                    "total_interviewers": 5,
                    "completed_scores": 100,
                    "average_score": 75.6
                },
                "my_stats": {
                    "completed_count": 20,
                    "pending_count": 5,
                    "my_average_score": 76.8,
                    "completion_rate": 80.0
                }
            }
        }


class JoinSessionResponse(BaseModel):
    """评委绑定场次响应数据"""
    session_id: str = Field(..., description="场次ID")
    session_name: str = Field(..., description="场次名称")
    position: str = Field(..., description="岗位名称")
    date: str = Field(..., description="面试日期")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "6761234567890abcdef20001",
                "session_name": "2024年春招技术岗初面",
                "position": "Java后端工程师",
                "date": "2024-03-15T00:00:00Z"
            }
        }


class JoinSessionApiResponse(BaseModel):
    """评委绑定场次API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="绑定场次成功", description="响应消息")
    data: JoinSessionResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "绑定场次成功",
                "data": {
                    "session_id": "6761234567890abcdef20001",
                    "session_name": "2024年春招技术岗初面",
                    "position": "Java后端工程师",
                    "date": "2024-03-15T00:00:00Z"
                }
            }
        }


class MySessionsApiResponse(BaseModel):
    """我的场次列表API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="获取场次列表成功", description="响应消息")
    data: MySessionsResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "获取场次列表成功",
                "data": {
                    "sessions": [
                        {
                            "session_id": "6761234567890abcdef20001",
                            "name": "2024年春招技术岗初面",
                            "position": "Java后端工程师",
                            "date": "2024-03-15T00:00:00Z",
                            "status": "active",
                            "progress": {
                                "total_candidates": 25,
                                "completed_count": 20,
                                "pending_count": 5,
                                "completion_rate": 80.0
                            }
                        }
                    ]
                }
            }
        }


class MyCandidatesApiResponse(BaseModel):
    """待评候选人列表API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="获取待评列表成功", description="响应消息")
    data: MyCandidatesResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "获取待评列表成功",
                "data": {
                    "session": {
                        "session_id": "6761234567890abcdef20001",
                        "name": "2024年春招技术岗初面",
                        "position": "Java后端工程师",
                        "date": "2024-03-15T00:00:00Z"
                    },
                    "template": {
                        "dimensions": [
                            {"name": "专业能力", "weight": 35, "max_score": 10}
                        ]
                    },
                    "candidates": [
                        {
                            "candidate_id": "6761234567890abcdef30001",
                            "user_id": "6761234567890abcdef12347",
                            "name": "张三",
                            "order": 1,
                            "status": "waiting",
                            "score_status": "pending",
                            "score_id": None,
                            "total_score": None
                        }
                    ],
                    "progress": {
                        "total_candidates": 25,
                        "completed_count": 20,
                        "pending_count": 5,
                        "completion_rate": 80.0
                    }
                }
            }
        }


class ScoreApiResponse(BaseModel):
    """评分详情API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="获取评分成功", description="响应消息")
    data: ScoreResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "获取评分成功",
                "data": {
                    "_id": "6761234567890abcdef50001",
                    "session_id": "6761234567890abcdef20001",
                    "candidate_id": "6761234567890abcdef30001",
                    "interviewer_id": "6761234567890abcdef12346",
                    "dimension_scores": [
                        {
                            "dimension_name": "专业能力",
                            "score": 8.5,
                            "weight": 35,
                            "weighted_score": 2.975,
                            "max_score": 10
                        }
                    ],
                    "total_score": 85.25,
                    "text_feedbacks": [
                        {
                            "field_name": "综合评语",
                            "content": "候选人技术基础扎实"
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
        }


class SaveScoreDraftResponse(BaseModel):
    """保存评分草稿响应数据"""
    score_id: str = Field(..., description="评分ID")
    total_score: float = Field(..., description="加权总分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score_id": "6761234567890abcdef50001",
                "total_score": 85.5
            }
        }


class SaveScoreDraftApiResponse(BaseModel):
    """保存评分草稿API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="评分草稿保存成功", description="响应消息")
    data: SaveScoreDraftResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "评分草稿保存成功",
                "data": {
                    "score_id": "6761234567890abcdef50001",
                    "total_score": 85.5
                }
            }
        }


class SubmitScoreResponse(BaseModel):
    """提交评分响应数据"""
    score_id: str = Field(..., description="评分ID")
    total_score: float = Field(..., description="加权总分")
    warning: Optional[ExtremeScoreWarning] = Field(None, description="极端分预警")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score_id": "6761234567890abcdef50001",
                "total_score": 85.5,
                "warning": {
                    "is_extreme": True,
                    "deviation": 35.5,
                    "threshold": 30.0,
                    "message": "该评分与其他评委的平均分偏差较大，请确认评分是否准确"
                }
            }
        }


class SubmitScoreApiResponse(BaseModel):
    """提交评分API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="评分提交成功", description="响应消息")
    data: SubmitScoreResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "评分提交成功",
                "data": {
                    "score_id": "6761234567890abcdef50001",
                    "total_score": 85.5,
                    "warning": {
                        "is_extreme": True,
                        "deviation": 35.5,
                        "threshold": 30.0,
                        "message": "该评分与其他评委的平均分偏差较大，请确认评分是否准确"
                    }
                }
            }
        }


class MyScoreHistoryApiResponse(BaseModel):
    """我的评分历史API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="获取评分历史成功", description="响应消息")
    data: MyScoreHistoryResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "获取评分历史成功",
                "data": {
                    "items": [
                        {
                            "score_id": "6761234567890abcdef50001",
                            "session_id": "6761234567890abcdef20001",
                            "session_name": "2024年春招技术岗初面",
                            "candidate_id": "6761234567890abcdef30001",
                            "candidate_name": "张三",
                            "total_score": 85.5,
                            "status": "submitted",
                            "submitted_at": "2024-03-15T10:30:00Z"
                        }
                    ],
                    "total": 100,
                    "page": 1,
                    "page_size": 20
                }
            }
        }


class SessionStatsApiResponse(BaseModel):
    """场次统计API响应"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="获取场次统计成功", description="响应消息")
    data: SessionStatsResponse = Field(..., description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "获取场次统计成功",
                "data": {
                    "session_info": {
                        "session_id": "6761234567890abcdef20001",
                        "name": "2024年春招技术岗初面",
                        "position": "Java后端工程师",
                        "date": "2024-03-15T00:00:00Z"
                    },
                    "overall_stats": {
                        "total_candidates": 25,
                        "total_interviewers": 5,
                        "completed_scores": 100,
                        "average_score": 75.6
                    },
                    "my_stats": {
                        "completed_count": 20,
                        "pending_count": 5,
                        "my_average_score": 76.8,
                        "completion_rate": 80.0
                    }
                }
            }
        }
