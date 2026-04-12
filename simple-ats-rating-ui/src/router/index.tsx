/**
 * 路由配置
 */

import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { UserRole } from '../types';
import { useAuth } from '../hooks';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  LoginPage,
  ChangePasswordPage,
  AdminDashboard,
  InterviewerDashboard,
  CandidateDashboard,
  NotFoundPage,
} from '@/pages';
import {
  UserListPage,
  CreateUserPage,
  EditUserPage,
  ImportInterviewersPage,
} from '@/pages/admin/users';
import {
  TemplateListPage,
  CreateTemplatePage,
  EditTemplatePage,
  ViewTemplatePage,
} from '@/pages/admin/templates';
import {
  SessionListPage,
  CreateSessionPage,
  EditSessionPage,
  ViewSessionPage,
  ManageInterviewersPage,
} from '@/pages/admin/sessions';
import {
  CandidateListPage,
  CreateCandidatePage,
  EditCandidatePage,
  ViewCandidatePage,
  ManageCandidateScoresPage,
} from '@/pages/admin/candidates';
import {
  MySessionsPage,
  SessionCandidatesPage,
  ScoreCandidatePage,
  ScoreHistoryPage,
  SessionStatsPage as InterviewerSessionStatsPage,
} from '@/pages/interviewer';
import {
  StatsOverviewPage,
  SessionStatsPage,
  SessionRankingPage,
  RealTimeDashboardPage,
} from '@/pages/admin/stats';
import { LogListPage } from '@/pages/admin/logs';

/**
 * 仪表板路由器 - 根据角色重定向到对应的仪表板
 */
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case UserRole.SUPER_ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    case UserRole.INTERVIEWER:
      return <Navigate to="/interviewer/dashboard" replace />;
    case UserRole.CANDIDATE:
      return <Navigate to="/candidate/dashboard" replace />;
    default:
      return <Navigate to="/404" replace />;
  }
};

/**
 * 布局包装组件
 */
const LayoutWrapper = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

/**
 * 路由配置
 */
export const router = createBrowserRouter([
  // 公共路由
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  
  // 根路径 - 根据角色重定向
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardRouter />
      </ProtectedRoute>
    ),
  },
  
  // 受保护的路由 - 使用MainLayout
  {
    element: (
      <ProtectedRoute>
        <LayoutWrapper />
      </ProtectedRoute>
    ),
    children: [
      // 超管路由
      {
        path: '/admin/dashboard',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><AdminDashboard /></RoleRoute>,
      },
      {
        path: '/admin/users',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><UserListPage /></RoleRoute>,
      },
      {
        path: '/admin/users/create',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><CreateUserPage /></RoleRoute>,
      },
      {
        path: '/admin/users/:id/edit',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><EditUserPage /></RoleRoute>,
      },
      {
        path: '/admin/users/import',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ImportInterviewersPage /></RoleRoute>,
      },
      {
        path: '/admin/templates',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><TemplateListPage /></RoleRoute>,
      },
      {
        path: '/admin/templates/create',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><CreateTemplatePage /></RoleRoute>,
      },
      {
        path: '/admin/templates/:id',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ViewTemplatePage /></RoleRoute>,
      },
      {
        path: '/admin/templates/:id/edit',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><EditTemplatePage /></RoleRoute>,
      },
      {
        path: '/admin/sessions',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SessionListPage /></RoleRoute>,
      },
      {
        path: '/admin/sessions/create',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><CreateSessionPage /></RoleRoute>,
      },
      {
        path: '/admin/sessions/:id',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ViewSessionPage /></RoleRoute>,
      },
      {
        path: '/admin/sessions/:id/edit',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><EditSessionPage /></RoleRoute>,
      },
      {
        path: '/admin/sessions/:id/interviewers',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ManageInterviewersPage /></RoleRoute>,
      },
      {
        path: '/admin/candidates',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><CandidateListPage /></RoleRoute>,
      },
      {
        path: '/admin/candidates/create',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><CreateCandidatePage /></RoleRoute>,
      },
      {
        path: '/admin/candidates/:id',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ViewCandidatePage /></RoleRoute>,
      },
      {
        path: '/admin/candidates/:id/scores',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><ManageCandidateScoresPage /></RoleRoute>,
      },
      {
        path: '/admin/candidates/:id/edit',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><EditCandidatePage /></RoleRoute>,
      },
      // 超管 - 统计分析路由
      {
        path: '/admin/stats',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><StatsOverviewPage /></RoleRoute>,
      },
      {
        path: '/admin/stats/sessions/:id',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SessionStatsPage /></RoleRoute>,
      },
      {
        path: '/admin/stats/sessions/:id/ranking',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SessionRankingPage /></RoleRoute>,
      },
      {
        path: '/admin/stats/sessions/:id/dashboard',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><RealTimeDashboardPage /></RoleRoute>,
      },
      {
        path: '/statistics',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><div>统计分析</div></RoleRoute>,
      },
      {
        path: '/export',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><div>数据导出</div></RoleRoute>,
      },
      {
        path: '/logs',
        element: <RoleRoute allowedRoles={[UserRole.SUPER_ADMIN]}><LogListPage /></RoleRoute>,
      },
      
      // 评委路由
      {
        path: '/interviewer/dashboard',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><InterviewerDashboard /></RoleRoute>,
      },
      {
        path: '/interviewer/sessions',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><MySessionsPage /></RoleRoute>,
      },
      {
        path: '/interviewer/sessions/:sessionId/candidates',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><SessionCandidatesPage /></RoleRoute>,
      },
      {
        path: '/interviewer/candidates/:candidateId/score',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><ScoreCandidatePage /></RoleRoute>,
      },
      {
        path: '/interviewer/history',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><ScoreHistoryPage /></RoleRoute>,
      },
      {
        path: '/interviewer/sessions/:sessionId/stats',
        element: <RoleRoute allowedRoles={[UserRole.INTERVIEWER]}><InterviewerSessionStatsPage /></RoleRoute>,
      },
      
      // 候选人路由
      {
        path: '/candidate/dashboard',
        element: <RoleRoute allowedRoles={[UserRole.CANDIDATE]}><CandidateDashboard /></RoleRoute>,
      },
      {
        path: '/candidate/profile',
        element: <RoleRoute allowedRoles={[UserRole.CANDIDATE]}><div>个人信息</div></RoleRoute>,
      },
      {
        path: '/candidate/status',
        element: <RoleRoute allowedRoles={[UserRole.CANDIDATE]}><div>面试状态</div></RoleRoute>,
      },
      
      // 通用路由（所有角色）
      {
        path: '/profile',
        element: <div>个人资料</div>,
      },
      {
        path: '/change-password',
        element: <ChangePasswordPage />,
      },
    ],
  },
  
  // 候选人自助注册（无需登录）
  {
    path: '/register',
    element: <div>候选人注册</div>,
  },
  
  // 404 - 所有未匹配的路由
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

export * from './ProtectedRoute';
export * from './RoleRoute';
