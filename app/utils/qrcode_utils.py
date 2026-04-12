"""
二维码生成工具
"""
import uuid
import qrcode
from pathlib import Path
from typing import Tuple


def generate_qrcode_token() -> str:
    """
    生成唯一的二维码token
    
    Returns:
        str: UUID格式的token
    """
    return str(uuid.uuid4())


def generate_qrcode_image(token: str, save_dir: str = "uploads/qrcodes") -> Tuple[str, str]:
    """
    生成二维码图片
    
    Args:
        token: 二维码token
        save_dir: 保存目录
        
    Returns:
        Tuple[str, str]: (文件路径, URL路径)
    """
    # 确保保存目录存在
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    
    # 生成文件名
    filename = f"{token}.png"
    file_path = save_path / filename
    
    # 创建二维码
    qr = qrcode.QRCode(
        version=1,  # 控制二维码大小，1是最小的
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # 错误纠正级别
        box_size=10,  # 每个格子的像素大小
        border=4,  # 边框格子数
    )
    
    # 添加数据
    qr.add_data(token)
    qr.make(fit=True)
    
    # 创建图片
    img = qr.make_image(fill_color="black", back_color="white")
    
    # 保存图片
    img.save(str(file_path))
    
    # 返回文件路径和URL路径
    url_path = f"/{save_dir}/{filename}"
    
    return str(file_path), url_path


def delete_qrcode_image(file_path: str) -> bool:
    """
    删除二维码图片
    
    Args:
        file_path: 文件路径
        
    Returns:
        bool: 是否删除成功
    """
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            return True
        return False
    except Exception:
        return False
