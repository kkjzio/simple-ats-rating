"""
MongoDB连接管理
使用Motor异步驱动
"""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    """MongoDB连接管理类"""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect_db(cls) -> None:
        """
        连接到MongoDB数据库
        """
        try:
            has_auth = bool(settings.mongodb_username and settings.mongodb_password)
            
            if has_auth:
                logger.info(f"正在连接到MongoDB: {settings.mongodb_url}（用户: {settings.mongodb_username}）")
            else:
                logger.info(f"正在连接到MongoDB: {settings.mongodb_url}（无认证）")
            
            client_kwargs = dict(
                maxPoolSize=settings.mongodb_max_pool_size,
                minPoolSize=settings.mongodb_min_pool_size,
                serverSelectionTimeoutMS=5000,  # 5秒超时
            )
            
            if has_auth:
                client_kwargs["username"] = settings.mongodb_username
                client_kwargs["password"] = settings.mongodb_password
            
            cls.client = AsyncIOMotorClient(
                settings.mongodb_url,
                **client_kwargs,
            )
            
            cls.db = cls.client[settings.mongodb_db_name]
            
            # 测试连接
            await cls.client.admin.command('ping')
            
            logger.info(f"成功连接到MongoDB数据库: {settings.mongodb_db_name}")
            
        except Exception as e:
            logger.error(f"连接MongoDB失败: {str(e)}")
            raise
    
    @classmethod
    async def close_db(cls) -> None:
        """
        关闭MongoDB连接
        """
        if cls.client:
            logger.info("正在关闭MongoDB连接...")
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB连接已关闭")
    
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """
        获取数据库实例
        
        Returns:
            AsyncIOMotorDatabase: 数据库实例
        """
        if cls.db is None:
            raise RuntimeError("数据库未连接，请先调用 connect_db()")
        return cls.db


# 便捷函数
async def get_database() -> AsyncIOMotorDatabase:
    """
    获取数据库实例的依赖注入函数
    
    Returns:
        AsyncIOMotorDatabase: 数据库实例
    """
    return MongoDB.get_db()
