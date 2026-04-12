"""
Score management routes.
Interviewer-specific routes are defined in interviewer.py.
"""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_db, get_current_user, require_super_admin
from app.models.user import User
from app.schemas.score import AdminModifyScoreRequest
from app.services.score_service import get_score_service
from app.utils.response import success_response


router = APIRouter(tags=["score-management"])


@router.get("/scores/{score_id}", response_model=dict)
async def get_score_detail(
    score_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    service = await get_score_service(db)
    result = await service.get_score_detail(score_id, current_user)
    return success_response(data=result, message="获取评分详情成功")


@router.get("/candidates/{candidate_id}/scores", response_model=dict)
async def get_candidate_scores(
    candidate_id: str,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    service = await get_score_service(db)
    result = await service.get_candidate_scores(candidate_id, current_user)
    return success_response(data=result, message="获取候选人评分成功")


@router.put("/scores/{score_id}/admin-modify", response_model=dict)
async def admin_modify_score(
    score_id: str,
    modify_data: AdminModifyScoreRequest,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    service = await get_score_service(db)
    result = await service.admin_modify_score(score_id, modify_data, current_user)
    return success_response(data=result, message="评分修改成功")


@router.delete("/scores/{score_id}/admin-delete", response_model=dict)
async def admin_delete_score(
    score_id: str,
    current_user: User = Depends(require_super_admin),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    service = await get_score_service(db)
    result = await service.admin_delete_score(score_id, current_user)
    return success_response(data=result, message="评分删除成功")
