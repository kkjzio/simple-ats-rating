"""
数据库初始化脚本
创建索引和插入默认数据
"""

from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.security import get_password_hash
import logging

logger = logging.getLogger(__name__)


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    创建所有集合的索引
    
    Args:
        db: 数据库实例
    """
    logger.info("开始创建数据库索引...")
    
    try:
        # users collection
        await db.users.create_index("username", unique=True)
        await db.users.create_index("profile.phone", unique=True, sparse=True)
        await db.users.create_index("role")
        await db.users.create_index("status")
        logger.info("✓ users 集合索引创建完成")
        
        # scoring_templates collection
        await db.scoring_templates.create_index("is_default")
        await db.scoring_templates.create_index("created_by")
        logger.info("✓ scoring_templates 集合索引创建完成")
        
        # sessions collection
        await db.sessions.create_index("status")
        await db.sessions.create_index("date")
        await db.sessions.create_index("created_by")
        await db.sessions.create_index("qr_code_token", unique=True, sparse=True)
        logger.info("✓ sessions 集合索引创建完成")
        
        # candidates collection
        await db.candidates.create_index("session_id")
        await db.candidates.create_index("user_id")
        await db.candidates.create_index([("session_id", 1), ("order", 1)])
        logger.info("✓ candidates 集合索引创建完成")
        
        # session_interviewers collection
        await db.session_interviewers.create_index("session_id")
        await db.session_interviewers.create_index("interviewer_id")
        await db.session_interviewers.create_index(
            [("session_id", 1), ("interviewer_id", 1)],
            unique=True
        )
        logger.info("✓ session_interviewers 集合索引创建完成")
        
        # scores collection
        await db.scores.create_index("session_id")
        await db.scores.create_index("candidate_id")
        await db.scores.create_index("interviewer_id")
        await db.scores.create_index([("session_id", 1), ("candidate_id", 1)])
        await db.scores.create_index([("session_id", 1), ("interviewer_id", 1)])
        await db.scores.create_index(
            [("session_id", 1), ("candidate_id", 1), ("interviewer_id", 1)],
            unique=True
        )
        logger.info("✓ scores 集合索引创建完成")
        
        # operation_logs collection
        await db.operation_logs.create_index("user_id")
        await db.operation_logs.create_index("resource_type")
        await db.operation_logs.create_index("resource_id")
        await db.operation_logs.create_index("created_at")
        await db.operation_logs.create_index([("user_id", 1), ("created_at", -1)])
        logger.info("✓ operation_logs 集合索引创建完成")
        
        logger.info("所有索引创建完成！")
        
    except Exception as e:
        logger.error(f"创建索引失败: {str(e)}")
        raise


async def cleanup_candidate_score_fields(db: AsyncIOMotorDatabase) -> None:
    """清理 candidates 集合中的历史评分字段及旧索引。"""
    try:
        try:
            await db.candidates.drop_index("session_id_1_average_score_-1")
            logger.info("已删除 candidates 集合旧索引 session_id_1_average_score_-1")
        except Exception:
            logger.info("candidates 集合旧索引 session_id_1_average_score_-1 不存在，跳过")

        result = await db.candidates.update_many(
            {
                "$or": [
                    {"average_score": {"$exists": True}},
                    {"total_score": {"$exists": True}},
                ]
            },
            {
                "$unset": {
                    "average_score": "",
                    "total_score": "",
                }
            }
        )
        logger.info(
            f"candidates 集合历史评分字段清理完成，匹配 {result.matched_count} 条，修改 {result.modified_count} 条"
        )
    except Exception as e:
        logger.error(f"清理 candidates 评分字段失败: {str(e)}")
        raise


async def insert_default_data(db: AsyncIOMotorDatabase) -> None:
    """
    插入默认数据
    
    Args:
        db: 数据库实例
    """
    logger.info("开始插入默认数据...")
    
    try:
        # 1. 检查是否已存在管理员账户
        existing_admin = await db.users.find_one({"username": "admin"})
        if existing_admin:
            logger.info("管理员账户已存在，跳过创建")
            admin_id = existing_admin["_id"]
        else:
            # 创建默认超级管理员
            admin_user = {
                "username": "admin",
                "password_hash": get_password_hash("Admin@123"),
                "role": "super_admin",
                "profile": {
                    "name": "系统管理员",
                    "phone": "13800138000",
                    "email": "admin@company.com",
                    "avatar": "/assets/avatars/default_admin.png",
                    "department": "人力资源部"
                },
                "status": "active",
                "last_login_at": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.users.insert_one(admin_user)
            admin_id = result.inserted_id
            logger.info(f"✓ 默认管理员账户创建成功 (ID: {admin_id})")
            logger.info("  用户名: admin")
            logger.info("  密码: Admin@123")
        
        # 2. 检查是否已存在默认模板
        existing_template = await db.scoring_templates.find_one({"name": "通用面试评分模板"})
        if existing_template:
            logger.info("默认评分模板已存在，跳过创建")
        else:
            # 创建默认评分模板
            default_template = {
                "name": "通用面试评分模板",
                "description": "适用于大多数岗位的标准评分模板",
                "dimensions": [
                    {
                        "name": "专业能力",
                        "weight": 35,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "岗位相关的专业知识和技能水平"
                    },
                    {
                        "name": "沟通表达",
                        "weight": 25,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "语言表达能力和逻辑思维能力"
                    },
                    {
                        "name": "文化匹配",
                        "weight": 20,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "个人价值观与公司文化的契合度"
                    },
                    {
                        "name": "综合潜力",
                        "weight": 20,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "学习能力和未来发展潜力"
                    }
                ],
                "text_fields": [
                    {
                        "name": "综合评语",
                        "required": True,
                        "max_length": 500,
                        "placeholder": "请输入对候选人的综合评价"
                    },
                    {
                        "name": "技术评语",
                        "required": False,
                        "max_length": 300,
                        "placeholder": "可选：针对技术能力的详细说明"
                    }
                ],
                "is_default": True,
                "is_system": True,
                "created_by": admin_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.scoring_templates.insert_one(default_template)
            logger.info(f"✓ 默认评分模板创建成功 (ID: {result.inserted_id})")
        
        # 3. 创建技术岗评分模板
        existing_tech_template = await db.scoring_templates.find_one({"name": "技术岗评分模板"})
        if existing_tech_template:
            logger.info("技术岗评分模板已存在，跳过创建")
        else:
            tech_template = {
                "name": "技术岗评分模板",
                "description": "针对技术岗位设计的评分模板",
                "dimensions": [
                    {
                        "name": "技术深度",
                        "weight": 30,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "对技术原理和底层实现的理解深度"
                    },
                    {
                        "name": "技术广度",
                        "weight": 20,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "技术栈的广度和新技术的学习能力"
                    },
                    {
                        "name": "问题解决",
                        "weight": 25,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "分析和解决实际问题的能力"
                    },
                    {
                        "name": "代码质量",
                        "weight": 15,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "代码规范性和工程化意识"
                    },
                    {
                        "name": "团队协作",
                        "weight": 10,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "团队沟通和协作能力"
                    }
                ],
                "text_fields": [
                    {
                        "name": "技术评语",
                        "required": True,
                        "max_length": 500,
                        "placeholder": "请详细说明候选人的技术能力"
                    },
                    {
                        "name": "项目经验",
                        "required": False,
                        "max_length": 300,
                        "placeholder": "可选：对候选人项目经验的评价"
                    }
                ],
                "is_default": False,
                "is_system": True,
                "created_by": admin_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await db.scoring_templates.insert_one(tech_template)
            logger.info(f"✓ 技术岗评分模板创建成功 (ID: {result.inserted_id})")
        
        logger.info("默认数据插入完成！")
        
    except Exception as e:
        logger.error(f"插入默认数据失败: {str(e)}")
        raise


async def init_database(db: AsyncIOMotorDatabase) -> None:
    """
    初始化数据库（创建索引和插入默认数据）
    
    Args:
        db: 数据库实例
    """
    logger.info("=" * 50)
    logger.info("开始初始化数据库...")
    logger.info("=" * 50)
    
    try:
        # 创建索引
        await create_indexes(db)

        # 清理 candidates 集合中的历史评分字段
        await cleanup_candidate_score_fields(db)
        
        # 插入默认数据
        await insert_default_data(db)
        
        logger.info("=" * 50)
        logger.info("数据库初始化完成！")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"数据库初始化失败: {str(e)}")
        raise
