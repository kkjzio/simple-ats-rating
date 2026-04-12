"""
验证工具函数
"""
import re
from typing import List, Optional
from app.core.exceptions import ValidationError


def validate_phone(phone: str) -> bool:
    """
    验证中国大陆手机号
    
    Args:
        phone: 手机号字符串
        
    Returns:
        bool: 是否有效
        
    Raises:
        ValidationError: 手机号格式错误
    """
    pattern = r'^1[3-9]\d{9}$'
    if not re.match(pattern, phone):
        raise ValidationError(
            message="手机号格式错误",
            field="phone",
            details={"pattern": "1开头的11位数字"}
        )
    return True


def validate_password_strength(password: str) -> bool:
    """
    验证密码强度
    
    密码要求：
    - 长度8-20个字符
    - 必须包含大写字母、小写字母、数字、特殊字符中的至少3种
    
    Args:
        password: 密码字符串
        
    Returns:
        bool: 是否有效
        
    Raises:
        ValidationError: 密码不符合规则
    """
    if len(password) < 8 or len(password) > 20:
        raise ValidationError(
            message="密码长度必须在8-20个字符之间",
            field="password"
        )
    
    # 检查字符类型
    has_upper = bool(re.search(r'[A-Z]', password))
    has_lower = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    
    char_types = sum([has_upper, has_lower, has_digit, has_special])
    
    if char_types < 3:
        raise ValidationError(
            message="密码必须包含大写字母、小写字母、数字、特殊字符中的至少3种",
            field="password",
            details={
                "has_upper": has_upper,
                "has_lower": has_lower,
                "has_digit": has_digit,
                "has_special": has_special
            }
        )
    
    return True


def validate_email(email: str) -> bool:
    """
    验证邮箱格式
    
    Args:
        email: 邮箱字符串
        
    Returns:
        bool: 是否有效
        
    Raises:
        ValidationError: 邮箱格式错误
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError(
            message="邮箱格式错误",
            field="email"
        )
    return True


def validate_template_weights(dimensions: List[dict]) -> bool:
    """
    验证模板维度权重总和是否为100
    
    Args:
        dimensions: 维度列表，每个维度包含weight字段
        
    Returns:
        bool: 是否有效
        
    Raises:
        ValidationError: 权重总和不为100
    """
    if not dimensions:
        raise ValidationError(
            message="至少需要一个评分维度",
            field="dimensions"
        )
    
    if len(dimensions) > 10:
        raise ValidationError(
            message="评分维度最多10个",
            field="dimensions"
        )
    
    total_weight = sum(d.get('weight', 0) for d in dimensions)
    
    if total_weight != 100:
        raise ValidationError(
            message=f"所有维度权重之和必须等于100，当前为{total_weight}",
            field="dimensions",
            details={"total_weight": total_weight}
        )
    
    # 检查维度名称是否重复
    dimension_names = [d.get('name') for d in dimensions]
    if len(dimension_names) != len(set(dimension_names)):
        raise ValidationError(
            message="维度名称不能重复",
            field="dimensions"
        )
    
    return True


def validate_score_value(
    score: float,
    max_score: float,
    score_type: str = "decimal"
) -> bool:
    """
    验证评分值
    
    Args:
        score: 评分值
        max_score: 最高分
        score_type: 评分类型 (integer/decimal/star)
        
    Returns:
        bool: 是否有效
        
    Raises:
        ValidationError: 评分值不合法
    """
    if score < 0 or score > max_score:
        raise ValidationError(
            message=f"评分必须在0-{max_score}之间",
            field="score",
            details={"score": score, "max_score": max_score}
        )
    
    if score_type == "integer" and not score.is_integer():
        raise ValidationError(
            message="评分类型为整数时，分数必须是整数",
            field="score",
            details={"score": score, "score_type": score_type}
        )
    
    return True
