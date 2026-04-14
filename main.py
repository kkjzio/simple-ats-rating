"""
ATS Rating System - 简历评分系统
FastAPI主应用入口
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.mongodb import MongoDB
from app.db.init_db import init_database
from app.middleware.logging import RequestLoggingMiddleware

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    启动时连接数据库，关闭时断开连接
    """
    # 启动时执行
    logger.info("=" * 60)
    logger.info(f"启动 {settings.app_name} v{settings.app_version}")
    logger.info("=" * 60)
    
    try:
        # 连接数据库
        await MongoDB.connect_db()
        
        # 初始化数据库（创建索引和默认数据）
        db = MongoDB.get_db()
        await init_database(db)
        
        logger.info("应用启动成功！")
        logger.info(f"API文档地址: http://localhost:8000/docs")
        logger.info(f"健康检查地址: http://localhost:8000/health")
        
    except Exception as e:
        logger.error(f"应用启动失败: {str(e)}")
        raise
    
    yield
    
    # 关闭时执行
    logger.info("正在关闭应用...")
    await MongoDB.close_db()
    logger.info("应用已关闭")


# 创建FastAPI应用实例
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="ATS简历评分系统 - 支持多评委匿名评分的面试管理系统",
    docs_url="/docs" if settings.enable_docs else None,
    redoc_url="/redoc" if settings.enable_docs else None,
    openapi_url="/openapi.json" if settings.enable_docs else None,
    lifespan=lifespan
)


# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)


# 添加请求日志中间件
app.add_middleware(RequestLoggingMiddleware)


# 全局异常处理器
from app.core.exceptions import (
    BaseAPIException,
    AuthenticationError,
    PermissionDeniedError,
    ResourceNotFoundError,
    ValidationError,
    DuplicateResourceError,
    BusinessLogicError
)
from fastapi import HTTPException


@app.exception_handler(BaseAPIException)
async def base_api_exception_handler(request: Request, exc: BaseAPIException):
    """
    处理自定义API异常
    
    Args:
        request: 请求对象
        exc: 异常对象
        
    Returns:
        JSONResponse: 错误响应
    """
    logger.warning(f"API异常 [{exc.code}]: {exc.message}", exc_info=False)
    
    return JSONResponse(
        status_code=exc.code,
        content={
            "success": False,
            "message": exc.message,
            "error_type": exc.error_type,
            "details": exc.details
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    处理FastAPI HTTPException
    
    Args:
        request: 请求对象
        exc: 异常对象
        
    Returns:
        JSONResponse: 错误响应
    """
    logger.warning(f"HTTP异常 [{exc.status_code}]: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_type": "HTTPException"
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    全局异常处理 - 捕获所有未处理的异常
    
    Args:
        request: 请求对象
        exc: 异常对象
        
    Returns:
        JSONResponse: 错误响应
    """
    logger.error(f"未处理的异常: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "服务器内部错误",
            "error_type": "InternalServerError",
            "error": str(exc) if settings.debug else "Internal Server Error"
        }
    )


# 健康检查接口
@app.get("/health", tags=["系统"])
async def health_check():
    """
    健康检查接口
    
    Returns:
        dict: 健康状态信息
    """
    try:
        # 检查数据库连接
        db = MongoDB.get_db()
        await db.command('ping')
        db_status = "connected"
    except Exception as e:
        logger.error(f"数据库连接检查失败: {str(e)}")
        db_status = "disconnected"
    
    return {
        "success": True,
        "message": "服务运行正常",
        "data": {
            "app_name": settings.app_name,
            "version": settings.app_version,
            "database": db_status,
            "debug": settings.debug
        }
    }


# 根路径
@app.get("/", tags=["系统"])
async def root():
    """
    根路径
    
    Returns:
        dict: 欢迎信息
    """
    return {
        "success": True,
        "message": f"欢迎使用 {settings.app_name}",
        "data": {
            "version": settings.app_version,
            "docs": "/docs",
            "health": "/health"
        }
    }


# 挂载静态文件服务（简历等上传文件）
from fastapi.staticfiles import StaticFiles
import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 导入并注册路由
from app.api.v1 import api_router

app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
