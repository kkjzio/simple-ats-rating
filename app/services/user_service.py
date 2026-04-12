"""
用户服务
处理用户的CRUD操作、批量导入等业务逻辑
"""

import io
from datetime import datetime
from typing import Optional, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import UploadFile
import openpyxl

from app.core.security import get_password_hash
from app.core.exceptions import ValidationError, NotFoundError, ConflictError
from app.models.user import User, UserRole, UserStatus, UserProfile
from app.models.operation_log import ActionType, ResourceType
from app.schemas.user import UserCreate, UserUpdate, ImportResult, PasswordResetResponse
from app.utils.validators import validate_phone, validate_email


async def get_user_list(
    db: AsyncIOMotorDatabase,
    page: int = 1,
    page_size: int = 20,
    role: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None
) -> Tuple[List[User], int]:
    """
    获取用户列表（分页、筛选）
    
    Args:
        db: 数据库实例
        page: 页码
        page_size: 每页数量
        role: 角色筛选
        status: 状态筛选
        keyword: 关键词搜索（用户名、姓名、手机号）
        
    Returns:
        Tuple[List[User], int]: (用户列表, 总数)
    """
    # 构建查询条件
    query = {}
    
    if role:
        query["role"] = role
    
    if status:
        query["status"] = status
    
    if keyword:
        # 支持用户名、姓名、手机号搜索
        query["$or"] = [
            {"username": {"$regex": keyword, "$options": "i"}},
            {"profile.name": {"$regex": keyword, "$options": "i"}},
            {"profile.phone": {"$regex": keyword, "$options": "i"}}
        ]
    
    # 计算总数
    total = await db.users.count_documents(query)
    
    # 分页查询
    skip = (page - 1) * page_size
    cursor = db.users.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    
    users = []
    async for user_data in cursor:
        # 添加诊断日志
        # print(f"[DEBUG] 用户数据字段: {list(user_data.keys())}")
        # print(f"[DEBUG] 用户ID: {user_data.get('_id')}")
        # print(f"[DEBUG] 是否有 password_hash: {'password_hash' in user_data}")
        # print(f"[DEBUG] 是否有 password: {'password' in user_data}")
        # if 'password_hash' not in user_data and 'password' not in user_data:
        #     print(f"[ERROR] 用户 {user_data.get('_id')} 缺少密码字段！完整数据: {user_data}")
        users.append(User.from_mongo(user_data))
    
    return users, total


async def get_user_by_id(
    db: AsyncIOMotorDatabase,
    user_id: str
) -> User:
    """
    获取用户详情
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        
    Returns:
        User: 用户对象
        
    Raises:
        NotFoundError: 用户不存在
    """
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise NotFoundError(message="用户不存在")
    
    return User.from_mongo(user_data)


