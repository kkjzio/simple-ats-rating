"""
文件处理工具
"""
import os
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import UploadFile, HTTPException
from app.core.config import settings


# 文件类型配置
FILE_TYPE_CONFIG = {
    "resume": {
        "allowed_types": [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/jpg"
        ],
        "max_size": 5 * 1024 * 1024,  # 5MB
        "upload_dir": "uploads/resumes"
    },
    "avatar": {
        "allowed_types": [
            "image/jpeg",
            "image/png",
            "image/jpg"
        ],
        "max_size": 2 * 1024 * 1024,  # 2MB
        "upload_dir": "uploads/avatars"
    },
    "excel": {
        "allowed_types": [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ],
        "max_size": 10 * 1024 * 1024,  # 10MB
        "upload_dir": "uploads/temp"
    }
}


async def validate_file(
    file: UploadFile,
    allowed_types: List[str],
    max_size: int
) -> None:
    """
    验证文件
    
    Args:
        file: 上传的文件
        allowed_types: 允许的MIME类型列表
        max_size: 最大文件大小(字节)
    
    Raises:
        HTTPException: 验证失败时抛出
    """
    # 验证文件类型
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}。允许的类型: {', '.join(allowed_types)}"
        )
    
    # 读取文件内容以验证大小
    content = await file.read()
    file_size = len(content)
    
    # 重置文件指针
    await file.seek(0)
    
    # 验证文件大小
    if file_size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制。最大允许: {max_size_mb}MB"
        )
    
    # 验证文件不为空
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="文件不能为空"
        )


async def save_uploaded_file(
    file: UploadFile,
    upload_type: str
) -> dict:
    """
    保存上传的文件
    
    Args:
        file: 上传的文件
        upload_type: 上传类型 (resume/avatar/excel)
    
    Returns:
        dict: 包含file_url和file_path的字典
    
    Raises:
        HTTPException: 保存失败时抛出
    """
    # 获取文件类型配置
    if upload_type not in FILE_TYPE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的上传类型: {upload_type}"
        )
    
    config = FILE_TYPE_CONFIG[upload_type]
    
    # 验证文件
    await validate_file(file, config["allowed_types"], config["max_size"])
    
    # 创建上传目录
    upload_dir = Path(config["upload_dir"])
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成唯一文件名
    file_ext = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # 保存文件
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件保存失败: {str(e)}"
        )
    
    # 返回文件信息
    file_url = f"/{config['upload_dir']}/{unique_filename}"
    
    return {
        "file_url": file_url,
        "file_path": str(file_path),
        "filename": file.filename,
        "size": len(content),
        "mime_type": file.content_type
    }


def delete_file(file_path: str) -> bool:
    """
    删除文件
    
    Args:
        file_path: 文件路径
    
    Returns:
        bool: 删除是否成功
    """
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"删除文件失败: {str(e)}")
        return False


def get_file_path_from_url(file_url: str) -> Optional[str]:
    """
    从URL获取文件路径
    
    Args:
        file_url: 文件URL (如 /uploads/resumes/xxx.pdf)
    
    Returns:
        str: 文件系统路径
    """
    if not file_url:
        return None
    
    # 移除开头的斜杠
    if file_url.startswith("/"):
        file_url = file_url[1:]
    
    return file_url


def ensure_upload_dirs():
    """
    确保所有上传目录存在
    """
    for config in FILE_TYPE_CONFIG.values():
        upload_dir = Path(config["upload_dir"])
        upload_dir.mkdir(parents=True, exist_ok=True)
