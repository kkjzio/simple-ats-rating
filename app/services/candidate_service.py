"""
候选人服务层
"""
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import UploadFile, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import openpyxl
from io import BytesIO

from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateImportResult,
    SelfRegisterRequest,
    SelfRegisterResponse
)
from app.utils.file_utils import save_uploaded_file, delete_file, get_file_path_from_url
from app.utils.datetime import get_current_time, ensure_timezone
from app.core.security import get_password_hash
from app.services.log_service import create_log
from app.models.operation_log import ActionType, ResourceType
from app.models.user import UserRole, UserStatus


async def _build_candidate_score_map(
    db: AsyncIOMotorDatabase,
    session_object_id: ObjectId,
    candidate_ids: Optional[List[ObjectId]] = None,
) -> Dict[str, Dict[str, Any]]:
    """按场次读取候选人的最新评分及统计。"""
    if candidate_ids is not None and len(candidate_ids) == 0:
        return {}

    match_query: Dict[str, Any] = {
        "session_id": session_object_id,
    }
    if candidate_ids:
        match_query["candidate_id"] = {"$in": candidate_ids}

    pipeline = [
        {"$match": match_query},
        {"$sort": {"updated_at": -1, "created_at": -1}},
        {
            "$group": {
                "_id": "$candidate_id",
                "total_score": {"$first": "$total_score"},
                "average_score": {"$avg": "$total_score"},
                "total_scores_count": {"$sum": 1},
            }
        },
    ]

    results = await db.scores.aggregate(pipeline).to_list(length=None)
    return {
        str(item["_id"]): {
            "total_score": round(item["total_score"], 2),
            "average_score": round(item["average_score"], 2),
            "total_scores_count": item["total_scores_count"],
        }
        for item in results
    }