async def create_user(
    db: AsyncIOMotorDatabase,
    user_data: UserCreate,
    operator_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """
    创建用户
    
    Args:
        db: 数据库实例
        user_data: 用户创建数据
        operator_id: 操作人ID
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        User: 创建的用户对象
        
    Raises:
        ConflictError: 用户名或手机号已存在
    """
    # 检查用户名是否已存在
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise ConflictError(message="用户名已存在")
    
    # 检查手机号是否已存在
    existing_phone = await db.users.find_one({"profile.phone": user_data.profile.phone})
    if existing_phone:
        raise ConflictError(message="手机号已存在")
    
    # 创建用户对象
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        profile=UserProfile(**user_data.profile.dict()),
        status=UserStatus.ACTIVE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # 插入数据库
    result = await db.users.insert_one(user.to_mongo())
    user.id = str(result.inserted_id)
    
    # 记录操作日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=operator_id,
        action=ActionType.USER_CREATE,
        resource_type=ResourceType.USER,
        resource_id=user.id,
        details={
            "username": user.username,
            "role": user.role.value,
            "name": user.profile.name
        },
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return user


async def update_user(
    db: AsyncIOMotorDatabase,
    user_id: str,
    user_data: UserUpdate,
    operator_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> User:
    """
    更新用户信息
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        user_data: 用户更新数据
        operator_id: 操作人ID
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        User: 更新后的用户对象
        
    Raises:
        NotFoundError: 用户不存在
        ConflictError: 手机号已被其他用户使用
    """
    # 检查用户是否存在
    existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise NotFoundError(message="用户不存在")
    
    # 构建更新数据
    update_data = {"updated_at": datetime.utcnow()}
    
    # 更新用户资料
    if user_data.profile:
        # 如果修改了手机号，检查是否已被其他用户使用
        if user_data.profile.phone != existing_user["profile"]["phone"]:
            phone_exists = await db.users.find_one({
                "profile.phone": user_data.profile.phone,
                "_id": {"$ne": ObjectId(user_id)}
            })
            if phone_exists:
                raise ConflictError(message="手机号已被其他用户使用")
        
        # 更新profile字段
        for field, value in user_data.profile.dict(exclude_none=True).items():
            update_data[f"profile.{field}"] = value
    
    # 更新状态
    if user_data.status is not None:
        update_data["status"] = user_data.status.value
    
    # 执行更新
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    # 获取更新后的用户
    updated_user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    user = User.from_mongo(updated_user_data)
    
    # 记录操作日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=operator_id,
        action=ActionType.USER_UPDATE,
        resource_type=ResourceType.USER,
        resource_id=user_id,
        details={
            "updated_fields": list(update_data.keys()),
            "username": user.username
        },
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return user


async def delete_user(
    db: AsyncIOMotorDatabase,
    user_id: str,
    operator_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """
    删除用户（软删除，状态改为inactive）
    
    Args:
        db: 数据库实例
        user_id: 用户ID
        operator_id: 操作人ID
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Raises:
        NotFoundError: 用户不存在
        ValidationError: 评委有评分记录不能删除
    """
    # 检查用户是否存在
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise NotFoundError(message="用户不存在")
    
    user = User.from_mongo(user_data)
    
    # 如果是评委，检查是否有评分记录
    if user.role == UserRole.INTERVIEWER:
        score_count = await db.scores.count_documents({"interviewer_id": ObjectId(user_id)})
        if score_count > 0:
            raise ValidationError(message="该评委已有评分记录，不能删除")
    
    # 软删除：将状态改为inactive
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "status": UserStatus.INACTIVE.value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # 记录操作日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=operator_id,
        action=ActionType.USER_DELETE,
        resource_type=ResourceType.USER,
        resource_id=user_id,
        details={
            "username": user.username,
            "role": user.role.value,
            "name": user.profile.name
        },
        ip_address=ip_address,
        user_agent=user_agent
    )


async def reset_user_password(
    db: AsyncIOMotorDatabase,
    user_id: str,
    new_password: str,
    operator_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> PasswordResetResponse:
    """
    重置用户密码（仅超级管理员）
    
    Args:
        db: 数据库实例
        user_id: 要重置密码的用户ID
        new_password: 新密码
        operator_id: 操作人ID（超级管理员）
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        PasswordResetResponse: 密码重置结果
        
    Raises:
        NotFoundError: 用户不存在
    """
    # 检查目标用户是否存在
    user_data = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_data:
        raise NotFoundError(message="目标用户不存在")
    
    user = User.from_mongo(user_data)
    
    # 使用密码哈希函数加密新密码
    hashed_password = get_password_hash(new_password)
    
    # 更新数据库中的用户密码
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "password_hash": hashed_password,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # 记录操作日志
    from app.services.log_service import create_log
    await create_log(
        db=db,
        user_id=operator_id,
        action=ActionType.USER_UPDATE,
        resource_type=ResourceType.USER,
        resource_id=user_id,
        details={
            "action": "reset_password",
            "target_username": user.username,
            "target_user_id": user_id
        },
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return PasswordResetResponse(
        user_id=user_id,
        username=user.username,
        message="密码重置成功"
    )


async def import_interviewers(
    db: AsyncIOMotorDatabase,
    file: UploadFile,
    operator_id: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> ImportResult:
    """
    批量导入评委
    
    Excel格式要求：
    - 第一行为表头：姓名、手机号、邮箱（可选）、部门（可选）
    - 从第二行开始为数据
    
    Args:
        db: 数据库实例
        file: Excel文件
        operator_id: 操作人ID
        ip_address: IP地址
        user_agent: 浏览器UA
        
    Returns:
        ImportResult: 导入结果
        
    Raises:
        ValidationError: 文件格式错误
    """
    # 检查文件类型
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise ValidationError(message="只支持Excel文件（.xlsx或.xls）")
    
    # 读取文件内容
    content = await file.read()
    
    try:
        # 解析Excel
        workbook = openpyxl.load_workbook(io.BytesIO(content))
        sheet = workbook.active
        
        # 验证表头
        headers = [cell.value for cell in sheet[1]]
        required_headers = ["姓名", "手机号"]
        
        if not all(h in headers for h in required_headers):
            raise ValidationError(message=f"Excel表头必须包含：{', '.join(required_headers)}")
        
        # 获取列索引
        name_col = headers.index("姓名")
        phone_col = headers.index("手机号")
        email_col = headers.index("邮箱") if "邮箱" in headers else None
        dept_col = headers.index("部门") if "部门" in headers else None
        
        # 处理数据
        total = 0
        success = 0
        failed = 0
        errors = []
        
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            total += 1
            
            try:
                # 提取数据
                name = row[name_col]
                phone = row[phone_col]
                email = row[email_col] if email_col is not None else None
                department = row[dept_col] if dept_col is not None else None
                
                # 验证必填字段
                if not name or not phone:
                    errors.append({
                        "row": row_idx,
                        "reason": "姓名和手机号不能为空"
                    })
                    failed += 1
                    continue
                
                # 转换为字符串并去除空格
                name = str(name).strip()
                phone = str(phone).strip()
                if email:
                    email = str(email).strip()
                if department:
                    department = str(department).strip()
                
                # 验证手机号格式
                try:
                    validate_phone(phone)
                except ValueError as e:
                    errors.append({
                        "row": row_idx,
                        "reason": f"手机号格式错误: {str(e)}"
                    })
                    failed += 1
                    continue
                
                # 验证邮箱格式
                if email:
                    try:
                        validate_email(email)
                    except ValueError as e:
                        errors.append({
                            "row": row_idx,
                            "reason": f"邮箱格式错误: {str(e)}"
                        })
                        failed += 1
                        continue
                
                # 检查手机号是否已存在
                existing_phone = await db.users.find_one({"profile.phone": phone})
                if existing_phone:
                    errors.append({
                        "row": row_idx,
                        "reason": "手机号已存在"
                    })
                    failed += 1
                    continue
                
                # 生成用户名（使用手机号）
                username = f"interviewer_{phone}"
                
                # 检查用户名是否已存在
                existing_username = await db.users.find_one({"username": username})
                if existing_username:
                    errors.append({
                        "row": row_idx,
                        "reason": "用户名已存在"
                    })
                    failed += 1
                    continue
                
                # 生成默认密码（手机号后6位）
                default_password = phone[-6:] + "@Abc"
                
                # 创建用户
                user = User(
                    username=username,
                    password_hash=get_password_hash(default_password),
                    role=UserRole.INTERVIEWER,
                    profile=UserProfile(
                        name=name,
                        phone=phone,
                        email=email,
                        department=department
                    ),
                    status=UserStatus.ACTIVE,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                await db.users.insert_one(user.to_mongo())
                success += 1
                
            except Exception as e:
                errors.append({
                    "row": row_idx,
                    "reason": f"处理失败: {str(e)}"
                })
                failed += 1
        
        # 记录操作日志
        from app.services.log_service import create_log
        await create_log(
            db=db,
            user_id=operator_id,
            action=ActionType.CANDIDATE_IMPORT,
            resource_type=ResourceType.USER,
            details={
                "total": total,
                "success": success,
                "failed": failed,
                "filename": file.filename
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return ImportResult(
            total=total,
            success=success,
            failed=failed,
            errors=errors
        )
        
    except Exception as e:
        raise ValidationError(message=f"Excel文件解析失败: {str(e)}")
