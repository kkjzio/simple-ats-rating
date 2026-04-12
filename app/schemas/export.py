"""
导出相关Schema定义
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class ExportTaskStatus(str):
    """导出任务状态枚举"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CandidateScoresExportRequest(BaseModel):
    """候选人得分导出请求"""
    include_feedbacks: bool = Field(
        default=True,
        description="是否包含评语"
    )


class InterviewerStatsExportRequest(BaseModel):
    """评委统计导出请求"""
    pass


class StatsScoresExportRequest(BaseModel):
    """统计总览评分导出请求"""
    session_ids: list[str] = Field(..., min_length=1, description="场次ID列表")


class ExportTaskCreate(BaseModel):
    """创建导出任务请求"""
    session_id: str = Field(..., description="场次ID")
    export_type: Literal["candidate_scores", "interviewer_stats"] = Field(
        ...,
        description="导出类型"
    )
    options: dict = Field(default_factory=dict, description="导出选项")


class ExportTaskResponse(BaseModel):
    """导出任务响应"""
    task_id: str = Field(..., description="任务ID")
    session_id: str = Field(..., description="场次ID")
    export_type: str = Field(..., description="导出类型")
    status: str = Field(..., description="任务状态")
    file_path: Optional[str] = Field(None, description="文件路径")
    download_url: Optional[str] = Field(None, description="下载链接")
    created_by: str = Field(..., description="创建人")
    created_at: datetime = Field(..., description="创建时间")
    completed_at: Optional[datetime] = Field(None, description="完成时间")
    expires_at: Optional[datetime] = Field(None, description="过期时间")
    error_message: Optional[str] = Field(None, description="错误信息")
    
    class Config:
        from_attributes = True


class ExportTaskListResponse(BaseModel):
    """导出任务列表响应"""
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    items: list[ExportTaskResponse] = Field(..., description="任务列表")