def _normalize_resume_files(candidate: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    将候选人文档中的简历信息标准化为 resume_files 列表。
    兼容旧数据（只有 resume_url / resume_filename 字段）。
    """
    resume_files = candidate.get("resume_files")
    if resume_files:
        return [{"url": f["url"], "filename": f["filename"]} for f in resume_files if f.get("url")]

    # 向后兼容：旧字段转成列表
    resume_url = candidate.get("resume_url")
    resume_filename = candidate.get("resume_filename")
    if resume_url:
        return [{"url": resume_url, "filename": resume_filename or ""}]
    return []


def _build_candidate_response(
    candidate: Dict[str, Any],
    score_stats: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    user = candidate.get("user", {})
    stats = score_stats or {}
    resume_files = _normalize_resume_files(candidate)

    return {
        "id": str(candidate["_id"]),
        "user": {
            "id": str(user["_id"]),
            "name": user.get("profile", {}).get("name", ""),
            "phone": user.get("profile", {}).get("phone", ""),
            "email": user.get("profile", {}).get("email"),
            "avatar": user.get("profile", {}).get("avatar"),
        },
        "session_id": str(candidate["session_id"]),
        "order": candidate.get("order", 0),
        # 向后兼容：保留旧字段，取第一个文件
        "resume_url": resume_files[0]["url"] if resume_files else None,
        "resume_filename": resume_files[0]["filename"] if resume_files else None,
        # 新字段
        "resume_files": resume_files,
        "status": candidate.get("status", "waiting"),
        "gender": candidate.get("gender"),
        "education": candidate.get("education"),
        "work_experience": candidate.get("work_experience"),
        "total_score": stats.get("total_score"),
        "average_score": stats.get("average_score"),
        "total_scores_count": stats.get("total_scores_count", 0),
        "notes": candidate.get("notes"),
        "created_at": ensure_timezone(candidate["created_at"], assume_utc=True) if candidate.get("created_at") else None,
        "updated_at": ensure_timezone(candidate["updated_at"], assume_utc=True) if candidate.get("updated_at") else None,
    }


async def get_candidate_list(
    db: AsyncIOMotorDatabase,
    session_id: str,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    sort_by: str = "order"
) -> Dict[str, Any]:
    """
    获取候选人列表

    Args:
        db: 数据库连接
        session_id: 场次ID
        page: 页码
        page_size: 每页数量
        status: 状态筛选
        keyword: 关键词搜索
        sort_by: 排序字段 (order/total_score)

    Returns:
        分页数据
    """
    # 构建查询条件
    query = {"session_id": ObjectId(session_id)}

    if status:
        query["status"] = status

    # 关键词搜索需要关联用户表
    pipeline = [
        {"$match": query},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {"$unwind": "$user"}
    ]

    # 添加关键词搜索
    if keyword:
        pipeline.append({
            "$match": {
                "$or": [
                    {"user.profile.name": {"$regex": keyword, "$options": "i"}},
                    {"user.profile.phone": {"$regex": keyword, "$options": "i"}}
                ]
            }
        })

    # 计算总数
    count_pipeline = pipeline + [{"$count": "total"}]
    count_result = await db.candidates.aggregate(count_pipeline).to_list(1)
    total = count_result[0]["total"] if count_result else 0

    session_object_id = ObjectId(session_id)
    skip = (page - 1) * page_size

    if sort_by == "order":
        pipeline.append({"$sort": {"order": 1}})
        pipeline.extend([
            {"$skip": skip},
            {"$limit": page_size}
        ])
        candidates = await db.candidates.aggregate(pipeline).to_list(page_size)
    else:
        candidates = await db.candidates.aggregate(pipeline).to_list(length=None)

    candidate_ids = [candidate["_id"] for candidate in candidates]
    score_map = await _build_candidate_score_map(db, session_object_id, candidate_ids)

    if sort_by != "order":
        candidates.sort(
            key=lambda item: (
                score_map.get(str(item["_id"]), {}).get("total_score") is not None,
                score_map.get(str(item["_id"]), {}).get("total_score") or float("-inf"),
                -item.get("order", 0),
            ),
            reverse=True,
        )
        candidates = candidates[skip: skip + page_size]

    items = [_build_candidate_response(candidate, score_map.get(str(candidate["_id"]))) for candidate in candidates]

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


async def get_available_candidate_users(
    db: AsyncIOMotorDatabase,
    session_id: str,
    page: int = 1,
    page_size: int = 20,
    keyword: Optional[str] = None
) -> Dict[str, Any]:
    """获取可添加到场次的候选人用户列表"""
    # 验证场次是否存在
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="场次不存在")

    # 查询当前场次已绑定候选人 user_id
    existing_candidates = await db.candidates.find(
        {"session_id": ObjectId(session_id)},
        {"user_id": 1}
    ).to_list(None)
    excluded_user_ids = [item["user_id"] for item in existing_candidates if item.get("user_id")]

    # 构建用户查询
    user_query: Dict[str, Any] = {
        "role": UserRole.CANDIDATE.value,
        "status": UserStatus.ACTIVE.value
    }

    if excluded_user_ids:
        user_query["_id"] = {"$nin": excluded_user_ids}

    if keyword:
        user_query["$or"] = [
            {"username": {"$regex": keyword, "$options": "i"}},
            {"profile.name": {"$regex": keyword, "$options": "i"}},
            {"profile.phone": {"$regex": keyword, "$options": "i"}}
        ]

    total = await db.users.count_documents(user_query)

    skip = (page - 1) * page_size
    users = await db.users.find(user_query).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)

    items = [
        {
            "id": str(user["_id"]),
            "username": user.get("username", ""),
            "name": user.get("profile", {}).get("name", ""),
            "phone": user.get("profile", {}).get("phone", ""),
            "email": user.get("profile", {}).get("email"),
            "status": user.get("status", UserStatus.ACTIVE.value)
        }
        for user in users
    ]

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


async def get_candidate_by_id(
    db: AsyncIOMotorDatabase,
    candidate_id: str
) -> Optional[Dict[str, Any]]:
    """
    获取候选人详情

    Args:
        db: 数据库连接
        candidate_id: 候选人ID

    Returns:
        候选人信息
    """
    pipeline = [
        {"$match": {"_id": ObjectId(candidate_id)}},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {"$unwind": "$user"}
    ]

    candidates = await db.candidates.aggregate(pipeline).to_list(1)

    if not candidates:
        return None

    candidate = candidates[0]
    score_map = await _build_candidate_score_map(db, candidate["session_id"], [candidate["_id"]])

    return _build_candidate_response(candidate, score_map.get(str(candidate["_id"])))


async def create_candidate(
    db: AsyncIOMotorDatabase,
    session_id: str,
    candidate_data: CandidateCreate,
    resume_files: Optional[List[UploadFile]],
    current_user: Dict[str, Any]
) -> Dict[str, Any]:
    """
    创建候选人（支持多文件简历）

    Args:
        db: 数据库连接
        session_id: 场次ID
        candidate_data: 候选人数据
        resume_files: 简历文件列表
        current_user: 当前用户

    Returns:
        创建的候选人信息
    """
    # 验证场次是否存在
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="场次不存在")

    user = None
    user_id = None
    new_user_created = False
    initial_password = None

    if candidate_data.user_id:
        try:
            user_object_id = ObjectId(candidate_data.user_id)
        except Exception:
            raise HTTPException(status_code=400, detail="候选人用户ID格式无效")

        user = await db.users.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(status_code=404, detail="候选人用户不存在")

        if user.get("role") != UserRole.CANDIDATE.value:
            raise HTTPException(status_code=400, detail="所选用户不是候选人角色")

        if user.get("status") != UserStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="所选候选人账户不可用")

        user_id = user_object_id
    else:
        # 检查手机号是否已存在用户
        user = await db.users.find_one({"profile.phone": candidate_data.phone})

        # 如果用户不存在,创建候选人账户
        if not user:
            # 生成初始密码(手机号后6位)
            initial_password = candidate_data.phone[-6:]
            new_user_created = True

            user_doc = {
                "username": f"candidate_{candidate_data.phone}",
                "password_hash": get_password_hash(initial_password),
                "role": UserRole.CANDIDATE.value,
                "profile": {
                    "name": candidate_data.name,
                    "phone": candidate_data.phone,
                    "email": candidate_data.email,
                    "avatar": "/assets/avatars/default.jpg",
                    "department": ""
                },
                "status": UserStatus.ACTIVE.value,
                "last_login_at": None,
                "created_at": get_current_time(),
                "updated_at": get_current_time()
            }

            result = await db.users.insert_one(user_doc)
            user_id = result.inserted_id
            user = user_doc
            user["_id"] = user_id
        else:
            user_id = user["_id"]

    # 检查该用户是否已在该场次中
    existing = await db.candidates.find_one({
        "session_id": ObjectId(session_id),
        "user_id": user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="该候选人已在此场次中")

    # 保存简历文件列表
    saved_resume_files = []
    if resume_files:
        for resume_file in resume_files:
            if resume_file and resume_file.filename:
                file_info = await save_uploaded_file(resume_file, "resume")
                saved_resume_files.append({
                    "url": file_info["file_url"],
                    "filename": file_info["filename"]
                })

    # 自动分配面试顺序
    if candidate_data.order is None:
        # 获取当前最大order
        max_order_result = await db.candidates.find(
            {"session_id": ObjectId(session_id)}
        ).sort("order", -1).limit(1).to_list(1)

        if max_order_result:
            candidate_data.order = max_order_result[0].get("order", 0) + 1
        else:
            candidate_data.order = 1

    # 创建候选人记录
    candidate_doc = {
        "user_id": user_id,
        "session_id": ObjectId(session_id),
        "order": candidate_data.order,
        # 向后兼容字段
        "resume_url": saved_resume_files[0]["url"] if saved_resume_files else None,
        "resume_filename": saved_resume_files[0]["filename"] if saved_resume_files else None,
        # 新字段
        "resume_files": saved_resume_files,
        "status": "waiting",
        "gender": candidate_data.gender,
        "education": candidate_data.education,
        "work_experience": candidate_data.work_experience,
        "notes": candidate_data.notes,
        "created_at": get_current_time(),
        "updated_at": get_current_time()
    }

    result = await db.candidates.insert_one(candidate_doc)
    candidate_id = result.inserted_id

    # 更新场次统计信息
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$inc": {"statistics.total_candidates": 1},
            "$set": {"updated_at": get_current_time()}
        }
    )

    # 记录操作日志
    try:
        await create_log(
            db=db,
            user_id=str(current_user["_id"]) if current_user.get("_id") else None,
            action=ActionType.CANDIDATE_CREATE,
            resource_type=ResourceType.CANDIDATE,
            resource_id=str(candidate_id),
            details={
                "session_name": session.get("name"),
                "candidate_name": user.get("profile", {}).get("name"),
                "candidate_phone": user.get("profile", {}).get("phone"),
                "order": candidate_data.order
            }
        )
    except Exception as log_error:
        print(f"Warning: Failed to create log: {log_error}")
        print(f"current_user: {current_user}")

    # 返回创建的候选人信息
    result = await get_candidate_by_id(db, str(candidate_id))

    # 如果创建了新用户，添加初始密码信息
    if new_user_created and initial_password:
        result["new_account"] = {
            "created": True,
            "username": f"candidate_{candidate_data.phone}",
            "initial_password": initial_password,
            "message": f"已为候选人创建新账户，初始密码为：{initial_password}（手机号后6位）"
        }

    return result


async def update_candidate(
    db: AsyncIOMotorDatabase,
    candidate_id: str,
    candidate_data: CandidateUpdate,
    current_user: Dict[str, Any],
    resume_files: Optional[List[UploadFile]] = None
) -> Dict[str, Any]:
    """
    更新候选人信息（新上传的简历追加到已有列表）

    Args:
        db: 数据库连接
        candidate_id: 候选人ID
        candidate_data: 更新数据
        current_user: 当前用户
        resume_files: 新简历文件列表（追加）

    Returns:
        更新后的候选人信息
    """
    # 检查候选人是否存在
    candidate = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    # 更新用户 profile（name/phone/email）
    user_profile_update = {}
    if candidate_data.name is not None:
        user_profile_update["profile.name"] = candidate_data.name
    if candidate_data.phone is not None:
        user_profile_update["profile.phone"] = candidate_data.phone
    if candidate_data.email is not None:
        user_profile_update["profile.email"] = candidate_data.email

    if user_profile_update:
        user_profile_update["updated_at"] = get_current_time()
        await db.users.update_one(
            {"_id": ObjectId(candidate["user_id"])},
            {"$set": user_profile_update}
        )

    # 构建更新数据
    update_data = {"updated_at": get_current_time()}

    if candidate_data.order is not None:
        update_data["order"] = candidate_data.order

    if candidate_data.status is not None:
        update_data["status"] = candidate_data.status

    if candidate_data.gender is not None:
        update_data["gender"] = candidate_data.gender

    if candidate_data.education is not None:
        update_data["education"] = candidate_data.education

    if candidate_data.work_experience is not None:
        update_data["work_experience"] = candidate_data.work_experience

    if candidate_data.notes is not None:
        update_data["notes"] = candidate_data.notes

    # 处理新简历文件（追加到已有列表）
    if resume_files:
        existing_files = _normalize_resume_files(candidate)
        for resume_file in resume_files:
            if resume_file and resume_file.filename:
                file_info = await save_uploaded_file(resume_file, "resume")
                existing_files.append({
                    "url": file_info["file_url"],
                    "filename": file_info["filename"]
                })
        update_data["resume_files"] = existing_files
        # 同步更新向后兼容字段
        if existing_files:
            update_data["resume_url"] = existing_files[0]["url"]
            update_data["resume_filename"] = existing_files[0]["filename"]

    # 更新候选人
    await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": update_data}
    )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=str(current_user["_id"]),
        action=ActionType.CANDIDATE_UPDATE,
        resource_type=ResourceType.CANDIDATE,
        resource_id=candidate_id,
        details={
            "updates": {k: v for k, v in update_data.items() if k not in ("resume_files",)}
        }
    )

    return await get_candidate_by_id(db, candidate_id)


async def delete_resume_file(
    db: AsyncIOMotorDatabase,
    candidate_id: str,
    file_index: int,
    current_user: Dict[str, Any]
) -> Dict[str, Any]:
    """
    删除候选人的指定简历文件

    Args:
        db: 数据库连接
        candidate_id: 候选人ID
        file_index: 文件索引（从0开始）
        current_user: 当前用户

    Returns:
        更新后的候选人信息
    """
    candidate = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    resume_files = _normalize_resume_files(candidate)

    if file_index < 0 or file_index >= len(resume_files):
        raise HTTPException(status_code=404, detail="简历文件索引超出范围")

    # 删除磁盘上的文件
    file_to_delete = resume_files[file_index]
    file_path = get_file_path_from_url(file_to_delete["url"])
    if file_path:
        delete_file(file_path)

    # 从列表中移除
    resume_files.pop(file_index)

    update_data: Dict[str, Any] = {
        "resume_files": resume_files,
        "updated_at": get_current_time()
    }
    # 同步更新向后兼容字段
    if resume_files:
        update_data["resume_url"] = resume_files[0]["url"]
        update_data["resume_filename"] = resume_files[0]["filename"]
    else:
        update_data["resume_url"] = None
        update_data["resume_filename"] = None

    await db.candidates.update_one(
        {"_id": ObjectId(candidate_id)},
        {"$set": update_data}
    )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=str(current_user["_id"]),
        action=ActionType.CANDIDATE_UPDATE,
        resource_type=ResourceType.CANDIDATE,
        resource_id=candidate_id,
        details={"action": "delete_resume_file", "file_index": file_index}
    )

    return await get_candidate_by_id(db, candidate_id)


async def delete_candidate(
    db: AsyncIOMotorDatabase,
    candidate_id: str,
    current_user: Dict[str, Any]
) -> bool:
    """
    删除候选人

    Args:
        db: 数据库连接
        candidate_id: 候选人ID
        current_user: 当前用户

    Returns:
        是否删除成功
    """
    # 检查候选人是否存在
    candidate = await db.candidates.find_one({"_id": ObjectId(candidate_id)})
    if not candidate:
        raise HTTPException(status_code=404, detail="候选人不存在")

    # 检查是否有评分记录
    score_count = await db.scores.count_documents({"candidate_id": ObjectId(candidate_id)})
    if score_count > 0:
        raise HTTPException(status_code=400, detail="该候选人已有评分记录,不能删除")

    # 删除所有简历文件
    resume_files = _normalize_resume_files(candidate)
    for file_info in resume_files:
        file_path = get_file_path_from_url(file_info["url"])
        if file_path:
            delete_file(file_path)

    # 删除候选人记录
    await db.candidates.delete_one({"_id": ObjectId(candidate_id)})

    # 更新场次统计信息
    await db.sessions.update_one(
        {"_id": candidate["session_id"]},
        {
            "$inc": {"statistics.total_candidates": -1},
            "$set": {"updated_at": get_current_time()}
        }
    )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=str(current_user["_id"]),
        action=ActionType.CANDIDATE_DELETE,
        resource_type=ResourceType.CANDIDATE,
        resource_id=candidate_id,
        details={
            "session_id": str(candidate["session_id"])
        }
    )

    return True


async def import_candidates(
    db: AsyncIOMotorDatabase,
    session_id: str,
    excel_file: UploadFile,
    current_user: Dict[str, Any]
) -> CandidateImportResult:
    """
    批量导入候选人

    Args:
        db: 数据库连接
        session_id: 场次ID
        excel_file: Excel文件
        current_user: 当前用户

    Returns:
        导入结果
    """
    # 验证场次是否存在
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="场次不存在")

    # 读取Excel文件
    try:
        content = await excel_file.read()
        workbook = openpyxl.load_workbook(BytesIO(content))
        sheet = workbook.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel文件解析失败: {str(e)}")

    # 解析数据
    total = 0
    success = 0
    failed = 0
    errors = []

    # 获取当前最大order
    max_order_result = await db.candidates.find(
        {"session_id": ObjectId(session_id)}
    ).sort("order", -1).limit(1).to_list(1)

    current_order = max_order_result[0].get("order", 0) if max_order_result else 0

    # 跳过表头,从第2行开始
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        total += 1

        try:
            # 解析行数据 (序号, 姓名, 手机号, 邮箱, 应聘岗位)
            if len(row) < 3:
                errors.append({
                    "row": row_idx,
                    "reason": "数据不完整"
                })
                failed += 1
                continue

            name = str(row[1]).strip() if row[1] else ""
            phone = str(row[2]).strip() if row[2] else ""
            email = str(row[3]).strip() if row[3] and len(row) > 3 else None

            # 验证必填字段
            if not name or not phone:
                errors.append({
                    "row": row_idx,
                    "reason": "姓名或手机号为空"
                })
                failed += 1
                continue

            # 验证手机号格式
            from app.utils.validators import validate_phone
            if not validate_phone(phone):
                errors.append({
                    "row": row_idx,
                    "reason": "手机号格式错误"
                })
                failed += 1
                continue

            # 检查用户是否存在
            user = await db.users.find_one({"profile.phone": phone})

            if not user:
                # 创建候选人账户
                initial_password = phone[-6:]
                user_doc = {
                    "username": f"candidate_{phone}",
                    "password_hash": get_password_hash(initial_password),
                    "role": "candidate",
                    "profile": {
                        "name": name,
                        "phone": phone,
                        "email": email,
                        "avatar": "/assets/avatars/default.jpg",
                        "department": ""
                    },
                    "status": "active",
                    "last_login_at": None,
                    "created_at": get_current_time(),
                    "updated_at": get_current_time()
                }
                result = await db.users.insert_one(user_doc)
                user_id = result.inserted_id
            else:
                user_id = user["_id"]

            # 检查是否已在该场次中
            existing = await db.candidates.find_one({
                "session_id": ObjectId(session_id),
                "user_id": user_id
            })

            if existing:
                errors.append({
                    "row": row_idx,
                    "reason": "该候选人已在此场次中"
                })
                failed += 1
                continue

            # 创建候选人记录
            current_order += 1
            candidate_doc = {
                "user_id": user_id,
                "session_id": ObjectId(session_id),
                "order": current_order,
                "resume_url": None,
                "resume_filename": None,
                "resume_files": [],
                "status": "waiting",
                "notes": "",
                "created_at": get_current_time(),
                "updated_at": get_current_time()
            }

            await db.candidates.insert_one(candidate_doc)
            success += 1

        except Exception as e:
            errors.append({
                "row": row_idx,
                "reason": str(e)
            })
            failed += 1

    # 更新场次统计信息
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$inc": {"statistics.total_candidates": success},
            "$set": {"updated_at": get_current_time()}
        }
    )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=str(current_user["_id"]),
        action=ActionType.CANDIDATE_IMPORT,
        resource_type=ResourceType.CANDIDATE,
        resource_id=session_id,
        details={
            "session_name": session.get("name"),
            "total": total,
            "success": success,
            "failed": failed
        }
    )

    return CandidateImportResult(
        total=total,
        success=success,
        failed=failed,
        errors=errors
    )


async def reorder_candidates(
    db: AsyncIOMotorDatabase,
    session_id: str,
    orders: List[Dict[str, Any]],
    current_user: Dict[str, Any]
) -> bool:
    """
    调整候选人顺序

    Args:
        db: 数据库连接
        session_id: 场次ID
        orders: 顺序列表
        current_user: 当前用户

    Returns:
        是否成功
    """
    # 验证场次是否存在
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="场次不存在")

    # 验证order唯一性
    order_values = [item["order"] for item in orders]
    if len(order_values) != len(set(order_values)):
        raise HTTPException(status_code=400, detail="顺序号不能重复")

    # 批量更新
    for item in orders:
        await db.candidates.update_one(
            {
                "_id": ObjectId(item["candidate_id"]),
                "session_id": ObjectId(session_id)
            },
            {
                "$set": {
                    "order": item["order"],
                    "updated_at": get_current_time()
                }
            }
        )

    # 记录操作日志
    await create_log(
        db=db,
        user_id=str(current_user["_id"]),
        action=ActionType.CANDIDATE_ORDER_CHANGE,
        resource_type=ResourceType.CANDIDATE,
        resource_id=session_id,
        details={
            "session_name": session.get("name"),
            "changes": orders
        }
    )

    return True


async def self_register(
    db: AsyncIOMotorDatabase,
    session_token: str,
    register_data: SelfRegisterRequest,
    resume_files: Optional[List[UploadFile]]
) -> SelfRegisterResponse:
    """
    候选人自助注册（支持多文件简历）

    Args:
        db: 数据库连接
        session_token: 场次令牌
        register_data: 注册数据
        resume_files: 简历文件列表

    Returns:
        注册结果
    """
    # 验证session_token
    session = await db.sessions.find_one({"qr_code_token": session_token})
    if not session:
        raise HTTPException(status_code=404, detail="无效的场次令牌")

    # 检查token是否过期
    if session.get("qr_code_expires_at") and session["qr_code_expires_at"] < get_current_time():
        raise HTTPException(status_code=400, detail="场次令牌已过期")

    # 检查手机号是否已存在
    existing_user = await db.users.find_one({"profile.phone": register_data.phone})
    if existing_user:
        # 检查是否已在该场次中
        existing_candidate = await db.candidates.find_one({
            "session_id": session["_id"],
            "user_id": existing_user["_id"]
        })
        if existing_candidate:
            raise HTTPException(status_code=400, detail="您已注册过该场次")

        user_id = existing_user["_id"]
        username = existing_user["username"]
        initial_password = register_data.phone[-6:]
    else:
        # 创建候选人账户
        initial_password = register_data.phone[-6:]
        username = f"candidate_{register_data.phone}"

        user_doc = {
            "username": username,
            "password_hash": get_password_hash(initial_password),
            "role": "candidate",
            "profile": {
                "name": register_data.name,
                "phone": register_data.phone,
                "email": register_data.email,
                "avatar": "/assets/avatars/default.jpg",
                "department": ""
            },
            "status": "active",
            "last_login_at": None,
            "created_at": get_current_time(),
            "updated_at": get_current_time()
        }

        result = await db.users.insert_one(user_doc)
        user_id = result.inserted_id

    # 保存多文件简历
    saved_resume_files = []
    if resume_files:
        for resume_file in resume_files:
            if resume_file and resume_file.filename:
                file_info = await save_uploaded_file(resume_file, "resume")
                saved_resume_files.append({
                    "url": file_info["file_url"],
                    "filename": file_info["filename"]
                })

    # 自动分配顺序
    max_order_result = await db.candidates.find(
        {"session_id": session["_id"]}
    ).sort("order", -1).limit(1).to_list(1)

    order = max_order_result[0].get("order", 0) + 1 if max_order_result else 1

    # 创建候选人记录
    candidate_doc = {
        "user_id": user_id,
        "session_id": session["_id"],
        "order": order,
        # 向后兼容字段
        "resume_url": saved_resume_files[0]["url"] if saved_resume_files else None,
        "resume_filename": saved_resume_files[0]["filename"] if saved_resume_files else None,
        # 新字段
        "resume_files": saved_resume_files,
        "status": "waiting",
        "notes": f"应聘岗位: {register_data.position}" if register_data.position else "",
        "created_at": get_current_time(),
        "updated_at": get_current_time()
    }

    await db.candidates.insert_one(candidate_doc)

    # 更新场次统计
    await db.sessions.update_one(
        {"_id": session["_id"]},
        {
            "$inc": {"statistics.total_candidates": 1},
            "$set": {"updated_at": get_current_time()}
        }
    )

    return SelfRegisterResponse(
        username=username,
        initial_password=initial_password,
        login_url="/candidate/login",
        message="注册成功!请使用手机号和初始密码登录系统，密码默认为手机后6位。"
    )