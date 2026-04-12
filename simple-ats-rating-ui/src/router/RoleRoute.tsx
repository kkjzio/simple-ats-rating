/**
 * 角色路由组件
 * 根据用户角色控制访问权限
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import type { UserRole } from '../types';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/',
}) => {
  const { user, hasAnyRole } = useAuth();
  
  // 检查用户是否有权限访问
  if (!user || !hasAnyRole(allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};
