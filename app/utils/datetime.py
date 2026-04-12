"""
时间工具函数
"""
from datetime import datetime, timezone, timedelta
from typing import Optional

# 定义东8区时区（Asia/Shanghai）
TZ_SHANGHAI = timezone(timedelta(hours=8))


def get_current_time() -> datetime:
    """
    获取当前UTC时间（项目标准存储时区）
    
    Returns:
        datetime: 当前UTC时间（带时区信息）
    """
    return datetime.now(timezone.utc)


def get_current_utc_time() -> datetime:
    """
    获取当前UTC时间
    
    Returns:
        datetime: 当前UTC时间（带时区信息）
    """
    return datetime.now(timezone.utc)


def get_current_shanghai_time() -> datetime:
    """
    获取当前东8区时间
    
    Returns:
        datetime: 当前东8区时间（带时区信息）
    """
    return datetime.now(TZ_SHANGHAI)


def format_datetime(
    dt: Optional[datetime],
    format_str: str = "%Y-%m-%d %H:%M:%S"
) -> Optional[str]:
    """
    格式化时间
    
    Args:
        dt: datetime对象
        format_str: 格式化字符串
        
    Returns:
        str: 格式化后的时间字符串，如果dt为None则返回None
    """
    if dt is None:
        return None
    return dt.strftime(format_str)


def to_shanghai(dt: datetime) -> datetime:
    """
    转换为东8区时间（用于显示）
    
    Args:
        dt: datetime对象
        
    Returns:
        datetime: 东8区时间（带时区信息）
    """
    if dt.tzinfo is None:
        # 如果没有时区信息，假设为UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TZ_SHANGHAI)


def to_utc(dt: datetime) -> datetime:
    """
    转换为UTC时间（用于存储）
    
    Args:
        dt: datetime对象
        
    Returns:
        datetime: UTC时间（带时区信息）
    """
    if dt.tzinfo is None:
        # 如果没有时区信息，假设为UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def ensure_timezone(dt: datetime, assume_utc: bool = True) -> datetime:
    """
    确保datetime对象有时区信息
    
    Args:
        dt: datetime对象
        assume_utc: 如果为True且dt无时区信息，假设为UTC；否则假设为东8区
        
    Returns:
        datetime: 带时区信息的datetime对象
    """
    if dt.tzinfo is None:
        if assume_utc:
            return dt.replace(tzinfo=timezone.utc)
        else:
            return dt.replace(tzinfo=TZ_SHANGHAI)
    return dt
