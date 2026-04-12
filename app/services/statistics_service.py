"""
统计分析服务
处理场次统计、候选人排名、评委统计、维度分析、实时大屏数据等
"""

from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import statistics as stats

from app.models.session import Session
from app.schemas.statistics import (
    SessionStatisticsResponse,
    SessionInfo,
    CandidateStatistics,
    InterviewerStatistics,
    InterviewerInfo,
    DimensionStatistics,
    ScoreDistribution,
    RankingResponse,
    RankingItem,
    CandidateInfo,
    DashboardData,
    SessionInfoForDashboard,
    ProgressInfo,
    TopCandidate,
    DimensionAverage,
    ScoreDistributionChart,
    OverviewResponse,
    OverviewSessionItem,
)
from app.core.exceptions import ResourceNotFoundError


EFFECTIVE_SCORE_STATUSES = ["submitted", "modified_by_admin"]


async def _get_candidate_score_aggregates(
    db: AsyncIOMotorDatabase,
    session_id: str,
) -> Dict[str, Dict[str, Any]]:
    """按场次聚合候选人评分结果。"""
    pipeline = [
        {
            "$match": {
                "session_id": ObjectId(session_id),
                "status": {"$in": EFFECTIVE_SCORE_STATUSES},
            }
        },
        {
            "$group": {
                "_id": "$candidate_id",
                "total_score": {"$sum": "$total_score"},
                "average_score": {"$avg": "$total_score"},
                "scores_count": {"$sum": 1},
            }
        },
    ]

    results = await db.scores.aggregate(pipeline).to_list(length=None)
    return {
        str(item["_id"]): {
            "total_score": round(item["total_score"], 2),
            "average_score": round(item["average_score"], 2),
            "scores_count": item["scores_count"],
        }
        for item in results
    }


