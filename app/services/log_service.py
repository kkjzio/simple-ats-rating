"""
日志服务
处理操作日志的创建和查询
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.models.operation_log import OperationLog, ActionType, ResourceType


async def create_log(
    db: AsyncIOMotorDatabase,
    user_id: str,
    action: ActionType,
    resource_type: ResourceType,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    创建操作日志
    
    Args:
        db: 数据库实例
        user_id: 操作人ID
        action: 操作类型
        resource_type: 资源类型
        resource_id: 资源ID
        details: 详细信息
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        str: 日志ID
    """
    log = OperationLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=datetime.utcnow()
    )
    
    result = await db.operation_logs.insert_one(log.to_mongo())
    return str(result.inserted_id)


async def get_logs(
    db: AsyncIOMotorDatabase,
    page: int = 1,
    page_size: int = 20,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> tuple[List[OperationLog], int]:
    """
    获取操作日志列表（分页、筛选）
    
    Args:
        db: 数据库实例
        page: 页码
        page_size: 每页数量
        user_id: 操作人ID（筛选）
        action: 操作类型（筛选）
        resource_type: 资源类型（筛选）
        date_from: 开始日期（筛选）
        date_to: 结束日期（筛选）
        
    Returns:
        tuple[List[OperationLog], int]: (日志列表, 总数)
    """
    # 构建查询条件
    query = {}
    
    if user_id:
        query["user_id"] = ObjectId(user_id)
    
    if action:
        query["action"] = action
    
    if resource_type:
        query["resource_type"] = resource_type
    
    # 日期范围筛选
    if date_from or date_to:
        date_query = {}
        if date_from:
            # 从当天00:00:00开始
            date_query["$gte"] = datetime.combine(date_from, datetime.min.time())
        if date_to:
            # 到当天23:59:59结束
            date_query["$lte"] = datetime.combine(date_to, datetime.max.time())
        query["created_at"] = date_query
    
    # 计算总数
    total = await db.operation_logs.count_documents(query)
    
    # 分页查询
    skip = (page - 1) * page_size
    cursor = db.operation_logs.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    
    logs = []
    async for log_data in cursor:
        logs.append(OperationLog.from_mongo(log_data))
    
    return logs, total


async def get_user_recent_logs(
    db: AsyncIOMotorDatabase,
    user_id: str,
    limit: int = 10
) -> List[OperationLog]:
    """
    获取用户最近的操作日志
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        limit: 返回数量
        
    Returns:
        List[OperationLog]: 日志列表
    """
    cursor = db.operation_logs.find(
        {"user_id": ObjectId(user_id)}
    ).sort("created_at", -1).limit(limit)
    
    logs = []
    async for log_data in cursor:
        logs.append(OperationLog.from_mongo(log_data))
    
    return logs


async def get_resource_logs(
    db: AsyncIOMotorDatabase,
    resource_type: ResourceType,
    resource_id: str,
    limit: int = 50
) -> List[OperationLog]:
    """
    获取特定资源的操作日志
    
    Args:
        db: 数据库实例
        resource_type: 资源类型
        resource_id: 资源ID
        limit: 返回数量
        
    Returns:
        List[OperationLog]: 日志列表
    """
    cursor = db.operation_logs.find({
        "resource_type": resource_type.value,
        "resource_id": ObjectId(resource_id)
    }).sort("created_at", -1).limit(limit)
    
    logs = []
    async for log_data in cursor:
        logs.append(OperationLog.from_mongo(log_data))
    
    return logs
