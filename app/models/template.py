"""
评分模板模型
"""
from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
from app.utils.datetime import ensure_timezone


class ScoreType(str, Enum):
    """评分类型枚举"""
    INTEGER = "integer"
    DECIMAL = "decimal"
    STAR = "star"


class Dimension(BaseModel):
    """评分维度"""
    name: str = Field(..., description="维度名称")
    weight: float = Field(..., ge=0, le=100, description="权重（0-100）")
    max_score: float = Field(..., gt=0, description="最高分")
    score_type: ScoreType = Field(default=ScoreType.DECIMAL, description="评分类型")
    description: Optional[str] = Field(None, description="维度说明")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "专业能力",
                "weight": 35,
                "max_score": 10,
                "score_type": "decimal",
                "description": "岗位相关的专业知识和技能水平"
            }
        }


class TextField(BaseModel):
    """评语字段"""
    name: str = Field(..., description="字段名称")
    required: bool = Field(default=False, description="是否必填")
    max_length: int = Field(default=500, ge=1, le=2000, description="最大字符数")
    placeholder: Optional[str] = Field(None, description="输入提示")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "综合评语",
                "required": True,
                "max_length": 500,
                "placeholder": "请输入对候选人的综合评价"
            }
        }


class ScoringTemplate(BaseModel):
    """评分模板模型"""
    id: Optional[str] = Field(None, alias="_id", description="模板ID")
    name: str = Field(..., min_length=1, max_length=100, description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    dimensions: List[Dimension] = Field(..., min_length=1, max_length=10, description="评分维度列表")
    text_fields: List[TextField] = Field(default_factory=list, description="文本评语字段")
    is_default: bool = Field(default=False, description="是否为默认模板")
    is_system: bool = Field(default=False, description="是否为系统预置模板")
    created_by: Optional[str] = Field(None, description="创建人ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    
    @field_validator('dimensions')
    @classmethod
    def validate_dimensions(cls, v: List[Dimension]) -> List[Dimension]:
        """验证维度列表"""
        if not v:
            raise ValueError("至少需要一个评分维度")
        
        if len(v) > 10:
            raise ValueError("评分维度最多10个")
        
        # 检查维度名称是否重复
        names = [d.name for d in v]
        if len(names) != len(set(names)):
            raise ValueError("维度名称不能重复")
        
        # 检查权重总和是否为100
        total_weight = sum(d.weight for d in v)
        if abs(total_weight - 100) > 0.01:  # 允许浮点误差
            raise ValueError(f"所有维度权重之和必须等于100，当前为{total_weight}")
        
        return v
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "_id": "6761234567890abcdef10001",
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
                    }
                ],
                "is_default": True,
                "is_system": True,
                "created_by": "6761234567890abcdef12345",
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    
    def dict(self, **kwargs):
        """重写dict方法，处理ObjectId"""
        d = super().dict(**kwargs)
        if '_id' in d and d['_id']:
            d['_id'] = str(d['_id'])
        if 'created_by' in d and d['created_by']:
            d['created_by'] = str(d['created_by'])
        return d
    
    @classmethod
    def from_mongo(cls, data: dict) -> "ScoringTemplate":
        """从MongoDB数据创建ScoringTemplate对象"""
        if not data:
            return None
        if '_id' in data:
            data['_id'] = str(data['_id'])
        if 'created_by' in data and data['created_by']:
            data['created_by'] = str(data['created_by'])
        # 确保 datetime 字段带有 UTC 时区信息
        for field in ['created_at', 'updated_at']:
            if field in data and data[field] is not None:
                data[field] = ensure_timezone(data[field], assume_utc=True)
        return cls(**data)
    
    def to_mongo(self) -> dict:
        """转换为MongoDB文档格式"""
        data = self.dict(by_alias=True, exclude_none=False)
        if '_id' in data and data['_id']:
            data['_id'] = ObjectId(data['_id'])
        elif '_id' in data:
            del data['_id']
        if 'created_by' in data and data['created_by']:
            data['created_by'] = ObjectId(data['created_by'])
        return data
