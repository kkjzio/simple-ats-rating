"""
评委专用路由
提供评委前端期望的接口路径，作为适配层调用现有服务
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.api.deps import get_db, require_interviewer
from app.models.user import User
from app.schemas.score import (
    ScoreDraft,
    JoinSessionApiResponse,
    MySessionsApiResponse,
    MyCandidatesApiResponse,
    ScoreApiResponse,
    SaveScoreDraftApiResponse,
    SubmitScoreApiResponse,
    MyScoreHistoryApiResponse,
    SessionStatsApiResponse
)
from app.services.score_service import get_score_service
from app.services.session_service import join_session_by_qrcode
from app.utils.response import success_response
from app.core.exceptions import NotFoundError


router = APIRouter(prefix="/interviewer", tags=["评委专用"])


@router.post(
    "/sessions/join",
    response_model=JoinSessionApiResponse,
    summary="评委扫码绑定场次",
    description="评委使用二维码token绑定场次"
)
async def join_session(
    qr_code_token: str,
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    评委扫码绑定场次
    
    - **qr_code_token**: 二维码token
    - 验证评委角色
    - 检查token有效性和是否过期
    - 创建绑定记录
    """
    session = await join_session_by_qrcode(db, qr_code_token, current_user)
    return success_response(
        data={
            "session_id": session.id,
            "session_name": session.name,
            "position": session.position,
            "date": session.date.isoformat()
        },
        message="绑定场次成功"
    )


@router.get(
    "/sessions",
    response_model=MySessionsApiResponse,
    summary="获取我的场次列表",
    description="查询当前评委绑定的所有场次，包含评分进度"
)
async def get_my_sessions(
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取我的场次列表
    
    - 返回当前评委绑定的所有场次
    - 包含每个场次的评分进度统计
    - 按日期倒序排列
    """
    service = await get_score_service(db)
    result = await service.get_my_sessions(current_user)
    return success_response(data=result, message="获取场次列表成功")


@router.get(
    "/sessions/{session_id}/candidates",
    response_model=MyCandidatesApiResponse,
    summary="获取待评候选人列表",
    description="评委获取指定场次的待评候选人列表，包含评分进度和状态"
)
async def get_session_candidates(
    session_id: str,
    status: str = Query(default="all", description="状态过滤：all/pending/completed"),
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取待评候选人列表
    
    - **session_id**: 场次ID
    - **status**: 状态过滤（all/pending/completed）
    - 返回场次信息、评分模板、候选人列表和评分进度
    """
    service = await get_score_service(db)
    result = await service.get_my_candidates(session_id, current_user, status)
    return success_response(data=result, message="获取待评列表成功")


@router.get(
    "/sessions/{session_id}/candidates/{candidate_id}/my-score",
    response_model=ScoreApiResponse,
    summary="获取我对候选人的评分",
    description="查询当前评委在指定场次中对候选人的评分记录"
)
async def get_my_score_for_candidate(
    session_id: str,
    candidate_id: str,
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取我对候选人的评分
    
    - **session_id**: 场次ID
    - **candidate_id**: 候选人ID
    - 返回当前评委在指定场次中对该候选人的评分详情
    - 如果未评分则返回404
    """
    service = await get_score_service(db)
    result = await service.get_my_score_for_candidate(session_id, candidate_id, current_user)
    return success_response(data=result, message="获取评分成功")


@router.post(
    "/sessions/{session_id}/candidates/{candidate_id}/scores/draft",
    response_model=SaveScoreDraftApiResponse,
    summary="保存评分草稿",
    description="保存或更新评分草稿"
)
async def save_score_draft(
    session_id: str,
    candidate_id: str,
    score_data: ScoreDraft,
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    保存评分草稿
    
    - **session_id**: 场次ID
    - **candidate_id**: 候选人ID
    - **score_data**: 评分数据
    - 可以部分填写，不验证必填项
    - 返回评分ID和总分
    """
    # 调用服务层，传入 session_id 和 candidate_id
    service = await get_score_service(db)
    result = await service.save_score_draft(session_id, candidate_id, score_data, current_user)
    return success_response(data=result, message="评分草稿保存成功")


@router.post(
    "/sessions/{session_id}/candidates/{candidate_id}/scores/submit",
    response_model=SubmitScoreApiResponse,
    summary="提交评分",
    description="提交评分"
)
async def submit_score(
    session_id: str,
    candidate_id: str,
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    提交评分
    
    - **session_id**: 场次ID
    - **candidate_id**: 候选人ID
    - 自动查询该评委在该场次对该候选人的评分草稿
    - 验证所有维度是否已打分
    - 验证必填评语是否已填写
    - 提交后自动锁定，不可修改
    - 返回极端分预警信息
    """
    # 查询该评委在该场次对该候选人的评分草稿
    score_data = await db.scores.find_one({
        "session_id": ObjectId(session_id),
        "candidate_id": ObjectId(candidate_id),
        "interviewer_id": ObjectId(current_user.id)
    })
    
    if not score_data:
        raise NotFoundError(message="未找到评分草稿，请先保存评分")
    
    score_id = str(score_data["_id"])
    
    # 调用现有服务
    service = await get_score_service(db)
    result = await service.submit_score(score_id, current_user)
    return success_response(data=result, message="评分提交成功")


@router.get(
    "/scores/history",
    response_model=MyScoreHistoryApiResponse,
    summary="获取我的评分历史",
    description="查询当前评委的所有历史评分，支持分页和筛选"
)
async def get_my_score_history(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页大小"),
    session_id: Optional[str] = Query(default=None, description="场次ID过滤"),
    date_from: Optional[str] = Query(default=None, description="开始日期（ISO格式）"),
    date_to: Optional[str] = Query(default=None, description="结束日期（ISO格式）"),
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取我的评分历史
    
    - **page**: 页码，默认1
    - **page_size**: 每页大小，默认20，最大100
    - **session_id**: 可选，按场次过滤
    - **date_from**: 可选，开始日期
    - **date_to**: 可选，结束日期
    - 返回分页的评分历史列表
    - 按提交时间倒序排列
    """
    # 解析日期参数
    date_from_dt = None
    date_to_dt = None
    
    if date_from:
        try:
            date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    service = await get_score_service(db)
    result = await service.get_my_score_history(
        current_user=current_user,
        page=page,
        page_size=page_size,
        session_id=session_id,
        date_from=date_from_dt,
        date_to=date_to_dt
    )
    return success_response(data=result, message="获取评分历史成功")


@router.get(
    "/sessions/{session_id}/stats",
    response_model=SessionStatsApiResponse,
    summary="获取场次统计数据",
    description="查询指定场次的统计数据（评委视角）"
)
async def get_session_stats(
    session_id: str,
    current_user: User = Depends(require_interviewer),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取场次统计数据（评委视角）
    
    - **session_id**: 场次ID
    - 返回整体统计：总候选人数、总评委数、已完成评分数、平均分
    - 返回个人统计：已完成数、待评数、个人平均分、完成率
    - 需要评委被分配到该场次才能查看
    """
    service = await get_score_service(db)
    result = await service.get_session_stats(session_id, current_user)
    return success_response(data=result, message="获取场次统计成功")
