"""
导出相关API路由
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

from app.api.deps import get_current_user, get_db, require_super_admin
from app.utils.datetime import ensure_timezone
from app.services.export_service import ExportService
from app.schemas.export import (
    CandidateScoresExportRequest,
    InterviewerStatsExportRequest,
    StatsScoresExportRequest,
    ExportTaskResponse,
    ExportTaskListResponse
)
from app.utils.response import success_response

router = APIRouter()


@router.post(
    "/sessions/{session_id}/export/candidate-scores",
    response_model=dict,
    summary="导出候选人得分",
    dependencies=[Depends(require_super_admin)]
)
async def export_candidate_scores(
    session_id: str,
    request: CandidateScoresExportRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    导出候选人得分明细（超管）
    
    - **session_id**: 场次ID
    - **include_feedbacks**: 是否包含评语
    """
    service = ExportService(db)
    
    try:
        task = await service.create_export_task(
            session_id=session_id,
            export_type="candidate_scores",
            options={"include_feedbacks": request.include_feedbacks},
            current_user=current_user
        )
        
        return success_response(
            data={
                "task_id": task["_id"],
                "status": task["status"]
            },
            message="导出任务已创建"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建导出任务失败: {str(e)}")


@router.post(
    "/sessions/{session_id}/export/interviewer-stats",
    response_model=dict,
    summary="导出评委统计",
    dependencies=[Depends(require_super_admin)]
)
async def export_interviewer_stats(
    session_id: str,
    request: InterviewerStatsExportRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    导出评委统计（超管）
    
    - **session_id**: 场次ID
    """
    service = ExportService(db)
    
    try:
        task = await service.create_export_task(
            session_id=session_id,
            export_type="interviewer_stats",
            options={},
            current_user=current_user
        )
        
        return success_response(
            data={
                "task_id": task["_id"],
                "status": task["status"]
            },
            message="导出任务已创建"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建导出任务失败: {str(e)}")


@router.post(
    "/exports/stats/scores",
    summary="导出统计总览评分",
    dependencies=[Depends(require_super_admin)]
)
async def export_stats_scores(
    request: StatsScoresExportRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = ExportService(db)
    file_path = await service.export_stats_scores(request.session_ids)

    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.post(
    "/exports/stats/sessions/{session_id}/scores-detail",
    summary="导出场次统计详情",
    dependencies=[Depends(require_super_admin)]
)
async def export_session_scores_detail(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    service = ExportService(db)
    file_path = await service.export_session_scores_detail(session_id)

    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get(
    "/exports/{task_id}",
    response_model=dict,
    summary="获取导出任务状态"
)
async def get_export_task_status(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取导出任务状态
    
    - **task_id**: 任务ID
    """
    service = ExportService(db)
    task = await service.get_export_task_status(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    
    # 权限检查：只能查看自己的任务或超管可以查看所有任务
    if (current_user.role.value != "super_admin" and
        task["created_by"] != str(current_user.id)):
        raise HTTPException(status_code=403, detail="无权查看此导出任务")
    
    return success_response(
        data={
            "task_id": task["_id"],
            "session_id": task["session_id"],
            "export_type": task["export_type"],
            "status": task["status"],
            "download_url": task.get("download_url"),
            "created_at": ensure_timezone(task["created_at"], assume_utc=True) if task.get("created_at") else None,
            "completed_at": ensure_timezone(task["completed_at"], assume_utc=True) if task.get("completed_at") else None,
            "expires_at": ensure_timezone(task["expires_at"], assume_utc=True) if task.get("expires_at") else None,
            "error_message": task.get("error_message")
        }
    )


@router.get(
    "/exports",
    response_model=dict,
    summary="获取导出历史"
)
async def get_export_history(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    获取导出历史
    
    - **page**: 页码
    - **page_size**: 每页数量
    """
    service = ExportService(db)
    result = await service.get_export_history(
        current_user=current_user,
        page=page,
        page_size=page_size
    )
    
    # 格式化返回数据
    items = []
    for task in result["items"]:
        items.append({
            "task_id": task["_id"],
            "session_id": task["session_id"],
            "export_type": task["export_type"],
            "status": task["status"],
            "download_url": task.get("download_url"),
            "created_at": ensure_timezone(task["created_at"], assume_utc=True) if task.get("created_at") else None,
            "completed_at": ensure_timezone(task["completed_at"], assume_utc=True) if task.get("completed_at") else None,
            "expires_at": ensure_timezone(task["expires_at"], assume_utc=True) if task.get("expires_at") else None,
            "error_message": task.get("error_message")
        })
    
    return success_response(
        data={
            "total": result["total"],
            "page": result["page"],
            "page_size": result["page_size"],
            "items": items
        }
    )


@router.get(
    "/exports/{task_id}/download",
    summary="下载导出文件"
)
async def download_export_file(
    task_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    下载导出文件
    
    - **task_id**: 任务ID
    """
    service = ExportService(db)
    
    # 获取任务信息
    task = await service.get_export_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="导出任务不存在")
    
    # 权限检查
    if (current_user.role.value != "super_admin" and
        task["created_by"] != str(current_user.id)):
        raise HTTPException(status_code=403, detail="无权下载此文件")
    
    # 获取文件路径
    file_path = await service.get_export_file_path(task_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="文件不存在或已过期")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 返回文件
    filename = os.path.basename(file_path)
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
