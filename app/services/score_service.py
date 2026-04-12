"""
评分服务
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import math

from app.models.user import User, UserRole
from app.models.score import Score, ScoreStatus, DimensionScore, TextFeedback
from app.models.candidate import Candidate
from app.models.session import Session, SessionStatus
from app.models.template import ScoringTemplate
from app.models.session_interviewer import SessionInterviewer
from app.models.operation_log import ActionType, ResourceType
from app.schemas.score import (
    ScoreDraft, 
    AdminModifyScoreRequest,
    DimensionScoreSchema,
    TextFeedbackSchema
)
from app.core.exceptions import (
    NotFoundError, 
    ValidationError, 
    PermissionDeniedError,
    BusinessError
)
from app.services.log_service import create_log


class ScoreService:
    """评分服务类"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    def _ensure_session_active(self, session_status: str) -> None:
        if session_status != SessionStatus.ACTIVE.value:
            raise BusinessError(message="仅进行中的场次允许评分")

    async def get_my_candidates(
        self,
        session_id: str,
        current_user: User,
        status_filter: str = "all"
    ) -> Dict[str, Any]:
        """
        获取评委待评候选人列表
        
        Args:
            session_id: 场次ID
            current_user: 当前用户
            status_filter: 状态过滤（all/pending/completed）
            
        Returns:
            包含场次信息、模板、候选人列表和进度的字典
        """
        # 验证场次是否存在
        session_data = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session_data:
            raise NotFoundError(message="场次不存在")
        
        session = Session.from_mongo(session_data)
        
        # 验证评委是否绑定该场次
        interviewer_rel = await self.db.session_interviewers.find_one({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(current_user.id)
        })
        
        if not interviewer_rel:
            raise PermissionDeniedError(message="您未被分配到该场次")
        
        # 获取评分模板
        template_data = await self.db.scoring_templates.find_one({
            "_id": ObjectId(session.scoring_template_id)
        })
        if not template_data:
            raise NotFoundError(message="评分模板不存在")
        
        template = ScoringTemplate.from_mongo(template_data)
        
        # 获取候选人列表
        candidates_cursor = self.db.candidates.find({
            "session_id": ObjectId(session_id)
        }).sort("order", 1)
        
        candidates_data = await candidates_cursor.to_list(length=None)
        
        # 获取该评委对这些候选人的评分记录
        candidate_ids = [c["_id"] for c in candidates_data]
        scores_cursor = self.db.scores.find({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(current_user.id),
            "candidate_id": {"$in": candidate_ids}
        })
        scores_data = await scores_cursor.to_list(length=None)
        
        # 创建候选人ID到评分的映射
        score_map = {str(s["candidate_id"]): s for s in scores_data}
        
        # 构建候选人列表（带评分状态）
        candidates_with_status = []
        completed_count = 0
        
        for candidate_data in candidates_data:
            candidate = Candidate.from_mongo(candidate_data)
            candidate_id = candidate.id
            
            # 获取用户信息
            user_data = await self.db.users.find_one({"_id": ObjectId(candidate.user_id)})
            user_name = user_data.get("profile", {}).get("name", "未知") if user_data else "未知"
            
            # 检查是否已评分
            score_data = score_map.get(candidate_id)
            
            if score_data and score_data.get("status") in [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]:
                score_status = "completed"
                completed_count += 1
                score_id = str(score_data["_id"])
                total_score = score_data.get("total_score", 0)
            elif score_data and score_data.get("status") == ScoreStatus.DRAFT.value:
                score_status = "draft"
                score_id = str(score_data["_id"])
                total_score = score_data.get("total_score", 0)
            else:
                score_status = "pending"
                score_id = None
                total_score = None
            
            # 根据状态过滤
            if status_filter == "pending" and score_status != "pending":
                continue
            elif status_filter == "completed" and score_status != "completed":
                continue
            
            candidates_with_status.append({
                "candidate_id": candidate_id,
                "user_id": candidate.user_id,
                "name": user_name,
                "order": candidate.order,
                "status": candidate.status.value,
                "score_status": score_status,
                "score_id": score_id,
                "total_score": total_score
            })
        
        # 计算进度
        total_candidates = len(candidates_data)
        pending_count = total_candidates - completed_count
        completion_rate = (completed_count / total_candidates * 100) if total_candidates > 0 else 0
        
        return {
            "session": {
                "session_id": session.id,
                "name": session.name,
                "position": session.position,
                "date": session.date.isoformat()
            },
            "template": template.dict(by_alias=True),
            "candidates": candidates_with_status,
            "progress": {
                "total_candidates": total_candidates,
                "completed_count": completed_count,
                "pending_count": pending_count,
                "completion_rate": round(completion_rate, 2)
            }
        }
    
    async def get_score_detail(
        self,
        score_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        获取评分详情
        
        Args:
            score_id: 评分ID
            current_user: 当前用户
            
        Returns:
            评分详情
        """
        # 查询评分
        score_data = await self.db.scores.find_one({"_id": ObjectId(score_id)})
        if not score_data:
            raise NotFoundError(message="评分不存在")
        
        score = Score.from_mongo(score_data)
        
        # 权限验证：评委只能看自己的评分，超管可以看所有评分
        if current_user.role != UserRole.SUPER_ADMIN:
            if score.interviewer_id != current_user.id:
                raise PermissionDeniedError(message="无权查看该评分")
        
        # 获取评委信息
        interviewer_data = await self.db.users.find_one({"_id": ObjectId(score.interviewer_id)})
        interviewer_name = interviewer_data.get("profile", {}).get("name", "未知") if interviewer_data else "未知"
        
        # 获取候选人信息
        candidate_data = await self.db.candidates.find_one({"_id": ObjectId(score.candidate_id)})
        if candidate_data:
            user_data = await self.db.users.find_one({"_id": ObjectId(candidate_data["user_id"])})
            candidate_name = user_data.get("profile", {}).get("name", "未知") if user_data else "未知"
        else:
            candidate_name = "未知"
        
        return {
            "score": score.dict(by_alias=True),
            "interviewer_name": interviewer_name,
            "candidate_name": candidate_name
        }
    
    async def save_score_draft(
        self,
        session_id: str,
        candidate_id: str,
        score_data: ScoreDraft,
        current_user: User
    ) -> Dict[str, Any]:
        """
        保存评分草稿
        
        Args:
            session_id: 场次ID
            candidate_id: 候选人ID
            score_data: 评分数据
            current_user: 当前用户
            
        Returns:
            评分ID和总分
        """
        # 验证评委是否绑定该场次
        interviewer_rel = await self.db.session_interviewers.find_one({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(current_user.id)
        })
        
        if not interviewer_rel:
            raise PermissionDeniedError(message="您未被分配到该场次")
        
        # 验证候选人是否存在
        candidate_data = await self.db.candidates.find_one({
            "_id": ObjectId(candidate_id),
            "session_id": ObjectId(session_id)
        })
        
        if not candidate_data:
            raise NotFoundError(message="候选人不存在")
        
        # 获取评分模板
        session_data = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session_data:
            raise NotFoundError(message="场次不存在")
        self._ensure_session_active(session_data.get("status"))

        template_data = await self.db.scoring_templates.find_one({
            "_id": ObjectId(session_data["scoring_template_id"])
        })
        if not template_data:
            raise NotFoundError(message="评分模板不存在")
        
        template = ScoringTemplate.from_mongo(template_data)
        
        # 计算加权分和总分
        dimension_scores, total_score = self._calculate_weighted_score(
            score_data.dimension_scores,
            template
        )
        
        # 检查是否已存在评分记录
        existing_score = await self.db.scores.find_one({
            "session_id": ObjectId(session_id),
            "candidate_id": ObjectId(candidate_id),
            "interviewer_id": ObjectId(current_user.id)
        })
        
        now = datetime.utcnow()
        
        if existing_score:
            # 检查是否已锁定
            if existing_score.get("is_locked", False):
                raise BusinessError(message="评分已提交，无法修改")
            
            # 更新现有评分
            update_data = {
                "dimension_scores": [ds.dict() for ds in dimension_scores],
                "total_score": total_score,
                "text_feedbacks": [tf.dict() for tf in [
                    TextFeedback(**fb.dict()) for fb in score_data.text_feedbacks
                ]],
                "status": ScoreStatus.DRAFT.value,
                "updated_at": now
            }
            
            await self.db.scores.update_one(
                {"_id": existing_score["_id"]},
                {"$set": update_data}
            )
            
            score_id = str(existing_score["_id"])
        else:
            # 创建新评分
            new_score = Score(
                session_id=session_id,
                candidate_id=candidate_id,
                interviewer_id=current_user.id,
                dimension_scores=dimension_scores,
                total_score=total_score,
                text_feedbacks=[TextFeedback(**fb.dict()) for fb in score_data.text_feedbacks],
                status=ScoreStatus.DRAFT,
                is_locked=False,
                created_at=now,
                updated_at=now
            )
            
            result = await self.db.scores.insert_one(new_score.to_mongo())
            score_id = str(result.inserted_id)
        
        return {
            "score_id": score_id,
            "total_score": round(total_score, 2)
        }
    
    async def submit_score(
        self,
        score_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        提交评分
        
        Args:
            score_id: 评分ID
            current_user: 当前用户
            
        Returns:
            成功消息
        """
        # 查询评分
        score_data = await self.db.scores.find_one({"_id": ObjectId(score_id)})
        if not score_data:
            raise NotFoundError(message="评分不存在")
        
        score = Score.from_mongo(score_data)
        
        # 验证权限
        if score.interviewer_id != current_user.id:
            raise PermissionDeniedError(message="无权提交该评分")
        
        # 验证是否为草稿状态
        if score.status != ScoreStatus.DRAFT:
            raise BusinessError(message="只能提交草稿状态的评分")
        
        # 验证是否已锁定
        if score.is_locked:
            raise BusinessError(message="评分已锁定，无法提交")

        # 获取评分模板
        session_data = await self.db.sessions.find_one({"_id": ObjectId(score.session_id)})
        if not session_data:
            raise NotFoundError(message="场次不存在")
        self._ensure_session_active(session_data.get("status"))

        template_data = await self.db.scoring_templates.find_one({
            "_id": ObjectId(session_data["scoring_template_id"])
        })
        if not template_data:
            raise NotFoundError(message="评分模板不存在")
        
        template = ScoringTemplate.from_mongo(template_data)
        
        # 验证所有维度是否已打分
        scored_dimensions = {ds.dimension_name for ds in score.dimension_scores}
        template_dimensions = {d.name for d in template.dimensions}
        
        if scored_dimensions != template_dimensions:
            missing = template_dimensions - scored_dimensions
            raise ValidationError(
                message="所有维度必须打分",
                details={"missing_dimensions": list(missing)}
            )
        
        # 验证必填评语是否已填写
        required_fields = {tf.name for tf in template.text_fields if tf.required}
        filled_fields = {tf.field_name for tf in score.text_feedbacks if tf.content.strip()}
        
        if not required_fields.issubset(filled_fields):
            missing = required_fields - filled_fields
            raise ValidationError(
                message="必填评语未填写",
                details={"missing_fields": list(missing)}
            )
        
        # 验证分数范围
        for ds in score.dimension_scores:
            template_dim = next((d for d in template.dimensions if d.name == ds.dimension_name), None)
            if template_dim and ds.score > template_dim.max_score:
                raise ValidationError(
                    message=f"维度 {ds.dimension_name} 的分数不能超过 {template_dim.max_score}"
                )
        
        now = datetime.utcnow()
        
        # 更新评分状态
        await self.db.scores.update_one(
            {"_id": ObjectId(score_id)},
            {
                "$set": {
                    "status": ScoreStatus.SUBMITTED.value,
                    "is_locked": True,
                    "submitted_at": now,
                    "updated_at": now
                }
            }
        )
        
        # 更新场次统计信息
        await self._update_session_statistics(score.session_id)
        
        # 记录操作日志
        await create_log(
            self.db,
            user_id=current_user.id,
            action=ActionType.SCORE_SUBMIT,
            resource_type=ResourceType.SCORE,
            resource_id=score_id,
            details={
                "candidate_id": score.candidate_id,
                "session_id": score.session_id,
                "total_score": score.total_score,
                "action_detail": "submit_score"
            }
        )
        
        # 检测极端分
        warning = await self._check_extreme_score(
            score.session_id,
            score.candidate_id,
            score.total_score
        )
        
        return {
            "message": "评分提交成功",
            "score_id": score_id,
            "total_score": round(score.total_score, 2),
            "extreme_score_warning": warning
        }
    
    async def get_candidate_scores(
        self,
        candidate_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        获取候选人所有评分（超管）
        
        Args:
            candidate_id: 候选人ID
            current_user: 当前用户
            
        Returns:
            候选人所有评分和统计信息
        """
        # 验证超管权限
        if current_user.role != UserRole.SUPER_ADMIN:
            raise PermissionDeniedError(message="需要超级管理员权限")
        
        # 验证候选人是否存在
        candidate_data = await self.db.candidates.find_one({"_id": ObjectId(candidate_id)})
        if not candidate_data:
            raise NotFoundError(message="候选人不存在")
        
        candidate = Candidate.from_mongo(candidate_data)
        
        # 获取候选人姓名
        user_data = await self.db.users.find_one({"_id": ObjectId(candidate.user_id)})
        candidate_name = user_data.get("name", "未知") if user_data else "未知"
        
        # 获取所有已提交的评分
        scores_cursor = self.db.scores.find({
            "candidate_id": ObjectId(candidate_id),
        })
        scores_data = await scores_cursor.to_list(length=None)
        
        scores = [Score.from_mongo(s) for s in scores_data]
        effective_scores = [
            score for score in scores
            if score.status in {ScoreStatus.SUBMITTED, ScoreStatus.MODIFIED_BY_ADMIN}
        ]
        
        # 计算统计信息
        if effective_scores:
            total_scores_list = [s.total_score for s in effective_scores]
            avg_score = sum(total_scores_list) / len(total_scores_list)
            max_score = max(total_scores_list)
            min_score = min(total_scores_list)
            
            # 计算标准差
            variance = sum((x - avg_score) ** 2 for x in total_scores_list) / len(total_scores_list)
            std_dev = math.sqrt(variance)
        else:
            avg_score = 0
            max_score = 0
            min_score = 0
            std_dev = 0
        
        return {
            "candidate_id": candidate_id,
            "candidate_name": candidate_name,
            "scores": await self._build_admin_score_items(scores),
            "statistics": {
                "total_scores": len(effective_scores),
                "average_score": round(avg_score, 2),
                "max_score": round(max_score, 2),
                "min_score": round(min_score, 2),
                "std_dev": round(std_dev, 2)
            }
        }
    
    async def admin_modify_score(
        self,
        score_id: str,
        modify_data: AdminModifyScoreRequest,
        current_user: User
    ) -> Dict[str, Any]:
        """
        超管修改评分
        
        Args:
            score_id: 评分ID
            modify_data: 修改数据
            current_user: 当前用户
            
        Returns:
            修改后的评分
        """
        # 验证超管权限
        if current_user.role != UserRole.SUPER_ADMIN:
            raise PermissionDeniedError(message="需要超级管理员权限")
        
        # 查询评分
        score_data = await self.db.scores.find_one({"_id": ObjectId(score_id)})
        if not score_data:
            raise NotFoundError(message="评分不存在")
        
        score = Score.from_mongo(score_data)
        
        # 获取评分模板
        session_data = await self.db.sessions.find_one({"_id": ObjectId(score.session_id)})
        if not session_data:
            raise NotFoundError(message="场次不存在")
        
        template_data = await self.db.scoring_templates.find_one({
            "_id": ObjectId(session_data["scoring_template_id"])
        })
        if not template_data:
            raise NotFoundError(message="评分模板不存在")
        
        template = ScoringTemplate.from_mongo(template_data)
        
        # 重新计算加权分和总分
        dimension_scores, total_score = self._calculate_weighted_score(
            modify_data.dimension_scores,
            template
        )
        
        now = datetime.utcnow()
        
        # 更新评分
        update_data = {
            "dimension_scores": [ds.dict() for ds in dimension_scores],
            "total_score": total_score,
            "text_feedbacks": [tf.dict() for tf in [
                TextFeedback(**fb.dict()) for fb in modify_data.text_feedbacks
            ]],
            "status": ScoreStatus.MODIFIED_BY_ADMIN.value,
            "modify_reason": modify_data.modify_reason,
            "modified_by": current_user.id,
            "modified_at": now,
            "updated_at": now
        }
        
        await self.db.scores.update_one(
            {"_id": ObjectId(score_id)},
            {"$set": update_data}
        )
        
        await self._update_session_statistics(score.session_id)
        
        # 记录操作日志
        await create_log(
            self.db,
            user_id=current_user.id,
            action=ActionType.SCORE_ADMIN_MODIFY,
            resource_type=ResourceType.SCORE,
            resource_id=score_id,
            details={
                "candidate_id": score.candidate_id,
                "session_id": score.session_id,
                "old_total_score": score.total_score,
                "new_total_score": total_score,
                "modify_reason": modify_data.modify_reason,
                "action_detail": "admin_modify_score"
            }
        )
        
        # 获取更新后的评分
        updated_score_data = await self.db.scores.find_one({"_id": ObjectId(score_id)})
        updated_score = Score.from_mongo(updated_score_data)
        
        return {
            "message": "评分修改成功",
            "score": updated_score.dict(by_alias=True)
        }
    
    async def admin_delete_score(
        self,
        score_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        超管删除评分
        """
        if current_user.role != UserRole.SUPER_ADMIN:
            raise PermissionDeniedError(message="需要超级管理员权限")

        score_data = await self.db.scores.find_one({"_id": ObjectId(score_id)})
        if not score_data:
            raise NotFoundError(message="评分不存在")

        score = Score.from_mongo(score_data)

        await self.db.scores.delete_one({"_id": ObjectId(score_id)})

        await self._update_session_statistics(score.session_id)

        await create_log(
            self.db,
            user_id=current_user.id,
            action=ActionType.SCORE_ADMIN_DELETE,
            resource_type=ResourceType.SCORE,
            resource_id=score_id,
            details={
                "candidate_id": score.candidate_id,
                "session_id": score.session_id,
                "deleted_total_score": score.total_score,
                "score_status": score.status.value if hasattr(score.status, "value") else score.status,
                "action_detail": "admin_delete_score"
            }
        )

        return {
            "message": "评分删除成功",
            "score_id": score_id
        }

    async def _build_admin_score_items(self, scores: List[Score]) -> List[Dict[str, Any]]:
        interviewer_ids = []
        seen_ids = set()

        for score in scores:
            if score.interviewer_id not in seen_ids:
                interviewer_ids.append(ObjectId(score.interviewer_id))
                seen_ids.add(score.interviewer_id)

        users = []
        if interviewer_ids:
            users = await self.db.users.find({"_id": {"$in": interviewer_ids}}).to_list(length=None)
        user_map = {str(user["_id"]): user for user in users}

        items = []
        for score in scores:
            interviewer_data = user_map.get(score.interviewer_id) or {}
            interviewer_name = interviewer_data.get("profile", {}).get("name") or interviewer_data.get("name") or "未知"
            items.append({
                **score.dict(by_alias=True),
                "interviewer_name": interviewer_name
            })

        items.sort(
            key=lambda item: item.get("updated_at") or item.get("submitted_at") or item.get("created_at") or "",
            reverse=True
        )
        return items
    def _calculate_weighted_score(
        self,
        dimension_scores: List[DimensionScoreSchema],
        template: ScoringTemplate
    ) -> tuple[List[DimensionScore], float]:
        """
        计算加权分
        
        Args:
            dimension_scores: 维度评分列表
            template: 评分模板
            
        Returns:
            (维度评分列表, 总分)
        """
        result_scores = []
        total_score = 0.0

        # 校验模板维度权重总和
        total_weight = sum(d.weight for d in template.dimensions)
        if abs(total_weight - 100) > 0.01:
            raise ValidationError(message="权重之和必须等于100")

        # 创建模板维度映射
        template_dims = {d.name: d for d in template.dimensions}

        for ds in dimension_scores:
            template_dim = template_dims.get(ds.dimension_name)
            if not template_dim:
                raise ValidationError(
                    message=f"维度 {ds.dimension_name} 不存在于模板中"
                )
            
            # 验证分数范围
            if ds.score < 0:
                raise ValidationError(
                    message=f"维度 {ds.dimension_name} 的分数不能小于0"
                )
            
            if ds.score > template_dim.max_score:
                raise ValidationError(
                    message=f"维度 {ds.dimension_name} 的分数不能超过 {template_dim.max_score}"
                )
            
            # 计算加权分
            weighted_score = (ds.score / template_dim.max_score) * template_dim.weight
            
            result_scores.append(DimensionScore(
                dimension_name=ds.dimension_name,
                score=ds.score,
                weight=template_dim.weight,
                weighted_score=weighted_score
            ))
            
            total_score += weighted_score
        
        return result_scores, total_score
    
    async def _update_session_statistics(self, session_id: str) -> None:
        """
        更新场次统计信息
        
        Args:
            session_id: 场次ID
        """
        # 统计已完成评分数
        completed_count = await self.db.scores.count_documents({
            "session_id": ObjectId(session_id),
            "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
        })
        
        # 计算平均分
        pipeline = [
            {
                "$match": {
                    "session_id": ObjectId(session_id),
                    "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average_score": {"$avg": "$total_score"}
                }
            }
        ]
        
        result = await self.db.scores.aggregate(pipeline).to_list(length=1)
        average_score = result[0]["average_score"] if result else 0.0
        
        # 更新场次统计
        await self.db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {
                "$set": {
                    "statistics.completed_scores": completed_count,
                    "statistics.average_score": round(average_score, 2),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def _check_extreme_score(
        self,
        session_id: str,
        candidate_id: str,
        total_score: float
    ) -> Dict[str, Any]:
        """
        检测极端分
        
        Args:
            session_id: 场次ID
            candidate_id: 候选人ID
            total_score: 总分
            
        Returns:
            极端分预警信息
        """
        # 获取场次的极端分预警阈值
        session_data = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session_data:
            return {"is_extreme": False}
        
        threshold = session_data.get("settings", {}).get("extreme_score_threshold", 30.0)
        
        # 获取该候选人的其他评分
        scores_cursor = self.db.scores.find({
            "session_id": ObjectId(session_id),
            "candidate_id": ObjectId(candidate_id),
            "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
        })
        scores_data = await scores_cursor.to_list(length=None)
        
        # 需要至少2个评分才能判断极端分
        if len(scores_data) < 2:
            return {"is_extreme": False}
        
        # 计算其他评分的平均值
        other_scores = [s["total_score"] for s in scores_data]
        avg_score = sum(other_scores) / len(other_scores)
        
        # 计算偏差百分比
        if avg_score > 0:
            deviation = abs(total_score - avg_score) / avg_score * 100
        else:
            deviation = 0
        
        # 判断是否为极端分
        is_extreme = deviation > threshold
        
        if is_extreme:
            return {
                "is_extreme": True,
                "deviation": round(deviation, 2),
                "threshold": threshold,
                "message": f"该评分与其他评委的平均分偏差 {round(deviation, 2)}%，超过阈值 {threshold}%，请确认评分是否准确"
            }
        else:
            return {
                "is_extreme": False,
                "deviation": round(deviation, 2),
                "threshold": threshold,
                "message": None
            }


    async def get_my_sessions(
        self,
        current_user: User
    ) -> Dict[str, Any]:
        """
        获取评委绑定的所有场次列表
        
        Args:
            current_user: 当前用户
            
        Returns:
            场次列表，包含评分进度
        """
        # 查询该评委绑定的所有场次
        interviewer_rels = await self.db.session_interviewers.find({
            "interviewer_id": ObjectId(current_user.id)
        }).to_list(length=None)
        
        if not interviewer_rels:
            return {"sessions": []}
        
        session_ids = [rel["session_id"] for rel in interviewer_rels]
        
        # 查询场次详情
        sessions_cursor = self.db.sessions.find({
            "_id": {"$in": session_ids}
        }).sort("date", -1)
        
        sessions_data = await sessions_cursor.to_list(length=None)
        
        result_sessions = []
        
        for session_data in sessions_data:
            session = Session.from_mongo(session_data)
            
            # 查询该场次的候选人总数
            total_candidates = await self.db.candidates.count_documents({
                "session_id": ObjectId(session.id)
            })
            
            # 查询该评委在该场次的已完成评分数
            completed_count = await self.db.scores.count_documents({
                "session_id": ObjectId(session.id),
                "interviewer_id": ObjectId(current_user.id),
                "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
            })
            
            pending_count = total_candidates - completed_count
            completion_rate = (completed_count / total_candidates * 100) if total_candidates > 0 else 0
            
            result_sessions.append({
                "session_id": session.id,
                "name": session.name,
                "position": session.position,
                "date": session.date.isoformat(),
                "status": session.status.value,
                "progress": {
                    "total_candidates": total_candidates,
                    "completed_count": completed_count,
                    "pending_count": pending_count,
                    "completion_rate": round(completion_rate, 2)
                }
            })
        
        return {"sessions": result_sessions}
    
    async def get_my_score_for_candidate(
        self,
        session_id: str,
        candidate_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        通过场次ID和候选人ID查询当前评委的评分记录
        
        Args:
            session_id: 场次ID
            candidate_id: 候选人ID
            current_user: 当前用户
            
        Returns:
            评分详情（ScoreResponse 格式）
            
        Raises:
            NotFoundError: 未找到评分记录
        """
        # 验证候选人是否存在且属于该场次
        candidate_data = await self.db.candidates.find_one({
            "_id": ObjectId(candidate_id),
            "session_id": ObjectId(session_id)
        })
        if not candidate_data:
            raise NotFoundError(message="候选人不存在或不属于该场次")
        
        candidate = Candidate.from_mongo(candidate_data)
        
        # 查询该评委在该场次对该候选人的评分
        score_data = await self.db.scores.find_one({
            "session_id": ObjectId(session_id),
            "candidate_id": ObjectId(candidate_id),
            "interviewer_id": ObjectId(current_user.id)
        })
        
        if not score_data:
            raise NotFoundError(message="未找到评分记录")
        
        score = Score.from_mongo(score_data)
        
        # 获取评分模板以补充 max_score 字段
        session_data = await self.db.sessions.find_one({"_id": ObjectId(score.session_id)})
        if session_data:
            template_data = await self.db.scoring_templates.find_one({
                "_id": ObjectId(session_data["scoring_template_id"])
            })
            if template_data:
                template = ScoringTemplate.from_mongo(template_data)
                # 创建维度映射
                template_dims = {d.name: d for d in template.dimensions}
            else:
                template_dims = {}
        else:
            template_dims = {}
        
        # 转换为字典并补充 max_score
        score_dict = score.dict(by_alias=True)
        
        # 为每个维度评分添加 max_score 字段
        for dim_score in score_dict.get('dimension_scores', []):
            dim_name = dim_score.get('dimension_name')
            template_dim = template_dims.get(dim_name)
            dim_score['max_score'] = template_dim.max_score if template_dim else 10.0
        
        # 转换枚举值为字符串
        if 'status' in score_dict and hasattr(score_dict['status'], 'value'):
            score_dict['status'] = score_dict['status'].value
        
        # 转换时间格式为 ISO 字符串
        for time_field in ['created_at', 'updated_at', 'submitted_at', 'modified_at']:
            if time_field in score_dict and score_dict[time_field]:
                if isinstance(score_dict[time_field], datetime):
                    score_dict[time_field] = score_dict[time_field].isoformat()
        
        return score_dict
    
    async def get_my_score_history(
        self,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        session_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        获取当前评委的评分历史
        
        Args:
            current_user: 当前用户
            page: 页码
            page_size: 每页大小
            session_id: 场次ID过滤（可选）
            date_from: 开始日期（可选）
            date_to: 结束日期（可选）
            
        Returns:
            分页的评分历史列表
        """
        # 构建查询条件
        query = {
            "interviewer_id": ObjectId(current_user.id),
            "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
        }
        
        if session_id:
            query["session_id"] = ObjectId(session_id)
        
        if date_from or date_to:
            query["submitted_at"] = {}
            if date_from:
                query["submitted_at"]["$gte"] = date_from
            if date_to:
                query["submitted_at"]["$lte"] = date_to
        
        # 查询总数
        total = await self.db.scores.count_documents(query)
        
        # 分页查询
        skip = (page - 1) * page_size
        scores_cursor = self.db.scores.find(query).sort("submitted_at", -1).skip(skip).limit(page_size)
        scores_data = await scores_cursor.to_list(length=None)
        
        # 构建结果列表
        items = []
        for score_data in scores_data:
            score = Score.from_mongo(score_data)
            
            # 获取场次信息
            session_data = await self.db.sessions.find_one({"_id": ObjectId(score.session_id)})
            session_name = session_data.get("profile", {}).get("name", "未知") if session_data else "未知"
            
            # 获取候选人信息
            candidate_data = await self.db.candidates.find_one({"_id": ObjectId(score.candidate_id)})
            if candidate_data:
                user_data = await self.db.users.find_one({"_id": ObjectId(candidate_data["user_id"])})
                candidate_name = user_data.get("profile", {}).get("name", "未知") if user_data else "未知"
            else:
                candidate_name = "未知"
            
            items.append({
                "score_id": score.id,
                "session_id": score.session_id,
                "session_name": session_name,
                "candidate_id": score.candidate_id,
                "candidate_name": candidate_name,
                "total_score": round(score.total_score, 2),
                "status": score.status.value,
                "submitted_at": score.submitted_at.isoformat() if score.submitted_at else None
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size
        }
    
    async def get_session_stats(
        self,
        session_id: str,
        current_user: User
    ) -> Dict[str, Any]:
        """
        获取场次统计数据（评委视角）
        
        Args:
            session_id: 场次ID
            current_user: 当前用户
            
        Returns:
            场次统计数据
        """
        # 验证场次是否存在
        session_data = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session_data:
            raise NotFoundError(message="场次不存在")
        
        session = Session.from_mongo(session_data)
        
        # 验证评委是否绑定该场次
        interviewer_rel = await self.db.session_interviewers.find_one({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(current_user.id)
        })
        
        if not interviewer_rel:
            raise PermissionDeniedError(message="您未被分配到该场次")
        
        # 整体统计
        overall_stats = {
            "total_candidates": session.statistics.total_candidates,
            "total_interviewers": session.statistics.total_interviewers,
            "completed_scores": session.statistics.completed_scores,
            "average_score": session.statistics.average_score
        }
        
        # 个人统计
        # 查询该场次的候选人总数
        total_candidates = await self.db.candidates.count_documents({
            "session_id": ObjectId(session_id)
        })
        
        # 查询该评委的已完成评分数
        completed_count = await self.db.scores.count_documents({
            "session_id": ObjectId(session_id),
            "interviewer_id": ObjectId(current_user.id),
            "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
        })
        
        # 计算该评委的平均分
        pipeline = [
            {
                "$match": {
                    "session_id": ObjectId(session_id),
                    "interviewer_id": ObjectId(current_user.id),
                    "status": {"$in": [ScoreStatus.SUBMITTED.value, ScoreStatus.MODIFIED_BY_ADMIN.value]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average_score": {"$avg": "$total_score"}
                }
            }
        ]
        
        result = await self.db.scores.aggregate(pipeline).to_list(length=1)
        my_average_score = result[0]["average_score"] if result else 0.0
        
        pending_count = total_candidates - completed_count
        completion_rate = (completed_count / total_candidates * 100) if total_candidates > 0 else 0
        
        my_stats = {
            "completed_count": completed_count,
            "pending_count": pending_count,
            "my_average_score": round(my_average_score, 2),
            "completion_rate": round(completion_rate, 2)
        }
        
        return {
            "session_info": {
                "session_id": session.id,
                "name": session.name,
                "position": session.position,
                "date": session.date.isoformat()
            },
            "overall_stats": overall_stats,
            "my_stats": my_stats
        }


async def get_score_service(db: AsyncIOMotorDatabase) -> ScoreService:
    """
    获取评分服务实例
    
    Args:
        db: 数据库实例
        
    Returns:
        ScoreService: 评分服务实例
    """
    return ScoreService(db)
