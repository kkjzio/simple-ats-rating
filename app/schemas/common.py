"""
通用Schema
"""
from typing import Any, Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field


class ResponseModel(BaseModel):
    """统一响应格式"""
    code: int = Field(..., description="状态码")
    message: str = Field(..., description="响应消息")
    data: Optional[Any] = Field(None, description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 200,
                "message": "success",
                "data": {}
            }
        }


T = TypeVar('T')


class PaginationParams(BaseModel):
    """分页参数"""
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=100, description="每页数量")
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 20
            }
        }


T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """分页响应"""
    items: List[T] = Field(..., description="数据列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    total_pages: int = Field(..., ge=0, description="总页数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5
            }
        }


class ErrorDetail(BaseModel):
    """错误详情"""
    type: str = Field(..., description="错误类型")
    details: Optional[dict] = Field(None, description="错误详细信息")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "ValidationError",
                "details": {
                    "field": "email",
                    "message": "邮箱格式错误"
                }
            }
        }


class ErrorResponse(BaseModel):
    """错误响应"""
    code: int = Field(..., description="错误码")
    message: str = Field(..., description="错误消息")
    error: ErrorDetail = Field(..., description="错误详情")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": 400,
                "message": "请求参数错误",
                "error": {
                    "type": "ValidationError",
                    "details": {
                        "field": "email",
                        "message": "邮箱格式错误"
                    }
                }
            }
        }


class IDResponse(BaseModel):
    """ID响应"""
    id: str = Field(..., description="资源ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef12345"
            }
        }


class MessageResponse(BaseModel):
    """消息响应"""
    message: str = Field(..., description="消息内容")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "操作成功"
            }
        }


class SuccessResponse(BaseModel, Generic[T]):
    """成功响应（泛型）"""
    success: bool = Field(default=True, description="是否成功")
    message: str = Field(default="操作成功", description="响应消息")
    data: Optional[T] = Field(None, description="响应数据")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "操作成功",
                "data": {}
            }
        }