async def get_session_statistics(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> SessionStatisticsResponse:
    """
    获取场次统计数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        SessionStatisticsResponse: 场次统计响应
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    # 检查场次是否存在
    try:
        session_data = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    if not session_data:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    session = Session.from_mongo(session_data)
    
    # 获取场次信息
    session_info = SessionInfo(
        id=session.id,
        name=session.name,
        date=session.date.strftime("%Y-%m-%d") if session.date else ""
    )
    
    # 获取候选人统计
    candidate_stats = await _get_candidate_statistics(db, session_id, session)
    
    # 获取评委统计
    interviewer_stats = await _get_interviewer_statistics(db, session_id, session)
    
    # 获取维度统计
    dimension_stats = await _get_dimension_statistics(db, session_id)
    
    return SessionStatisticsResponse(
        session=session_info,
        candidate_statistics=candidate_stats,
        interviewer_statistics=interviewer_stats,
        dimension_statistics=dimension_stats
    )


async def _get_candidate_statistics(
    db: AsyncIOMotorDatabase,
    session_id: str,
    session: Session
) -> CandidateStatistics:
    """
    获取候选人统计数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        session: 场次对象
        
    Returns:
        CandidateStatistics: 候选人统计
    """
    total = await db.candidates.count_documents({"session_id": ObjectId(session_id)})

    if total == 0:
        return CandidateStatistics(
            total=0,
            average_score=0.0,
            max_score=0.0,
            min_score=0.0,
            std_dev=0.0,
            pass_count=0,
            pass_rate=0.0,
            score_distribution=[]
        )

    score_aggregates = await _get_candidate_score_aggregates(db, session_id)
    scores = [item["average_score"] for item in score_aggregates.values() if item["average_score"] is not None]

    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    max_score = round(max(scores), 2) if scores else 0.0
    min_score = round(min(scores), 2) if scores else 0.0
    
    # 计算标准差
    std_dev = 0.0
    if len(scores) > 1:
        std_dev = round(stats.stdev(scores), 2)
    
    # 计算通过人数和通过率
    pass_threshold = session.settings.pass_threshold if session.settings else 70
    pass_count = sum(1 for s in scores if s >= pass_threshold)
    pass_rate = round((pass_count / total * 100), 2) if total > 0 else 0.0
    
    # 计算分数分布
    score_dist = _get_score_distribution(scores)
    
    return CandidateStatistics(
        total=total,
        average_score=avg_score,
        max_score=max_score,
        min_score=min_score,
        std_dev=std_dev,
        pass_count=pass_count,
        pass_rate=pass_rate,
        score_distribution=score_dist
    )


async def _get_interviewer_statistics(
    db: AsyncIOMotorDatabase,
    session_id: str,
    session: Session
) -> List[InterviewerStatistics]:
    """
    获取评委统计数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        session: 场次对象
        
    Returns:
        List[InterviewerStatistics]: 评委统计列表
    """
    # 使用聚合管道获取评委统计
    pipeline = [
        {"$match": {"session_id": ObjectId(session_id), "status": {"$in": EFFECTIVE_SCORE_STATUSES}}},
        {"$group": {
            "_id": "$interviewer_id",
            "count": {"$sum": 1},
            "avg_score": {"$avg": "$total_score"},
            "scores": {"$push": "$total_score"}
        }}
    ]
    
    results = await db.scores.aggregate(pipeline).to_list(length=None)
    
    interviewer_stats = []
    extreme_threshold = session.settings.extreme_score_threshold if session.settings else 30
    
    for result in results:
        interviewer_id = str(result["_id"])
        
        # 获取评委信息
        user = await db.users.find_one({"_id": result["_id"]})
        if not user:
            continue
        
        interviewer_info = InterviewerInfo(
            id=interviewer_id,
            name=user.get("profile", {}).get("name", user.get("username", ""))
        )
        
        scores = result["scores"]
        avg_score = round(result["avg_score"], 2) if result["avg_score"] else 0.0
        
        # 计算标准差
        std_dev = 0.0
        if len(scores) > 1:
            std_dev = round(stats.stdev(scores), 2)
        
        # 计算极端分数量（与平均分差异超过阈值的分数）
        extreme_count = 0
        if avg_score > 0:
            threshold_value = avg_score * (extreme_threshold / 100)
            extreme_count = sum(1 for s in scores if abs(s - avg_score) > threshold_value)
        
        interviewer_stats.append(InterviewerStatistics(
            interviewer=interviewer_info,
            completed_count=result["count"],
            average_score=avg_score,
            std_dev=std_dev,
            extreme_scores_count=extreme_count
        ))
    
    return interviewer_stats


async def _get_dimension_statistics(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> List[DimensionStatistics]:
    """
    获取维度统计数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        List[DimensionStatistics]: 维度统计列表
    """
    # 使用聚合管道获取维度统计
    pipeline = [
        {"$match": {"session_id": ObjectId(session_id), "status": {"$in": EFFECTIVE_SCORE_STATUSES}}},
        {"$unwind": "$dimension_scores"},
        {"$group": {
            "_id": "$dimension_scores.dimension_name",
            "avg_score": {"$avg": "$dimension_scores.score"},
            "max_score": {"$max": "$dimension_scores.score"},
            "min_score": {"$min": "$dimension_scores.score"}
        }}
    ]
    
    results = await db.scores.aggregate(pipeline).to_list(length=None)
    
    dimension_stats = []
    for result in results:
        dimension_stats.append(DimensionStatistics(
            dimension_name=result["_id"],
            average_score=round(result["avg_score"], 2) if result["avg_score"] else 0.0,
            max_score=round(result["max_score"], 2) if result["max_score"] else 0.0,
            min_score=round(result["min_score"], 2) if result["min_score"] else 0.0
        ))
    
    return dimension_stats


def _get_score_distribution(scores: List[float]) -> List[ScoreDistribution]:
    """
    计算分数分布
    
    Args:
        scores: 分数列表
        
    Returns:
        List[ScoreDistribution]: 分数分布列表
    """
    ranges = [
        ("60-70", 60, 70),
        ("70-80", 70, 80),
        ("80-90", 80, 90),
        ("90-100", 90, 100)
    ]
    
    distribution = []
    for range_name, min_val, max_val in ranges:
        if range_name == "90-100":
            # 最后一个区间包含100
            count = sum(1 for s in scores if min_val <= s <= max_val)
        else:
            count = sum(1 for s in scores if min_val <= s < max_val)
        
        distribution.append(ScoreDistribution(
            range=range_name,
            count=count
        ))
    
    return distribution


async def get_candidate_rankings(
    db: AsyncIOMotorDatabase,
    session_id: str,
    page: int = 1,
    page_size: int = 20
) -> RankingResponse:
    """
    获取候选人排名
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        page: 页码
        page_size: 每页数量
        
    Returns:
        RankingResponse: 排名响应
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    # 检查场次是否存在
    try:
        session_data = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    if not session_data:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    session = Session.from_mongo(session_data)
    
    total = await db.candidates.count_documents({"session_id": ObjectId(session_id)})
    score_aggregates = await _get_candidate_score_aggregates(db, session_id)
    candidates = await db.candidates.find({"session_id": ObjectId(session_id)}).to_list(length=None)

    candidates.sort(
        key=lambda item: (
            score_aggregates.get(str(item["_id"]), {}).get("average_score") is not None,
            score_aggregates.get(str(item["_id"]), {}).get("average_score") or float("-inf"),
            -item.get("order", 0),
        ),
        reverse=True,
    )

    skip = (page - 1) * page_size
    page_candidates = candidates[skip: skip + page_size]

    items = []
    rank = skip + 1

    for candidate_data in page_candidates:
        # 获取候选人用户信息
        user = await db.users.find_one({"_id": candidate_data["user_id"]})
        if not user:
            continue
        
        candidate_info = CandidateInfo(
            id=str(candidate_data["_id"]),
            name=user.get("profile", {}).get("name", user.get("username", "")),
            avatar=user.get("profile", {}).get("avatar")
        )
        
        # 确定状态
        candidate_scores = score_aggregates.get(str(candidate_data["_id"]), {})
        avg_score = candidate_scores.get("average_score", 0)
        pass_threshold = session.settings.pass_threshold if session.settings else 70
        
        if avg_score >= pass_threshold:
            status = "passed"
        elif candidate_data.get("status") == "completed":
            status = "rejected"
        else:
            status = candidate_data.get("status", "waiting")
        
        items.append(RankingItem(
            rank=rank,
            candidate=candidate_info,
            average_score=round(avg_score, 2) if avg_score else 0.0,
            scores_count=candidate_scores.get("scores_count", 0),
            status=status
        ))
        
        rank += 1
    
    return RankingResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


async def get_dashboard_data(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> DashboardData:
    """
    获取实时大屏数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        DashboardData: 大屏数据
        
    Raises:
        ResourceNotFoundError: 场次不存在
    """
    # 检查场次是否存在
    try:
        session_data = await db.sessions.find_one({"_id": ObjectId(session_id)})
    except Exception:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    if not session_data:
        raise ResourceNotFoundError(resource_type="场次", resource_id=session_id)
    
    session = Session.from_mongo(session_data)
    
    # 场次基本信息
    session_info = SessionInfoForDashboard(
        name=session.name,
        date=session.date.strftime("%Y-%m-%d") if session.date else "",
        status=session.status.value
    )
    
    # 评分进度
    total_candidates = await db.candidates.count_documents({"session_id": ObjectId(session_id)})
    completed_scores = await db.scores.count_documents({
        "session_id": ObjectId(session_id),
        "status": {"$in": EFFECTIVE_SCORE_STATUSES}
    })
    
    # 计算完成率（总评分数 / (候选人数 * 评委数)）
    total_interviewers = await db.session_interviewers.count_documents({"session_id": ObjectId(session_id)})
    expected_total = total_candidates * total_interviewers
    completion_rate = round((completed_scores / expected_total * 100), 2) if expected_total > 0 else 0.0
    
    progress = ProgressInfo(
        total_candidates=total_candidates,
        completed_scores=completed_scores,
        completion_rate=completion_rate
    )
    
    # Top 10候选人排名
    top_candidates = await _get_top_candidates(db, session_id, limit=10)
    
    # 维度平均分（雷达图数据）
    dimension_averages = await _get_dimension_averages(db, session_id)
    
    # 分数分布（柱状图数据）
    score_distribution = await _get_score_distribution_chart(db, session_id)
    
    return DashboardData(
        session_info=session_info,
        progress=progress,
        top_candidates=top_candidates,
        dimension_averages=dimension_averages,
        score_distribution=score_distribution
    )


async def _get_top_candidates(
    db: AsyncIOMotorDatabase,
    session_id: str,
    limit: int = 10
) -> List[TopCandidate]:
    """
    获取Top候选人
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        limit: 数量限制
        
    Returns:
        List[TopCandidate]: Top候选人列表
    """
    score_aggregates = await _get_candidate_score_aggregates(db, session_id)
    candidates = await db.candidates.find({"session_id": ObjectId(session_id)}).to_list(length=None)
    candidates.sort(
        key=lambda item: (
            score_aggregates.get(str(item["_id"]), {}).get("average_score") is not None,
            score_aggregates.get(str(item["_id"]), {}).get("average_score") or float("-inf"),
            -item.get("order", 0),
        ),
        reverse=True,
    )

    top_candidates = []
    rank = 1

    for candidate_data in candidates[:limit]:
        # 获取候选人用户信息
        user = await db.users.find_one({"_id": candidate_data["user_id"]})
        if not user:
            continue
        
        name = user.get("profile", {}).get("name", user.get("username", ""))
        avg_score = score_aggregates.get(str(candidate_data["_id"]), {}).get("average_score", 0)
        
        top_candidates.append(TopCandidate(
            rank=rank,
            name=name,
            average_score=round(avg_score, 2) if avg_score else 0.0
        ))
        
        rank += 1
    
    return top_candidates


async def _get_dimension_averages(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> List[DimensionAverage]:
    """
    获取维度平均分
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        List[DimensionAverage]: 维度平均分列表
    """
    # 使用聚合管道获取维度平均分
    pipeline = [
        {"$match": {"session_id": ObjectId(session_id), "status": {"$in": EFFECTIVE_SCORE_STATUSES}}},
        {"$unwind": "$dimension_scores"},
        {"$group": {
            "_id": "$dimension_scores.dimension_name",
            "avg_score": {"$avg": "$dimension_scores.score"}
        }},
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.scores.aggregate(pipeline).to_list(length=None)
    
    dimension_averages = []
    for result in results:
        dimension_averages.append(DimensionAverage(
            dimension_name=result["_id"],
            average=round(result["avg_score"], 2) if result["avg_score"] else 0.0
        ))
    
    return dimension_averages


async def _get_score_distribution_chart(
    db: AsyncIOMotorDatabase,
    session_id: str
) -> ScoreDistributionChart:
    """
    获取分数分布图表数据
    
    Args:
        db: 数据库实例
        session_id: 场次ID
        
    Returns:
        ScoreDistributionChart: 分数分布图表数据
    """
    score_aggregates = await _get_candidate_score_aggregates(db, session_id)
    scores = [item["average_score"] for item in score_aggregates.values() if item["average_score"] is not None]
    
    # 计算分数分布
    distribution = _get_score_distribution(scores)
    
    labels = [d.range for d in distribution]
    data = [d.count for d in distribution]
    
    return ScoreDistributionChart(
        labels=labels,
        data=data
    )

async def get_overview_data(
    db: AsyncIOMotorDatabase,
) -> OverviewResponse:
    """
    获取管理概览数据
    
    Args:
        db: 数据库实例
        
    Returns:
        OverviewResponse: 概览数据（用户总数、场次总数、候选人总数、评分总数、场次列表）
    """
    # 统计用户总数
    total_users = await db.users.count_documents({})

    # 统计场次总数
    total_sessions = await db.sessions.count_documents({})

    # 统计全局候选人总数（跨所有场次）
    total_candidates = await db.candidates.count_documents({})

    # 统计全局已提交评分总数
    total_scores = await db.scores.count_documents({"status": {"$in": EFFECTIVE_SCORE_STATUSES}})

    # 获取场次列表（按创建时间倒序），并附带各场次统计
    sessions_cursor = db.sessions.find({}).sort("created_at", -1)
    sessions_data = await sessions_cursor.to_list(length=None)

    session_items: List[OverviewSessionItem] = []
    for session_data in sessions_data:
        session = Session.from_mongo(session_data)
        sid = ObjectId(session.id)

        # 该场次的候选人数量
        candidate_count = await db.candidates.count_documents({"session_id": sid})

        # 该场次的评委数量
        interviewer_count = await db.session_interviewers.count_documents({"session_id": sid})

        # 该场次的已提交评分数量
        score_count = await db.scores.count_documents({"session_id": sid, "status": {"$in": EFFECTIVE_SCORE_STATUSES}})

        created_at_str = ""
        if session.created_at:
            created_at_str = session.created_at.strftime("%Y-%m-%d %H:%M")

        session_items.append(OverviewSessionItem(
            id=session.id,
            name=session.name,
            status=session.status.value,
            date=session.date.strftime("%Y-%m-%d") if session.date else "",
            candidate_count=candidate_count,
            interviewer_count=interviewer_count,
            score_count=score_count,
            created_at=created_at_str,
        ))

    return OverviewResponse(
        total_users=total_users,
        total_sessions=total_sessions,
        total_candidates=total_candidates,
        total_scores=total_scores,
        sessions=session_items,
    )
