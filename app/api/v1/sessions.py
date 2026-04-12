"""
场次管理路由
超管接口和评委接口
"""

from datetime import date as DateType
from typing import Optional
from fastapi import APIRouter, Depends, Query, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
import math

from app.api.deps import get_db, require_super_admin, require_interviewer, get_current_user
from app.models.user import User
from app.models.session import SessionStatus
from app.schemas.session import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    SessionListResponse,
    QRCodeResponse,
    JoinSessionRequest,
    AssignInterviewersRequest,
    UpdateStatusRequest,
    SessionInterviewersResponse,
    InterviewerInfo,
    SessionSettingsSchema,
    SessionStatisticsSchema
)
from app.schemas.common import MessageResponse
from app.services import session_service
from app.utils.response import success_response, error_response


router = APIRouter()


# ==================== 超管接口 ====================

@router.get("", response_model=SessionListResponse, summary="获取场次列表")
async def get_sessions(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
    status: Optional[SessionStatus] = Query(default=None, description="状态筛选"),
    date_from: Optional[DateType] = Query(default=None, description="开始日期"),
    date_to: Optional[DateType] = Query(default=None, description="结束日期"),
    keyword: Optional[str] = Query(default=None, description="搜索关键词"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    获取场次列表（分页、筛选、搜索）
    
    - **page**: 页码，从1开始
    - **page_size**: 每页数量，最大100
    - **status**: 状态筛选（draft/active/completed/archived）
    - **date_from**: 开始日期
    - **date_to**: 结束日期
    - **keyword**: 搜索关键词，支持场次名称和岗位的模糊搜索
    
    需要超级管理员权限
    """
    sessions, total = await session_service.get_session_list(
        db=db,
        page=page,
        page_size=page_size,
        status=status,
        date_from=date_from,
        date_to=date_to,
        keyword=keyword
    )
    
    # 转换为响应格式
    items = [
        SessionResponse(
            id=s.id,
            name=s.name,
            date=s.date,
            position=s.position,
            round=s.round,
            status=s.status,
            scoring_template_id=s.scoring_template_id,
            settings=SessionSettingsSchema(**s.settings.model_dump()),
            statistics=SessionStatisticsSchema(**s.statistics.model_dump()),
            description=getattr(s, 'description', None),
            qr_code_url=s.qr_code_url,
            qr_code_expires_at=s.qr_code_expires_at,
            created_by=s.created_by,
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        for s in sessions
    ]
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return SessionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{session_id}", response_model=SessionResponse, summary="获取场次详情")
async def get_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_interviewer)
):
    """
    根据ID获取场次详情
    
    - **session_id**: 场次ID
    
    需要面试官或超级管理员权限
    """
    session = await session_service.get_session_by_id(db, session_id)
    
    return SessionResponse(
        id=session.id,
        name=session.name,
        date=session.date,
        position=session.position,
        round=session.round,
        status=session.status,
        scoring_template_id=session.scoring_template_id,
        settings=SessionSettingsSchema(**session.settings.model_dump()),
        statistics=SessionStatisticsSchema(**session.statistics.model_dump()),
        description=getattr(session, 'description', None),
        qr_code_url=session.qr_code_url,
        qr_code_expires_at=session.qr_code_expires_at,
        created_by=session.created_by,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.post("", response_model=dict, summary="创建场次", status_code=201)
async def create_session(
    session_data: SessionCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    创建场次
    
    - **name**: 场次名称（必填，1-100字符）
    - **date**: 面试日期（必填，不能为过去时间）
    - **position**: 面试岗位（必填，1-100字符）
    - **round**: 面试轮次（必填，1-10）
    - **scoring_template_id**: 评分模板ID（必填）
    - **settings**: 场次设置（可选）
        - **anonymous_mode**: 是否匿名评分（默认false）
        - **pass_threshold**: 通过分数线（默认60，0-100）
        - **extreme_score_threshold**: 极端分预警阈值（默认30，0-100）
    - **description**: 场次描述（可选，最多500字符）
    
    需要超级管理员权限
    
    **自动操作**：
    - 生成二维码（24小时有效期）
    - 初始化统计信息
    - 状态设为draft
    """
    try:
        session = await session_service.create_session(
            db=db,
            session_data=session_data,
            current_user=current_user
        )
        
        session_response = {
            "id": session.id,
            "name": session.name,
            "date": session.date,
            "position": session.position,
            "round": session.round,
            "status": session.status,
            "scoring_template_id": session.scoring_template_id,
            "settings": session.settings.model_dump(),
            "statistics": session.statistics.model_dump(),
            "description": getattr(session, 'description', None),
            "qr_code_url": session.qr_code_url,
            "qr_code_expires_at": session.qr_code_expires_at,
            "created_by": session.created_by,
            "created_at": session.created_at,
            "updated_at": session.updated_at
        }
        
        return success_response(data=session_response, message="场次创建成功", code=201)
    except Exception as e:
        return error_response(message=f"创建场次失败: {str(e)}", code=500)


@router.put("/{session_id}", response_model=SessionResponse, summary="更新场次")
async def update_session(
    session_id: str,
    session_data: SessionUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    更新场次
    
    - **session_id**: 场次ID
    - **name**: 场次名称（可选，1-100字符）
    - **date**: 面试日期（可选，不能为过去时间）
    - **position**: 面试岗位（可选，1-100字符）
    - **round**: 面试轮次（可选，1-10）
    - **scoring_template_id**: 评分模板ID（可选）
    - **settings**: 场次设置（可选）
    - **description**: 场次描述（可选，最多500字符）
    
    需要超级管理员权限
    
    **业务规则**：
    - 已完成（completed）的场次不能修改
    - 如果修改评分模板，且已有评分记录，则不允许修改
    """
    session = await session_service.update_session(
        db=db,
        session_id=session_id,
        session_data=session_data,
        current_user=current_user
    )
    
    return SessionResponse(
        id=session.id,
        name=session.name,
        date=session.date,
        position=session.position,
        round=session.round,
        status=session.status,
        scoring_template_id=session.scoring_template_id,
        settings=SessionSettingsSchema(**session.settings.model_dump()),
        statistics=SessionStatisticsSchema(**session.statistics.model_dump()),
        description=getattr(session, 'description', None),
        qr_code_url=session.qr_code_url,
        qr_code_expires_at=session.qr_code_expires_at,
        created_by=session.created_by,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.delete("/{session_id}", response_model=MessageResponse, summary="删除场次")
async def delete_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    删除场次
    
    - **session_id**: 场次ID
    
    需要超级管理员权限
    
    **业务规则**：
    - 有评分记录的场次不能删除，只能归档
    - 删除场次时会同时删除关联的评委绑定记录
    """
    await session_service.delete_session(
        db=db,
        session_id=session_id,
        current_user=current_user
    )
    
    return MessageResponse(message="场次删除成功")


@router.patch("/{session_id}/status", response_model=SessionResponse, summary="更新场次状态")
async def update_session_status(
    session_id: str,
    status_data: UpdateStatusRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    更新场次状态
    
    - **session_id**: 场次ID
    - **status**: 新状态（draft/active/completed/archived）
    
    需要超级管理员权限
    
    **状态流转规则**：
    - draft → active（开始面试）
    - active → completed（完成面试）
    - completed → archived（归档）
    - 不允许逆向流转
    """
    session = await session_service.update_session_status(
        db=db,
        session_id=session_id,
        new_status=status_data.status,
        current_user=current_user
    )
    
    return SessionResponse(
        id=session.id,
        name=session.name,
        date=session.date,
        position=session.position,
        round=session.round,
        status=session.status,
        scoring_template_id=session.scoring_template_id,
        settings=SessionSettingsSchema(**session.settings.model_dump()),
        statistics=SessionStatisticsSchema(**session.statistics.model_dump()),
        description=getattr(session, 'description', None),
        qr_code_url=session.qr_code_url,
        qr_code_expires_at=session.qr_code_expires_at,
        created_by=session.created_by,
        created_at=session.created_at,
        updated_at=session.updated_at
    )


@router.post("/{session_id}/regenerate-qrcode", response_model=QRCodeResponse, summary="重新生成二维码")
async def regenerate_qrcode(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    重新生成二维码
    
    - **session_id**: 场次ID
    
    需要超级管理员权限
    
    **说明**：
    - 生成新的二维码token和图片
    - 过期时间重置为24小时
    - 旧的二维码将失效
    """
    qr_info = await session_service.regenerate_qrcode(
        db=db,
        session_id=session_id,
        current_user=current_user
    )
    
    return QRCodeResponse(
        qr_code_url=qr_info["qr_code_url"],
        qr_code_token=qr_info["qr_code_token"],
        expires_at=qr_info["expires_at"]
    )


@router.post("/{session_id}/assign-interviewers", response_model=MessageResponse, summary="分配评委")
async def assign_interviewers(
    session_id: str,
    request_data: AssignInterviewersRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    分配评委到场次
    
    - **session_id**: 场次ID
    - **interviewer_ids**: 评委ID列表
    
    需要超级管理员权限
    
    **说明**：
    - 批量分配评委
    - 已绑定的评委会自动跳过
    - 自动更新场次统计信息
    """
    added_count = await session_service.assign_interviewers(
        db=db,
        session_id=session_id,
        interviewer_ids=request_data.interviewer_ids,
        current_user=current_user
    )
    
    return MessageResponse(message=f"成功分配 {added_count} 位评委")


@router.delete("/{session_id}/interviewers/{interviewer_id}", response_model=MessageResponse, summary="解绑评委")
async def remove_session_interviewer(
    session_id: str,
    interviewer_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    解绑场次评委

    - **session_id**: 场次ID
    - **interviewer_id**: 评委ID

    需要超级管理员权限

    **业务规则**：
    - 仅 draft 场次允许管理评委（增删）
    - active/completed/archived 场次禁止解绑
    - 归档场次不可删除评委
    """
    await session_service.remove_interviewer(
        db=db,
        session_id=session_id,
        interviewer_id=interviewer_id,
        current_user=current_user
    )

    return MessageResponse(message="评委解绑成功")


@router.get("/{session_id}/interviewers", response_model=SessionInterviewersResponse, summary="获取场次评委列表")
async def get_session_interviewers(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(require_super_admin)
):
    """
    获取场次评委列表
    
    - **session_id**: 场次ID
    
    需要超级管理员权限
    """
    interviewers_data = await session_service.get_session_interviewers(
        db=db,
        session_id=session_id
    )
    
    interviewers = [
        InterviewerInfo(
            id=i["id"],
            username=i["username"],
            real_name=i.get("real_name"),
            email=i["email"],
            joined_at=i["joined_at"]
        )
        for i in interviewers_data
    ]
    
    return SessionInterviewersResponse(
        session_id=session_id,
        interviewers=interviewers,
        total=len(interviewers)
    )


# ==================== 评委接口 ====================

@router.post("/join-by-qrcode", response_model=SessionResponse, summary="评委扫码绑定场次")
async def join_session_by_qrcode(
    request_data: JoinSessionRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    评委扫码绑定场次
    
    - **qr_code_token**: 二维码token
    
    需要评委权限
    
    **验证规则**：
    - token必须有效
    - token未过期
    - 用户角色必须是评委
    - 未绑定过该场次
    """
    session = await session_service.join_session_by_qrcode(
        db=db,
        qr_code_token=request_data.qr_code_token,
        current_user=current_user
    )
    
    return SessionResponse(
        id=session.id,
        name=session.name,
        date=session.date,
        position=session.position,
        round=session.round,
        status=session.status,
        scoring_template_id=session.scoring_template_id,
        settings=SessionSettingsSchema(**session.settings.model_dump()),
        statistics=SessionStatisticsSchema(**session.statistics.model_dump()),
        description=getattr(session, 'description', None),
        qr_code_url=session.qr_code_url,
        qr_code_expires_at=session.qr_code_expires_at,
        created_by=session.created_by,
        created_at=session.created_at,
        updated_at=session.updated_at
    )
