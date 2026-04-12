/**
 * 认证相关Hook
 */

import { useAuthStore } from '../stores';
import type { UserRole } from '../types';

/**
 * 使用认证状态
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getCurrentUser,
    changePassword,
    clearError,
  } = useAuthStore();
  
  /**
   * 检查是否有指定角色
   */
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };
  
  /**
   * 检查是否有任一角色
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };
  
  /**
   * 是否为超级管理员
   */
  const isSuperAdmin = (): boolean => {
    return user?.role === 'super_admin';
  };
  
  /**
   * 是否为评委
   */
  const isInterviewer = (): boolean => {
    return user?.role === 'interviewer';
  };
  
  /**
   * 是否为候选人
   */
  const isCandidate = (): boolean => {
    return user?.role === 'candidate';
  };
  
  return {
    // 状态
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    
    // 操作
    login,
    logout,
    getCurrentUser,
    changePassword,
    clearError,
    
    // 权限检查
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isInterviewer,
    isCandidate,
  };
};
