"""
导出服务
"""
import asyncio
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Literal
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.utils.excel_utils import (
    export_candidate_scores,
    export_interviewer_stats,
    build_stats_scores_excel,
    build_session_scores_detail_excel,
)
from app.schemas.export import ExportTaskStatus


class ExportService:
    """导出服务类"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def create_export_task(
        self,
        session_id: str,
        export_type: Literal["candidate_scores", "interviewer_stats"],
        options: dict,
        current_user
    ) -> dict:
        """
        创建导出任务
        
        Args:
            session_id: 场次ID
            export_type: 导出类型
            options: 导出选项
            current_user: 当前用户（User对象）
            
        Returns:
            任务信息
        """
        # 验证场次存在
        try:
            session_oid = ObjectId(session_id)
        except Exception:
            raise ValueError("无效的场次ID")
        
        session = await self.db.sessions.find_one({"_id": session_oid})
        if not session:
            raise ValueError("场次不存在")
        
        # 生成任务ID
        task_id = str(uuid.uuid4())
        
        # 创建任务记录
        task = {
            "_id": task_id,
            "session_id": session_id,
            "export_type": export_type,
            "status": ExportTaskStatus.PROCESSING,
            "options": options,
            "file_path": None,
            "download_url": None,
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "completed_at": None,
            "expires_at": None,
            "error_message": None
        }
        
        await self.db.export_tasks.insert_one(task)
        
        # 异步执行导出任务
        asyncio.create_task(
            self._execute_export_task(task_id, session_id, export_type, options)
        )
        
        return task
    
    async def _execute_export_task(
        self,
        task_id: str,
        session_id: str,
        export_type: str,
        options: dict
    ):
        """
        执行导出任务（后台执行）
        
        Args:
            task_id: 任务ID
            session_id: 场次ID
            export_type: 导出类型
            options: 导出选项
        """
        try:
            # 根据类型执行导出
            if export_type == "candidate_scores":
                include_feedbacks = options.get("include_feedbacks", True)
                file_path = await export_candidate_scores(
                    self.db,
                    session_id,
                    include_feedbacks
                )
            elif export_type == "interviewer_stats":
                file_path = await export_interviewer_stats(
                    self.db,
                    session_id
                )
            else:
                raise ValueError(f"不支持的导出类型: {export_type}")
            
            # 生成下载链接
            download_url = f"/api/v1/exports/{task_id}/download"
            
            # 更新任务状态为完成
            await self.db.export_tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "status": ExportTaskStatus.COMPLETED,
                        "file_path": file_path,
                        "download_url": download_url,
                        "completed_at": datetime.utcnow(),
                        "expires_at": datetime.utcnow() + timedelta(hours=24)
                    }
                }
            )
        except Exception as e:
            # 更新任务状态为失败
            await self.db.export_tasks.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "status": ExportTaskStatus.FAILED,
                        "error_message": str(e),
                        "completed_at": datetime.utcnow()
                    }
                }
            )
    
    async def export_stats_scores(self, session_ids: list[str]) -> str:
        """导出统计总览评分（多场次）"""
        session_oids = []
        for session_id in session_ids:
            try:
                session_oids.append(ObjectId(session_id))
            except Exception:
                continue

        sessions = await self.db.sessions.find({"_id": {"$in": session_oids}}).to_list(None)
        session_map = {str(item["_id"]): item for item in sessions}

        scores = await self.db.scores.find({"session_id": {"$in": session_oids}}).to_list(None)

        # 收集候选人和评委的 ObjectId（去重）
        candidate_oids = list({score["candidate_id"] for score in scores if score.get("candidate_id")})
        interviewer_oids = list({score["interviewer_id"] for score in scores if score.get("interviewer_id")})

        # 获取候选人记录，建立 candidate_id -> user_id 映射
        candidates = await self.db.candidates.find({"_id": {"$in": candidate_oids}}).to_list(None)
        candidate_user_id_map = {str(c["_id"]): str(c["user_id"]) for c in candidates}

        # 获取候选人对应的用户信息（姓名、手机号在 users.profile 中）
        candidate_user_oids = [ObjectId(uid) for uid in candidate_user_id_map.values() if uid]
        candidate_users = await self.db.users.find({"_id": {"$in": candidate_user_oids}}).to_list(None)
        candidate_user_map = {str(u["_id"]): u for u in candidate_users}

        # 获取评委用户信息
        interviewers = await self.db.users.find({"_id": {"$in": interviewer_oids}}).to_list(None)
        interviewer_map = {str(u["_id"]): u for u in interviewers}

        rows = []
        for score in scores:
            session_id = str(score.get("session_id", ""))
            candidate_id = str(score.get("candidate_id", ""))
            interviewer_id = str(score.get("interviewer_id", ""))

            # 通过 candidate_id -> user_id -> user 获取候选人姓名和手机
            candidate_user_id = candidate_user_id_map.get(candidate_id, "")
            candidate_user = candidate_user_map.get(candidate_user_id, {})
            candidate_name = candidate_user.get("profile", {}).get("name", "") if candidate_user else ""
            candidate_phone = candidate_user.get("profile", {}).get("phone", "") if candidate_user else ""

            # 评委姓名存储在 users.profile.name
            interviewer = interviewer_map.get(interviewer_id, {})
            interviewer_name = interviewer.get("profile", {}).get("name", "") if interviewer else ""

            rows.append({
                "session_name": session_map.get(session_id, {}).get("name", ""),
                "candidate_name": candidate_name,
                "candidate_phone": candidate_phone,
                "interviewer_name": interviewer_name,
                "total_score": score.get("total_score"),
                "score_status": score.get("status"),
                "submitted_at": score.get("submitted_at"),
                "created_at": score.get("created_at"),
                "updated_at": score.get("updated_at"),
            })

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join("uploads", "exports", f"stats_scores_{timestamp}.xlsx")
        return build_stats_scores_excel(rows, output_path)

    async def export_session_scores_detail(self, session_id: str) -> str:
        """导出单场次统计详情（固定列+动态列）"""
        session = await self.db.sessions.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise ValueError("场次不存在")

        session_name = session.get("name", "")

        template_id = session.get("scoring_template_id")
        template = None
        if template_id:
            try:
                template = await self.db.scoring_templates.find_one({"_id": ObjectId(str(template_id))})
            except Exception:
                pass
        dynamic_columns = [item.get("name") for item in (template or {}).get("text_fields", []) if item.get("name")]

        scores = await self.db.scores.find({"session_id": ObjectId(session_id)}).to_list(None)

        # 提取维度列名（取第一条有效 score 的 dimension_scores 顺序，同场次模板统一）
        dimension_columns = []
        for score in scores:
            ds = score.get("dimension_scores", [])
            if ds:
                dimension_columns = [item.get("dimension_name") for item in ds if item.get("dimension_name")]
                break

        # 收集候选人和评委的 ObjectId（去重）
        candidate_oids = list({score["candidate_id"] for score in scores if score.get("candidate_id")})
        interviewer_oids = list({score["interviewer_id"] for score in scores if score.get("interviewer_id")})

        # 获取候选人记录，建立 candidate_id -> user_id 映射
        candidates = await self.db.candidates.find({"_id": {"$in": candidate_oids}}).to_list(None)
        candidate_user_id_map = {str(c["_id"]): str(c["user_id"]) for c in candidates}

        # 获取候选人用户信息（姓名、手机号在 users.profile 中）
        candidate_user_oids = [ObjectId(uid) for uid in candidate_user_id_map.values() if uid]
        candidate_users = await self.db.users.find({"_id": {"$in": candidate_user_oids}}).to_list(None)
        candidate_user_map = {str(u["_id"]): u for u in candidate_users}

        # 获取评委用户信息
        interviewers = await self.db.users.find({"_id": {"$in": interviewer_oids}}).to_list(None)
        interviewer_map = {str(u["_id"]): u for u in interviewers}

        rows = []
        for score in scores:
            candidate_id = str(score.get("candidate_id", ""))
            interviewer_id = str(score.get("interviewer_id", ""))

            candidate_user_id = candidate_user_id_map.get(candidate_id, "")
            candidate_user = candidate_user_map.get(candidate_user_id, {})
            candidate_name = candidate_user.get("profile", {}).get("name", "") if candidate_user else ""
            candidate_phone = candidate_user.get("profile", {}).get("phone", "") if candidate_user else ""

            interviewer = interviewer_map.get(interviewer_id, {})
            interviewer_name = interviewer.get("profile", {}).get("name", "") if interviewer else ""

            row = {
                "场次名称": session_name,
                "候选人姓名": candidate_name,
                "候选人手机号": candidate_phone,
                "评委姓名": interviewer_name,
                "总分": score.get("total_score"),
                "提交时间": score.get("submitted_at"),
                "创建时间": score.get("created_at"),
                "更新时间": score.get("updated_at"),
            }

            # 插入维度加权得分
            dim_score_map = {
                item.get("dimension_name"): item.get("weighted_score")
                for item in score.get("dimension_scores", [])
                if item.get("dimension_name")
            }
            for col in dimension_columns:
                row[col] = dim_score_map.get(col)

            feedback_map = {
                item.get("field_name"): item.get("content")
                for item in score.get("text_feedbacks", [])
                if item.get("field_name")
            }
            for col in dynamic_columns:
                row[col] = feedback_map.get(col)

            rows.append(row)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join("uploads", "exports", f"session_scores_detail_{session_id}_{timestamp}.xlsx")
        return build_session_scores_detail_excel(rows, dynamic_columns, output_path, dimension_columns=dimension_columns)

    async def get_export_task_status(self, task_id: str) -> Optional[dict]:
        """
        获取导出任务状态
        
        Args:
            task_id: 任务ID
            
        Returns:
            任务信息
        """
        task = await self.db.export_tasks.find_one({"_id": task_id})
        return task
    
    async def get_export_history(
        self,
        current_user,
        page: int = 1,
        page_size: int = 20
    ) -> dict:
        """
        获取导出历史
        
        Args:
            current_user: 当前用户（User对象）
            page: 页码
            page_size: 每页数量
            
        Returns:
            分页的导出任务列表
        """
        # 构建查询条件
        query = {}
        
        # 如果不是超管，只能查看自己的导出任务
        if current_user.role.value != "super_admin":
            query["created_by"] = str(current_user.id)
        
        # 查询总数
        total = await self.db.export_tasks.count_documents(query)
        
        # 查询列表
        skip = (page - 1) * page_size
        tasks = await self.db.export_tasks.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(page_size)\
            .to_list(None)
        
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": tasks
        }
    
    async def get_export_file_path(self, task_id: str) -> Optional[str]:
        """
        获取导出文件路径
        
        Args:
            task_id: 任务ID
            
        Returns:
            文件路径
        """
        task = await self.db.export_tasks.find_one({"_id": task_id})
        if not task:
            return None
        
        # 检查任务状态
        if task["status"] != ExportTaskStatus.COMPLETED:
            return None
        
        # 检查是否过期
        if task.get("expires_at") and task["expires_at"] < datetime.utcnow():
            return None
        
        return task.get("file_path")
    
    async def cleanup_expired_tasks(self):
        """清理过期的导出任务"""
        import os
        
        # 查找过期任务
        expired_tasks = await self.db.export_tasks.find({
            "expires_at": {"$lt": datetime.utcnow()},
            "status": ExportTaskStatus.COMPLETED
        }).to_list(None)
        
        # 删除文件和任务记录
        for task in expired_tasks:
            # 删除文件
            if task.get("file_path") and os.path.exists(task["file_path"]):
                try:
                    os.remove(task["file_path"])
                except Exception:
                    pass
            
            # 删除任务记录
            await self.db.export_tasks.delete_one({"_id": task["_id"]})
