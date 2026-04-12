/**
 * 用户服务
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type {
  UserResponse,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  ImportResult,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ApiResponse,
} from '../types';

/**
 * 获取用户列表
 */
export const getUsers = async (params?: UserQueryParams): Promise<UserListResponse> => {
  const response: AxiosResponse<ApiResponse<UserListResponse>> = await apiClient.get(
    '/users',
    { params }
  );
  return response.data.data!;
};

/**
 * 获取用户详情
 */
export const getUser = async (userId: string): Promise<UserResponse> => {
  const response: AxiosResponse<ApiResponse<UserResponse>> = await apiClient.get(
    `/users/${userId}`
  );
  return response.data.data!;
};

/**
 * 创建用户
 */
export const createUser = async (data: CreateUserRequest): Promise<UserResponse> => {
  const response: AxiosResponse<ApiResponse<UserResponse>> = await apiClient.post(
    '/users',
    data
  );
  return response.data.data!;
};

/**
 * 更新用户
 */
export const updateUser = async (
  userId: string,
  data: UpdateUserRequest
): Promise<UserResponse> => {
  const response: AxiosResponse<ApiResponse<UserResponse>> = await apiClient.put(
    `/users/${userId}`,
    data
  );
  return response.data.data!;
};

/**
 * 删除用户
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

/**
 * 批量导入评委
 */
export const importInterviewers = async (file: File): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response: AxiosResponse<ApiResponse<ImportResult>> = await apiClient.post(
    '/users/import-interviewers',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data!;
};

/**
 * 重置用户密码
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> => {
  const response: AxiosResponse<ApiResponse<ResetPasswordResponse>> = await apiClient.post(
    '/users/reset-password',
    data
  );
  return response.data.data!;
};

const userService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  importInterviewers,
  resetPassword,
};

export default userService;
