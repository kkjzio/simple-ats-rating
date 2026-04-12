"""
响应工具函数
"""
from typing import Any, Optional, List
from pydantic import BaseModel


class ResponseModel(BaseModel):
    """统一响应模型"""
    code: int
    message: str
    data: Optional[Any] = None


class PaginatedData(BaseModel):
    """分页数据模型"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


def success_response(
    data: Any = None,
    message: str = "success",
    code: int = 200
) -> dict:
    """
    成功响应
    
    Args:
        data: 响应数据
        message: 响应消息
        code: 状态码
        
    Returns:
        dict: 响应字典
    """
    return {
        "code": code,
        "message": message,
        "data": data
    }


def error_response(
    message: str,
    code: int = 400,
    error_type: str = "Error",
    details: Optional[dict] = None
) -> dict:
    """
    错误响应
    
    Args:
        message: 错误消息
        code: 状态码
        error_type: 错误类型
        details: 错误详情
        
    Returns:
        dict: 响应字典
    """
    response = {
        "code": code,
        "message": message,
        "error": {
            "type": error_type
        }
    }
    
    if details:
        response["error"]["details"] = details
    
    return response


def paginated_response(
    items: List[Any],
    total: int,
    page: int,
    page_size: int,
    message: str = "success"
) -> dict:
    """
    分页响应
    
    Args:
        items: 数据列表
        total: 总数
        page: 当前页码
        page_size: 每页数量
        message: 响应消息
        
    Returns:
        dict: 响应字典
    """
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        },
        message=message
    )
