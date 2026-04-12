/**
 * 认证相关类型定义
 */

import { UserRole, UserProfile } from './user';

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 角色 */
  role: UserRole;
  /** 用户资料 */
  profile: UserProfile;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名或手机号 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 令牌类型 */
  token_type: string;
  /** 过期时间（秒） */
  expires_in: number;
  /** 用户信息 */
  user: UserInfo;
}

/**
 * 刷新令牌请求
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refresh_token: string;
}

/**
 * 令牌响应
 */
export interface TokenResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 令牌类型 */
  token_type: string;
  /** 过期时间（秒） */
  expires_in: number;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  /** 原密码 */
  old_password: string;
  /** 新密码 */
  new_password: string;
  /** 确认密码 */
  confirm_password: string;
}

/**
 * 认证状态
 */
export interface AuthState {
  /** 用户信息 */
  user: UserInfo | null;
  /** 访问令牌 */
  token: string | null;
  /** 刷新令牌 */
  refreshToken: string | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
}
