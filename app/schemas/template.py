"""
模板相关Schema
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.models.template import ScoreType, Dimension, TextField
from app.utils.validators import validate_template_weights


class DimensionSchema(BaseModel):
    """维度Schema"""
    name: str = Field(..., min_length=1, max_length=50, description="维度名称")
    weight: float = Field(..., ge=0, le=100, description="权重（0-100）")
    max_score: float = Field(..., gt=0, le=100, description="最高分")
    score_type: ScoreType = Field(default=ScoreType.DECIMAL, description="评分类型")
    description: Optional[str] = Field(None, max_length=200, description="维度说明")
    
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


class TextFieldSchema(BaseModel):
    """评语字段Schema"""
    name: str = Field(..., min_length=1, max_length=50, description="字段名称")
    required: bool = Field(default=False, description="是否必填")
    max_length: int = Field(default=500, ge=1, le=2000, description="最大字符数")
    placeholder: Optional[str] = Field(None, max_length=100, description="输入提示")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "综合评语",
                "required": True,
                "max_length": 500,
                "placeholder": "请输入对候选人的综合评价"
            }
        }


class TemplateCreate(BaseModel):
    """创建模板请求"""
    name: str = Field(..., min_length=1, max_length=100, description="模板名称")
    description: Optional[str] = Field(None, max_length=500, description="模板描述")
    dimensions: List[DimensionSchema] = Field(..., min_length=1, max_length=10, description="评分维度列表")
    text_fields: List[TextFieldSchema] = Field(default_factory=list, description="文本评语字段")
    
    @field_validator('dimensions')
    @classmethod
    def validate_dimensions_weights(cls, v: List[DimensionSchema]) -> List[DimensionSchema]:
        """验证维度权重"""
        dimensions_dict = [d.model_dump() for d in v]
        validate_template_weights(dimensions_dict)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "产品经理评分模板",
                "description": "针对产品经理岗位的评分模板",
                "dimensions": [
                    {
                        "name": "产品思维",
                        "weight": 30,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "产品设计和规划能力"
                    },
                    {
                        "name": "用户洞察",
                        "weight": 25,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "对用户需求的理解和洞察"
                    },
                    {
                        "name": "沟通协调",
                        "weight": 25,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "跨部门沟通和协调能力"
                    },
                    {
                        "name": "执行力",
                        "weight": 20,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "项目推进和执行能力"
                    }
                ],
                "text_fields": [
                    {
                        "name": "综合评语",
                        "required": True,
                        "max_length": 500,
                        "placeholder": "请输入综合评价"
                    }
                ]
            }
        }


class TemplateUpdate(BaseModel):
    """更新模板请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="模板名称")
    description: Optional[str] = Field(None, max_length=500, description="模板描述")
    dimensions: Optional[List[DimensionSchema]] = Field(None, min_length=1, max_length=10, description="评分维度列表")
    text_fields: Optional[List[TextFieldSchema]] = Field(None, description="文本评语字段")
    
    @field_validator('dimensions')
    @classmethod
    def validate_dimensions_weights(cls, v: Optional[List[DimensionSchema]]) -> Optional[List[DimensionSchema]]:
        """验证维度权重"""
        if v:
            dimensions_dict = [d.model_dump() for d in v]
            validate_template_weights(dimensions_dict)
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "产品经理评分模板（更新）",
                "description": "针对产品经理岗位的评分模板",
                "dimensions": [
                    {
                        "name": "产品思维",
                        "weight": 30,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "产品设计和规划能力"
                    }
                ]
            }
        }


class TemplateResponse(BaseModel):
    """模板响应"""
    id: str = Field(..., description="模板ID")
    name: str = Field(..., description="模板名称")
    description: Optional[str] = Field(None, description="模板描述")
    dimensions: List[Dimension] = Field(..., description="评分维度列表")
    text_fields: List[TextField] = Field(..., description="文本评语字段")
    is_default: bool = Field(..., description="是否为默认模板")
    is_system: bool = Field(..., description="是否为系统预置模板")
    created_by: Optional[str] = Field(None, description="创建人ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "6761234567890abcdef10001",
                "name": "通用面试评分模板",
                "description": "适用于大多数岗位的标准评分模板",
                "dimensions": [
                    {
                        "name": "专业能力",
                        "weight": 35,
                        "max_score": 10,
                        "score_type": "decimal",
                        "description": "岗位相关的专业知识和技能水平"
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


class TemplateListResponse(BaseModel):
    """模板列表响应"""
    items: List[TemplateResponse] = Field(..., description="模板列表")
    total: int = Field(..., ge=0, description="总数")
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, description="每页数量")
    total_pages: int = Field(..., ge=0, description="总页数")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 10,
                "page": 1,
                "page_size": 20,
                "total_pages": 1
            }
        }