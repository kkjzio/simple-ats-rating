"""
自定义异常类
"""
from typing import Any, Optional


class BaseAPIException(Exception):
    """基础API异常类"""
    
    def __init__(
        self,
        message: str = "服务器错误",
        code: int = 500,
        error_type: str = "ServerError",
        details: Optional[dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.error_type = error_type
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(BaseAPIException):
    """认证错误"""
    
    def __init__(
        self,
        message: str = "认证失败",
        details: Optional[dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code=401,
            error_type="AuthenticationError",
            details=details
        )


class PermissionDeniedError(BaseAPIException):
    """权限错误"""
    
    def __init__(
        self,
        message: str = "权限不足",
        details: Optional[dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code=403,
            error_type="PermissionDeniedError",
            details=details
        )


class ResourceNotFoundError(BaseAPIException):
    """资源不存在错误"""
    
    def __init__(
        self,
        message: str = "资源不存在",
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[dict[str, Any]] = None
    ):
        error_details = details or {}
        if resource_type:
            error_details["resource_type"] = resource_type
        if resource_id:
            error_details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            code=404,
            error_type="ResourceNotFoundError",
            details=error_details
        )


class ValidationError(BaseAPIException):
    """验证错误"""
    
    def __init__(
        self,
        message: str = "数据验证失败",
        field: Optional[str] = None,
        details: Optional[dict[str, Any]] = None
    ):
        error_details = details or {}
        if field:
            error_details["field"] = field
        
        super().__init__(
            message=message,
            code=422,
            error_type="ValidationError",
            details=error_details
        )


class DuplicateResourceError(BaseAPIException):
    """资源重复错误"""
    
    def __init__(
        self,
        message: str = "资源已存在",
        resource_type: Optional[str] = None,
        field: Optional[str] = None,
        details: Optional[dict[str, Any]] = None
    ):
        error_details = details or {}
        if resource_type:
            error_details["resource_type"] = resource_type
        if field:
            error_details["field"] = field
        
        super().__init__(
            message=message,
            code=409,
            error_type="DuplicateResourceError",
            details=error_details
        )


class BusinessLogicError(BaseAPIException):
    """业务逻辑错误"""
    
    def __init__(
        self,
        message: str = "业务逻辑错误",
        details: Optional[dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            code=400,
            error_type="BusinessLogicError",
            details=details
        )


# 别名，方便使用
NotFoundError = ResourceNotFoundError
ConflictError = DuplicateResourceError
BusinessRuleError = BusinessLogicError
BusinessError = BusinessLogicError
