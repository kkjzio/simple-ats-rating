"""
候选人管理路由
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import get_current_user, get_db, require_super_admin, require_interviewer, require_candidate
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    CandidateListResponse,
    CandidateImportResult,
    ReorderRequest,
    SelfRegisterRequest,
    SelfRegisterResponse,
    CandidateMyInfo,
    CandidateSessionStatus,
)
from app.services import candidate_service
from app.utils.response import success_response, error_response
from app.utils.datetime import ensure_timezone


router = APIRouter()


# ==================== 超管接口 ====================

@router.get("/sessions/{session_id}/candidates", response_model=dict)
async def get_session_candidates(
    session_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="状态筛选"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    sort_by: str = Query("order", description="排序字段"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """获取场次候选人列表"""
    try:
        result = await candidate_service.get_candidate_list(
            db=db,
            session_id=session_id,
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword,
            sort_by=sort_by
        )
        return success_response(data=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"获取候选人列表失败: {str(e)}", code=500)


@router.get("/sessions/{session_id}/candidate-users/available", response_model=dict)
async def get_available_candidate_users(
    session_id: str,
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """获取可添加到场次的候选人用户列表"""
    try:
        result = await candidate_service.get_available_candidate_users(
            db=db,
            session_id=session_id,
            page=page,
            page_size=page_size,
            keyword=keyword
        )
        return success_response(data=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"获取可选候选人用户失败: {str(e)}", code=500)


@router.post("/sessions/{session_id}/candidates", response_model=dict, status_code=201)
async def create_candidate(
    session_id: str,
    user_id: Optional[str] = Form(None, description="已有候选人用户ID"),
    name: Optional[str] = Form(None, description="姓名"),
    phone: Optional[str] = Form(None, description="手机号"),
    email: Optional[str] = Form(None, description="邮箱"),
    order: Optional[int] = Form(None, description="面试顺序"),
    notes: Optional[str] = Form(None, description="备注"),
    resumes: List[UploadFile] = File(default=[], description="简历文件列表（支持多个）"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """添加候选人（支持上传多个简历文件）"""
    try:
        # 构建候选人数据
        candidate_data = CandidateCreate(
            user_id=user_id,
            name=name,
            phone=phone,
            email=email,
            order=order,
            notes=notes
        )

        # 过滤空文件
        valid_resumes = [f for f in resumes if f and f.filename] if resumes else []

        # 转换User对象为dict
        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }

        result = await candidate_service.create_candidate(
            db=db,
            session_id=session_id,
            candidate_data=candidate_data,
            resume_files=valid_resumes or None,
            current_user=current_user_dict
        )

        # 如果创建了新账户，在消息中提示初始密码
        message = "候选人添加成功"
        if result.get("new_account", {}).get("created"):
            new_account_info = result["new_account"]
            message = f"候选人添加成功！{new_account_info['message']}"

        return success_response(data=result, message=message, code=201)
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"添加候选人失败: {str(e)}", code=500)


@router.get("/candidates/{candidate_id}", response_model=dict)
async def get_candidate_detail(
    candidate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """获取候选人详情"""
    try:
        result = await candidate_service.get_candidate_by_id(db, candidate_id)
        if not result:
            raise HTTPException(status_code=404, detail="候选人不存在")
        return success_response(data=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"获取候选人详情失败: {str(e)}", code=500)


@router.put("/candidates/{candidate_id}", response_model=dict)
async def update_candidate(
    candidate_id: str,
    name: Optional[str] = Form(None, description="候选人姓名"),
    phone: Optional[str] = Form(None, description="手机号"),
    email: Optional[str] = Form(None, description="邮箱"),
    order: Optional[int] = Form(None, description="面试顺序"),
    status: Optional[str] = Form(None, description="状态"),
    notes: Optional[str] = Form(None, description="备注"),
    resumes: List[UploadFile] = File(default=[], description="新增简历文件（追加到已有列表）"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """更新候选人信息（仅管理员），新上传的简历追加到已有列表"""
    try:
        candidate_data = CandidateUpdate(name=name, phone=phone, email=email, order=order, status=status, notes=notes)
        valid_resumes = [f for f in resumes if f and f.filename] if resumes else []
        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }
        result = await candidate_service.update_candidate(
            db=db,
            candidate_id=candidate_id,
            candidate_data=candidate_data,
            resume_files=valid_resumes or None,
            current_user=current_user_dict
        )
        return success_response(data=result, message="更新成功")
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"更新候选人失败: {str(e)}", code=500)


@router.delete("/candidates/{candidate_id}/resumes/{file_index}", response_model=dict)
async def delete_resume_file(
    candidate_id: str,
    file_index: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """删除候选人的指定简历文件（按索引，从0开始）"""
    try:
        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }
        result = await candidate_service.delete_resume_file(
            db=db,
            candidate_id=candidate_id,
            file_index=file_index,
            current_user=current_user_dict
        )
        return success_response(data=result, message="简历文件删除成功")
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"删除简历文件失败: {str(e)}", code=500)


@router.get("/candidates/{candidate_id}/resumes/{file_index}/download")
async def download_resume_by_index(
    candidate_id: str,
    file_index: int,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """按索引下载候选人的指定简历文件（管理员和面试官可访问）"""
    from fastapi.responses import FileResponse
    import os
    from app.services.candidate_service import _normalize_resume_files

    candidate = await db.candidates.find_one({"_id": __import__('bson').ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    resume_files = _normalize_resume_files(candidate)

    if not resume_files:
        raise HTTPException(status_code=404, detail="该候选人未上传简历")

    if file_index < 0 or file_index >= len(resume_files):
        raise HTTPException(status_code=404, detail="简历文件索引超出范围")

    file_info = resume_files[file_index]
    file_path = file_info["url"].lstrip("/")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="简历文件不存在")

    filename = file_info.get("filename") or os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")


@router.get("/candidates/{candidate_id}/resume/download")
async def download_resume(
    candidate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """下载候选人简历（向后兼容，下载第一个文件）"""
    from fastapi.responses import FileResponse
    import os
    from app.services.candidate_service import _normalize_resume_files

    candidate = await db.candidates.find_one({"_id": __import__('bson').ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    resume_files = _normalize_resume_files(candidate)
    if not resume_files:
        raise HTTPException(status_code=404, detail="该候选人未上传简历")

    file_info = resume_files[0]
    file_path = file_info["url"].lstrip("/")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="简历文件不存在")

    filename = file_info.get("filename") or os.path.basename(file_path)
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")


@router.delete("/candidates/{candidate_id}", response_model=dict)
async def delete_candidate(
    candidate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """删除候选人"""
    try:
        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }

        await candidate_service.delete_candidate(
            db=db,
            candidate_id=candidate_id,
            current_user=current_user_dict
        )
        return success_response(message="删除成功")
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"删除候选人失败: {str(e)}", code=500)


@router.post("/sessions/{session_id}/candidates/import", response_model=dict)
async def import_candidates(
    session_id: str,
    file: UploadFile = File(..., description="Excel文件"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """批量导入候选人"""
    try:
        # 验证文件类型
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="只支持Excel文件(.xlsx, .xls)")

        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }

        result = await candidate_service.import_candidates(
            db=db,
            session_id=session_id,
            excel_file=file,
            current_user=current_user_dict
        )

        return success_response(data=result.dict(), message="导入完成")
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"导入失败: {str(e)}", code=500)


@router.post("/sessions/{session_id}/candidates/reorder", response_model=dict)
async def reorder_candidates(
    session_id: str,
    reorder_data: ReorderRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """调整候选人顺序"""
    try:
        orders = [{"candidate_id": item.candidate_id, "order": item.order}
                  for item in reorder_data.orders]

        current_user_dict = {
            "_id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value
        }

        await candidate_service.reorder_candidates(
            db=db,
            session_id=session_id,
            orders=orders,
            current_user=current_user_dict
        )

        return success_response(message="顺序调整成功")
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"调整顺序失败: {str(e)}", code=500)


# ==================== 公开接口 ====================

@router.post("/candidates/self-register", response_model=dict)
async def self_register(
    session_token: str = Form(..., description="场次令牌"),
    name: str = Form(..., description="姓名"),
    phone: str = Form(..., description="手机号"),
    email: Optional[str] = Form(None, description="邮箱"),
    position: Optional[str] = Form(None, description="应聘岗位"),
    resumes: List[UploadFile] = File(default=[], description="简历文件列表（支持多个）"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """候选人自助注册（支持上传多个简历文件）"""
    try:
        # 构建注册数据
        register_data = SelfRegisterRequest(
            session_token=session_token,
            name=name,
            phone=phone,
            email=email,
            position=position
        )

        valid_resumes = [f for f in resumes if f and f.filename] if resumes else []

        result = await candidate_service.self_register(
            db=db,
            session_token=session_token,
            register_data=register_data,
            resume_files=valid_resumes or None
        )

        return success_response(
            data=result.dict(),
            message="注册成功,请使用手机号和初始密码登录",
            code=201
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"注册失败: {str(e)}", code=500)


# ==================== 候选人接口 ====================

@router.get("/candidate/my-info", response_model=dict)
async def get_my_info(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    """查看自己的信息"""
    try:
        from bson import ObjectId

        # 获取候选人参加的所有场次
        candidates = await db.candidates.find(
            {"user_id": current_user.id}
        ).to_list(None)

        sessions = []
        for candidate in candidates:
            # 获取场次信息
            session = await db.sessions.find_one({"_id": candidate["session_id"]})
            if session:
                sessions.append({
                    "session": {
                        "id": str(session["_id"]),
                        "name": session.get("name"),
                        "date": ensure_timezone(session["date"], assume_utc=True) if session.get("date") else None,
                        "position": session.get("position")
                    },
                    "my_order": candidate.get("order"),
                    "resume_url": candidate.get("resume_url"),
                    "status": candidate.get("status")
                })

        result = {
            "profile": {
                "id": str(current_user.id),
                "name": current_user.profile.name,
                "phone": current_user.profile.phone,
                "email": current_user.profile.email,
                "avatar": current_user.profile.avatar
            },
            "sessions": sessions
        }

        return success_response(data=result)
    except Exception as e:
        return error_response(message=f"获取信息失败: {str(e)}", code=500)


@router.get("/candidate/sessions/{session_id}/status", response_model=dict)
async def get_session_status(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_candidate)
):
    """查看面试状态"""
    try:
        from bson import ObjectId

        # 获取候选人在该场次的信息
        candidate = await db.candidates.find_one({
            "session_id": ObjectId(session_id),
            "user_id": current_user.id
        })

        if not candidate:
            raise HTTPException(status_code=404, detail="未找到该场次的面试记录")

        # 获取场次信息
        session = await db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="场次不存在")

        result = {
            "session": {
                "name": session.get("name"),
                "date": ensure_timezone(session["date"], assume_utc=True) if session.get("date") else None,
                "position": session.get("position")
            },
            "my_order": candidate.get("order"),
            "status": candidate.get("status")
        }

        return success_response(data=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        return error_response(message=f"获取状态失败: {str(e)}", code=500)