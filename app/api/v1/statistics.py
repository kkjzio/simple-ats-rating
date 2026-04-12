"""
统计分析路由
提供场次统计、候选人排名、实时大屏等接口
"""

from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, require_super_admin, get_current_user
from app.models.user import User
from app.schemas.statistics import (
    SessionStatisticsResponse,
    RankingResponse,
    DashboardData,
    OverviewResponse,
)
from app.services import statistics_service


router = APIRouter()


# ==================== 超管概览接口 ====================

@router.get(
    "/overview",
    response_model=OverviewResponse,
    summary="获取管理概览数据"
)
async def get_overview_data(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    获取管理概览数据（仅超管）

    **返回数据**：
    - 用户总数
    - 场次总数
    - 候选人总数（跨所有场次）
    - 已提交评分总数
    - 场次列表（含各场次的候选人数、评委数、已提交评分数）
    """
    return await statistics_service.get_overview_data(db=db)

# ==================== 超管/评委接口 ====================

@router.get(
    "/sessions/{session_id}/statistics",
    response_model=SessionStatisticsResponse,
    summary="获取场次统计数据"
)
async def get_session_statistics(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取场次统计数据
    
    - **session_id**: 场次ID
    
    需要认证（超管或评委）
    
    **返回数据**：
    - 场次基本信息
    - 候选人统计：总数、平均分、最高分、最低分、标准差、通过人数、通过率、分数分布
    - 评委统计：每个评委的完成数、平均分、标准差、极端分数量
    - 维度统计：每个维度的平均分、最高分、最低分
    
    **说明**：
    - 统计数据实时计算，不缓存
    - 使用MongoDB聚合管道优化查询性能
    - 分数精确到小数点后2位
    """
    return await statistics_service.get_session_statistics(
        db=db,
        session_id=session_id
    )


@router.get(
    "/sessions/{session_id}/rankings",
    response_model=RankingResponse,
    summary="获取候选人排名"
)
async def get_candidate_rankings(
    session_id: str,
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取候选人排名
    
    - **session_id**: 场次ID
    - **page**: 页码，从1开始
    - **page_size**: 每页数量，最大100
    
    需要认证（超管或评委）
    
    **返回数据**：
    - 排名列表（按平均分降序）
    - 每个候选人的排名、基本信息、平均分、评分数量、状态
    - 分页信息
    
    **说明**：
    - 按平均分降序排列
    - 支持分页查询
    - 状态包括：passed（通过）、rejected（未通过）、waiting（等待）、in_progress（进行中）、completed（已完成）
    """
    return await statistics_service.get_candidate_rankings(
        db=db,
        session_id=session_id,
        page=page,
        page_size=page_size
    )


@router.get(
    "/sessions/{session_id}/dashboard",
    response_model=DashboardData,
    summary="获取实时大屏数据"
)
async def get_dashboard_data(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取实时大屏数据
    
    - **session_id**: 场次ID
    
    需要认证（超管或评委）
    
    **返回数据**：
    - 场次基本信息（名称、日期、状态）
    - 评分进度（总候选人数、已完成评分数、完成率）
    - Top 10候选人排名
    - 维度平均分（雷达图数据）
    - 分数分布（柱状图数据）
    
    **说明**：
    - 数据实时计算，支持实时刷新
    - 适用于大屏展示
    - 完成率 = 已完成评分数 / (候选人数 × 评委数) × 100%
    
    **前端展示建议**：
    - 使用雷达图展示维度平均分
    - 使用柱状图展示分数分布
    - 使用进度条展示完成率
    - 使用排行榜展示Top候选人
    """
    return await statistics_service.get_dashboard_data(
        db=db,
        session_id=session_id
    )
