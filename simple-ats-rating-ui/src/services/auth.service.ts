/**
 * 认证服务
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  TokenResponse,
  ChangePasswordRequest,
  UserInfo,
  ApiResponse,
} from '../types';

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response: AxiosResponse<ApiResponse<LoginResponse>> = await apiClient.post(
    '/auth/login',
    data
  );
  return response.data.data!;
};

/**
 * 刷新令牌
 */
export const refreshToken = async (data: RefreshTokenRequest): Promise<TokenResponse> => {
  const response: AxiosResponse<ApiResponse<TokenResponse>> = await apiClient.post(
    '/auth/refresh',
    data
  );
  return response.data.data!;
};

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response: AxiosResponse<ApiResponse<UserInfo>> = await apiClient.get('/auth/me');
  return response.data.data!;
};

/**
 * 修改密码
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await apiClient.post('/auth/change-password', data);
};

const authService = {
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changePassword,
};

export default authService;
