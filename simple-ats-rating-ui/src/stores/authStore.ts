/**
 * 认证状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo, LoginRequest, ChangePasswordRequest } from '../types';
import { authService } from '../services';
import { setToken, removeToken, setUserInfo, removeUserInfo, clearStorage } from '../utils/storage';

interface AuthState {
  // 状态
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 操作
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  setUser: (user: UserInfo | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // 登录
      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          
          // 保存token
          setToken(response.access_token, response.refresh_token);
          
          // 保存用户信息
          setUserInfo(response.user);
          
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },
      
      // 登出
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // 清除本地存储
          clearStorage();
          
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },
      
      // 获取当前用户信息
      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.getCurrentUser();
          
          // 更新用户信息
          setUserInfo(user);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || '获取用户信息失败',
            isLoading: false,
          });
          throw error;
        }
      },
      
      // 修改密码
      changePassword: async (data: ChangePasswordRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.changePassword(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || '修改密码失败',
            isLoading: false,
          });
          throw error;
        }
      },
      
      // 设置用户信息
      setUser: (user: UserInfo | null) => {
        if (user) {
          setUserInfo(user);
          set({ user, isAuthenticated: true });
        } else {
          removeUserInfo();
          set({ user: null, isAuthenticated: false });
        }
      },
      
      // 清除错误
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
