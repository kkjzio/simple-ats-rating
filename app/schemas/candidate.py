"""
候选人相关Schema定义
"""
from typing import Optional, List, Dict, Any
from pydantic import model_validator
from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from app.utils.validators import validate_phone


class CandidateCreate(BaseModel):
    """创建候选人请求"""
    user_id: Optional[str] = Field(None, description="已有候选人用户ID")
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="候选人姓名")
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    order: Optional[int] = Field(None, ge=1, description="面试顺序")
    notes: Optional[str] = Field(None, max_length=500, description="备注")

    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v: Optional[str]) -> Optional[str]:
        """验证手机号格式"""
        if v is None:
            return v
        if not validate_phone(v):
            raise ValueError('手机号格式不正确')
        return v

    @model_validator(mode='after')
    def validate_create_mode(self):
        """创建模式校验：user_id 与 name+phone 二选一"""
        if self.user_id:
            return self

        if not self.name or not self.phone:
            raise ValueError('未选择已有候选人时，姓名和手机号为必填')

        return self


class CandidateUpdate(BaseModel):
    """更新候选人请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="候选人姓名")
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    order: Optional[int] = Field(None, ge=1, description="面试顺序")
    status: Optional[str] = Field(None, description="状态")
    notes: Optional[str] = Field(None, max_length=500, description="备注")


class UserInfo(BaseModel):
    """用户信息"""
    id: str = Field(..., description="用户ID")
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    avatar: Optional[str] = Field(None, description="头像URL")


class ResumeFileInfo(BaseModel):
    """简历文件信息"""
    url: str = Field(..., description="文件URL")
    filename: str = Field(..., description="原始文件名")


class CandidateResponse(BaseModel):
    """候选人响应"""
    id: str = Field(..., description="候选人ID")
    user: UserInfo = Field(..., description="用户信息")
    session_id: str = Field(..., description="场次ID")
    order: int = Field(..., description="面试顺序")
    resume_url: Optional[str] = Field(None, description="简历URL（向后兼容）")
    resume_filename: Optional[str] = Field(None, description="简历文件名（向后兼容）")
    resume_files: Optional[List["ResumeFileInfo"]] = Field(None, description="简历文件列表")
    status: str = Field(..., description="状态")
    total_score: Optional[float] = Field(None, description="最新评分的加权总分")
    average_score: Optional[float] = Field(None, description="所有评分的平均分")
    total_scores_count: int = Field(0, description="评分数量")
    notes: Optional[str] = Field(None, description="备注")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    """候选人列表响应"""
    items: List[CandidateResponse] = Field(..., description="候选人列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")


class CandidateImportRow(BaseModel):
    """导入的候选人行数据"""
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    position: Optional[str] = Field(None, description="应聘岗位")


class CandidateImportResult(BaseModel):
    """导入结果"""
    total: int = Field(..., description="总数")
    success: int = Field(..., description="成功数")
    failed: int = Field(..., description="失败数")
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="错误列表")


class ReorderItem(BaseModel):
    """顺序调整项"""
    candidate_id: str = Field(..., description="候选人ID")
    order: int = Field(..., ge=1, description="新顺序")


class ReorderRequest(BaseModel):
    """调整顺序请求"""
    orders: List[ReorderItem] = Field(..., min_length=1, description="顺序列表")


class SelfRegisterRequest(BaseModel):
    """自助注册请求"""
    session_token: str = Field(..., description="场次令牌")
    name: str = Field(..., min_length=1, max_length=50, description="姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    position: Optional[str] = Field(None, max_length=100, description="应聘岗位")
    
    @field_validator('phone')
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        """验证手机号格式"""
        if not validate_phone(v):
            raise ValueError('手机号格式不正确')
        return v


class SelfRegisterResponse(BaseModel):
    """自助注册响应"""
    username: str = Field(..., description="用户名")
    initial_password: str = Field(..., description="初始密码")
    login_url: str = Field(..., description="登录地址")
    message: str = Field(..., description="提示信息")


class CandidateMyInfo(BaseModel):
    """候选人查看自己的信息"""
    profile: UserInfo = Field(..., description="个人信息")
    sessions: List[Dict[str, Any]] = Field(..., description="参加的场次列表")


class CandidateSessionStatus(BaseModel):
    """候选人面试状态"""
    session: Dict[str, Any] = Field(..., description="场次信息")
    my_order: int = Field(..., description="我的面试顺序")
    status: str = Field(..., description="面试状态")


class AvailableCandidateUser(BaseModel):
    """可选候选人用户"""
    id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    name: str = Field(..., description="姓名")
    phone: str = Field(..., description="手机号")
    email: Optional[str] = Field(None, description="邮箱")
    status: str = Field(..., description="用户状态")


class AvailableCandidateUserListResponse(BaseModel):
    """可选候选人用户列表响应"""
    items: List[AvailableCandidateUser] = Field(..., description="用户列表")
    total: int = Field(..., description="总数")
    page: int = Field(..., description="当前页")
    page_size: int = Field(..., description="每页数量")
    total_pages: int = Field(..., description="总页数")
