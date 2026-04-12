"""
API v1 路由汇总
"""

from fastapi import APIRouter
from app.api.v1 import auth, users, logs, templates, sessions, candidates, scores, statistics, exports, interviewer

# 创建v1路由器
api_router = APIRouter()

# 注册子路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户管理"])
api_router.include_router(logs.router, prefix="/logs", tags=["操作日志"])
api_router.include_router(templates.router, prefix="/templates", tags=["评分模板"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["场次管理"])
api_router.include_router(candidates.router, tags=["候选人管理"])
api_router.include_router(scores.router)  # 使用文件中定义的tags
api_router.include_router(interviewer.router)  # 使用文件中定义的tags（interviewer）
api_router.include_router(statistics.router, tags=["统计分析"])
api_router.include_router(exports.router, tags=["数据导出"])
