"""
应用配置管理
使用 Pydantic Settings 管理配置，支持环境变量覆盖
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app import __version__


class Settings(BaseSettings):
    """应用配置类"""

    # 应用基础配置
    app_name: str = Field(default="ATS Rating System", description="应用名称")
    app_version: str = Field(default=__version__, description="应用版本")
    debug: bool = Field(default=False, description="调试模式")
    enable_docs: bool = Field(default=True, description="是否启用API文档（/docs, /redoc, /openapi.json）")
    
    # MongoDB配置
    mongodb_url: str = Field(
        default="mongodb://192.168.59.129:27017",
        description="MongoDB连接地址"
    )
    mongodb_username: str = Field(
        default="",
        description="MongoDB用户名，为空则不使用认证"
    )
    mongodb_password: str = Field(
        default="",
        description="MongoDB密码，为空则不使用认证"
    )
    mongodb_db_name: str = Field(
        default="ats_system",
        description="MongoDB数据库名称"
    )
    mongodb_max_pool_size: int = Field(
        default=10,
        description="MongoDB连接池最大连接数"
    )
    mongodb_min_pool_size: int = Field(
        default=1,
        description="MongoDB连接池最小连接数"
    )
    
    # JWT配置
    jwt_secret_key: str = Field(
        default="your-secret-key-change-this-in-production",
        description="JWT密钥，生产环境必须修改"
    )
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT加密算法"
    )
    jwt_access_token_expire_minutes: int = Field(
        default=60 * 24,  # 24小时
        description="JWT访问令牌过期时间（分钟）"
    )
    
    # CORS配置
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="允许的CORS源"
    )
    cors_allow_credentials: bool = Field(
        default=True,
        description="是否允许携带凭证"
    )
    cors_allow_methods: List[str] = Field(
        default=["*"],
        description="允许的HTTP方法"
    )
    cors_allow_headers: List[str] = Field(
        default=["*"],
        description="允许的HTTP头"
    )
    
    # 日志配置
    log_level: str = Field(
        default="INFO",
        description="日志级别"
    )
    
    # 文件上传配置
    max_upload_size: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="最大上传文件大小（字节）"
    )
    allowed_file_extensions: List[str] = Field(
        default=[".pdf", ".doc", ".docx"],
        description="允许的文件扩展名"
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# 创建全局配置实例
settings = Settings()
