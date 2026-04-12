"""
统计分析Schema
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ScoreDistribution(BaseModel):
    """分数分布"""
    range: str = Field(..., description="分数区间")
    count: int = Field(..., ge=0, description="数量")
    
    class Config:
        json_schema_extra = {
            "example": {
                "range": "60-70",
                "count": 5
            }
        }


class CandidateStatistics(BaseModel):
    """候选人统计"""
    total: int = Field(..., ge=0, description="候选人总数")
    average_score: float = Field(..., ge=0, description="平均分")
    max_score: float = Field(..., ge=0, description="最高分")
    min_score: float = Field(..., ge=0, description="最低分")
    std_dev: float = Field(..., ge=0, description="标准差")
    pass_count: int = Field(..., ge=0, description="通过人数")
    pass_rate: float = Field(..., ge=0, le=100, description="通过率")
    score_distribution: List[ScoreDistribution] = Field(..., description="分数分布")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 25,
                "average_score": 75.6,
                "max_score": 90.5,
                "min_score": 60.0,
                "std_dev": 8.3,
                "pass_count": 18,
                "pass_rate": 72.0,
                "score_distribution": [
                    {"range": "60-70", "count": 5},
                    {"range": "70-80", "count": 12},
                    {"range": "80-90", "count": 7},
                    {"range": "90-100", "count": 1}
                ]
            }
        }


class InterviewerInfo(BaseModel):
    """评委信息"""
    id: str = Field(..., description="评委ID")
    name: str = Field(..., description="评委姓名")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef12346",
                "name": "评委A"
            }
        }


class InterviewerStatistics(BaseModel):
    """评委统计"""
    interviewer: InterviewerInfo = Field(..., description="评委信息")
    completed_count: int = Field(..., ge=0, description="已完成评分数")
    average_score: float = Field(..., ge=0, description="平均分")
    std_dev: float = Field(..., ge=0, description="标准差")
    extreme_scores_count: int = Field(..., ge=0, description="极端分数量")
    
    class Config:
        json_schema_extra = {
            "example": {
                "interviewer": {
                    "id": "6761234567890abcdef12346",
                    "name": "评委A"
                },
                "completed_count": 25,
                "average_score": 76.8,
                "std_dev": 8.2,
                "extreme_scores_count": 2
            }
        }


class DimensionStatistics(BaseModel):
    """维度统计"""
    dimension_name: str = Field(..., description="维度名称")
    average_score: float = Field(..., ge=0, description="平均分")
    max_score: float = Field(..., ge=0, description="最高分")
    min_score: float = Field(..., ge=0, description="最低分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_name": "专业能力",
                "average_score": 7.8,
                "max_score": 9.5,
                "min_score": 6.0
            }
        }


class SessionInfo(BaseModel):
    """场次信息"""
    id: str = Field(..., description="场次ID")
    name: str = Field(..., description="场次名称")
    date: str = Field(..., description="面试日期")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef20001",
                "name": "2024年春招技术岗初面",
                "date": "2024-03-15"
            }
        }


class SessionStatisticsResponse(BaseModel):
    """场次统计响应"""
    session: SessionInfo = Field(..., description="场次信息")
    candidate_statistics: CandidateStatistics = Field(..., description="候选人统计")
    interviewer_statistics: List[InterviewerStatistics] = Field(..., description="评委统计")
    dimension_statistics: List[DimensionStatistics] = Field(..., description="维度统计")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session": {
                    "id": "6761234567890abcdef20001",
                    "name": "2024年春招技术岗初面",
                    "date": "2024-03-15"
                },
                "candidate_statistics": {
                    "total": 25,
                    "average_score": 75.6,
                    "max_score": 90.5,
                    "min_score": 60.0,
                    "std_dev": 8.3,
                    "pass_count": 18,
                    "pass_rate": 72.0,
                    "score_distribution": [
                        {"range": "60-70", "count": 5},
                        {"range": "70-80", "count": 12},
                        {"range": "80-90", "count": 7},
                        {"range": "90-100", "count": 1}
                    ]
                },
                "interviewer_statistics": [
                    {
                        "interviewer": {
                            "id": "6761234567890abcdef12346",
                            "name": "评委A"
                        },
                        "completed_count": 25,
                        "average_score": 76.8,
                        "std_dev": 8.2,
                        "extreme_scores_count": 2
                    }
                ],
                "dimension_statistics": [
                    {
                        "dimension_name": "专业能力",
                        "average_score": 7.8,
                        "max_score": 9.5,
                        "min_score": 6.0
                    }
                ]
            }
        }


class CandidateInfo(BaseModel):
    """候选人信息"""
    id: str = Field(..., description="候选人ID")
    name: str = Field(..., description="候选人姓名")
    avatar: Optional[str] = Field(None, description="头像URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef30001",
                "name": "王五",
                "avatar": "/uploads/avatars/wangwu.jpg"
            }
        }


class RankingItem(BaseModel):
    """排名项"""
    rank: int = Field(..., ge=1, description="排名")
    candidate: CandidateInfo = Field(..., description="候选人信息")
    average_score: float = Field(..., ge=0, description="平均分")
    scores_count: int = Field(..., ge=0, description="评分数量")
    status: str = Field(..., description="状态")
    
    class Config:
        json_schema_extra = {
            "example": {
                "rank": 1,
                "candidate": {
                    "id": "6761234567890abcdef30001",
                    "name": "王五",
                    "avatar": "/uploads/avatars/wangwu.jpg"
                },
                "average_score": 90.5,
                "scores_count": 5,
                "status": "passed"
            }
        }


class RankingResponse(BaseModel):
    """排名响应"""
    items: List[RankingItem] = Field(..., description="排名列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "rank": 1,
                        "candidate": {
                            "id": "6761234567890abcdef30001",
                            "name": "王五",
                            "avatar": "/uploads/avatars/wangwu.jpg"
                        },
                        "average_score": 90.5,
                        "scores_count": 5,
                        "status": "passed"
                    }
                ],
                "total": 25,
                "page": 1,
                "page_size": 20
            }
        }


class TopCandidate(BaseModel):
    """Top候选人"""
    rank: int = Field(..., ge=1, description="排名")
    name: str = Field(..., description="候选人姓名")
    average_score: float = Field(..., ge=0, description="平均分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "rank": 1,
                "name": "王五",
                "average_score": 90.5
            }
        }


class DimensionAverage(BaseModel):
    """维度平均分"""
    dimension_name: str = Field(..., description="维度名称")
    average: float = Field(..., ge=0, description="平均分")
    
    class Config:
        json_schema_extra = {
            "example": {
                "dimension_name": "专业能力",
                "average": 7.8
            }
        }


class ProgressInfo(BaseModel):
    """进度信息"""
    total_candidates: int = Field(..., ge=0, description="候选人总数")
    completed_scores: int = Field(..., ge=0, description="已完成评分数")
    completion_rate: float = Field(..., ge=0, le=100, description="完成率")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total_candidates": 25,
                "completed_scores": 100,
                "completion_rate": 80.0
            }
        }


class ScoreDistributionChart(BaseModel):
    """分数分布图表数据"""
    labels: List[str] = Field(..., description="标签列表")
    data: List[int] = Field(..., description="数据列表")
    
    class Config:
        json_schema_extra = {
            "example": {
                "labels": ["60-70", "70-80", "80-90", "90-100"],
                "data": [5, 12, 7, 1]
            }
        }


class SessionInfoForDashboard(BaseModel):
    """大屏场次信息"""
    name: str = Field(..., description="场次名称")
    date: str = Field(..., description="面试日期")
    status: str = Field(..., description="场次状态")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "2024年春招技术岗初面",
                "date": "2024-03-15",
                "status": "active"
            }
        }


class DashboardData(BaseModel):
    """大屏数据"""
    session_info: SessionInfoForDashboard = Field(..., description="场次信息")
    progress: ProgressInfo = Field(..., description="评分进度")
    top_candidates: List[TopCandidate] = Field(..., description="Top候选人")
    dimension_averages: List[DimensionAverage] = Field(..., description="维度平均分")
    score_distribution: ScoreDistributionChart = Field(..., description="分数分布")


class OverviewSessionItem(BaseModel):
    """概览场次条目"""
    id: str = Field(..., description="场次ID")
    name: str = Field(..., description="场次名称")
    status: str = Field(..., description="场次状态")
    date: str = Field(..., description="面试日期")
    candidate_count: int = Field(..., ge=0, description="候选人数量")
    interviewer_count: int = Field(..., ge=0, description="评委数量")
    score_count: int = Field(..., ge=0, description="已提交评分数量")
    created_at: str = Field(..., description="创建时间")


class OverviewResponse(BaseModel):
    """管理概览响应"""
    total_users: int = Field(..., ge=0, description="用户总数")
    total_sessions: int = Field(..., ge=0, description="场次总数")
    total_candidates: int = Field(..., ge=0, description="候选人总数")
    total_scores: int = Field(..., ge=0, description="评分总数")
    sessions: List[OverviewSessionItem] = Field(..., description="场次列表（按创建时间倒序）")
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_info": {
                    "name": "2024年春招技术岗初面",
                    "date": "2024-03-15",
                    "status": "active"
                },
                "progress": {
                    "total_candidates": 25,
                    "completed_scores": 100,
                    "completion_rate": 80.0
                },
                "top_candidates": [
                    {
                        "rank": 1,
                        "name": "王五",
                        "average_score": 90.5
                    },
                    {
                        "rank": 2,
                        "name": "赵六",
                        "average_score": 88.2
                    }
                ],
                "dimension_averages": [
                    {"dimension_name": "专业能力", "average": 7.8},
                    {"dimension_name": "沟通表达", "average": 8.2},
                    {"dimension_name": "文化匹配", "average": 7.5},
                    {"dimension_name": "综合潜力", "average": 8.0}
                ],
                "score_distribution": {
                    "labels": ["60-70", "70-80", "80-90", "90-100"],
                    "data": [5, 12, 7, 1]
                }
            }
        }
