/**
 * 用户相关类型定义
 */

/**
 * 用户角色枚举
 */
export enum UserRole {
  /** 超级管理员 */
  SUPER_ADMIN = 'super_admin',
  /** 评委 */
  INTERVIEWER = 'interviewer',
  /** 候选人 */
  CANDIDATE = 'candidate',
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 激活 */
  ACTIVE = 'active',
  /** 未激活 */
  INACTIVE = 'inactive',
  /** 锁定 */
  LOCKED = 'locked',
}

/**
 * 用户资料Schema
 */
export interface UserProfileSchema {
  /** 真实姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string | null;
  /** 头像URL */
  avatar?: string | null;
  /** 部门 */
  department?: string | null;
}

/**
 * 用户资料
 */
export interface UserProfile {
  /** 真实姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string | null;
  /** 头像URL */
  avatar?: string | null;
  /** 部门 */
  department?: string | null;
}

/**
 * 用户响应
 */
export interface UserResponse {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 角色 */
  role: UserRole;
  /** 用户资料 */
  profile: UserProfile;
  /** 账户状态 */
  status: UserStatus;
  /** 最后登录时间 */
  last_login_at?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 角色 */
  role: UserRole;
  /** 用户资料 */
  profile: UserProfileSchema;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  /** 用户资料 */
  profile?: UserProfileSchema | null;
  /** 账户状态 */
  status?: UserStatus | null;
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  /** 用户列表 */
  items: UserResponse[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  page_size: number;
  /** 总页数 */
  total_pages: number;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 角色筛选 */
  role?: string | null;
  /** 状态筛选 */
  status?: string | null;
  /** 关键词搜索 */
  keyword?: string | null;
}

/**
 * 导入结果
 */
export interface ImportResult {
  /** 总数 */
  total: number;
  /** 成功数 */
  success: number;
  /** 失败数 */
  failed: number;
  /** 错误列表 */
  errors?: Array<{
    row?: number;
    reason?: string;
    [key: string]: any;
  }>;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  /** 要重置密码的用户ID */
  user_id: string;
  /** 新密码（8-20位，必须包含大小写字母、数字和特殊字符） */
  new_password: string;
}

/**
 * 重置密码响应
 */
export interface ResetPasswordResponse {
  /** 用户ID */
  user_id: string;
  /** 用户名 */
  username: string;
  /** 操作结果消息 */
  message: string;
}
