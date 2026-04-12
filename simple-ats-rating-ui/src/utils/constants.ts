/**
 * 常量定义
 */

import { UserRole, UserStatus, SessionStatus, ScoreType } from '../types';

/**
 * 用户角色选项
 */
export const USER_ROLE_OPTIONS = [
  { label: '超级管理员', value: UserRole.SUPER_ADMIN },
  { label: '评委', value: UserRole.INTERVIEWER },
  { label: '候选人', value: UserRole.CANDIDATE },
];

/**
 * 用户角色标签映射
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.INTERVIEWER]: '评委',
  [UserRole.CANDIDATE]: '候选人',
};

/**
 * 用户状态选项
 */
export const USER_STATUS_OPTIONS = [
  { label: '激活', value: UserStatus.ACTIVE },
  { label: '未激活', value: UserStatus.INACTIVE },
  { label: '锁定', value: UserStatus.LOCKED },
];

/**
 * 用户状态标签映射
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: '激活',
  [UserStatus.INACTIVE]: '未激活',
  [UserStatus.LOCKED]: '锁定',
};

/**
 * 用户状态颜色映射
 */
export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.INACTIVE]: 'default',
  [UserStatus.LOCKED]: 'danger',
};

/**
 * 场次状态选项
 */
export const SESSION_STATUS_OPTIONS = [
  { label: '草稿', value: SessionStatus.DRAFT },
  { label: '进行中', value: SessionStatus.ACTIVE },
  { label: '已完成', value: SessionStatus.COMPLETED },
  { label: '已归档', value: SessionStatus.ARCHIVED },
];

/**
 * 场次状态标签映射
 */
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  [SessionStatus.DRAFT]: '草稿',
  [SessionStatus.ACTIVE]: '进行中',
  [SessionStatus.COMPLETED]: '已完成',
  [SessionStatus.ARCHIVED]: '已归档',
};

/**
 * 场次状态颜色映射
 */
export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  [SessionStatus.DRAFT]: 'default',
  [SessionStatus.ACTIVE]: 'processing',
  [SessionStatus.COMPLETED]: 'success',
  [SessionStatus.ARCHIVED]: 'default',
};

/**
 * 评分类型选项
 */
export const SCORE_TYPE_OPTIONS = [
  { label: '整数', value: ScoreType.INTEGER },
  { label: '小数', value: ScoreType.DECIMAL },
  { label: '星级', value: ScoreType.STAR },
];

/**
 * 评分类型标签映射
 */
export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  [ScoreType.INTEGER]: '整数',
  [ScoreType.DECIMAL]: '小数',
  [ScoreType.STAR]: '星级',
};

/**
 * 评分状态标签映射
 */
export const SCORE_STATUS_LABELS: Record<string, string> = {
  pending: '待评分',
  draft: '草稿',
  submitted: '已提交',
};

/**
 * 评分状态颜色映射
 */
export const SCORE_STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  draft: 'warning',
  submitted: 'success',
};

/**
 * 候选人状态标签映射
 */
export const CANDIDATE_STATUS_LABELS: Record<string, string> = {
  waiting: '等待',
  in_progress: '进行中',
  completed: '已完成',
  passed: '通过',
  rejected: '未通过',
};

/**
 * 候选人状态颜色映射
 */
export const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  waiting: 'default',
  in_progress: 'processing',
  completed: 'success',
  passed: 'success',
  rejected: 'danger',
};

/**
 * 分页默认配置
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
};

/**
 * 日期格式
 */
export const DATE_FORMATS = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  time: 'HH:mm:ss',
  monthDay: 'MM-DD',
  yearMonth: 'YYYY-MM',
};

/**
 * Toast默认持续时间（毫秒）
 */
export const TOAST_DURATION = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

/**
 * 文件上传限制
 */
export const FILE_UPLOAD_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    resume: ['.pdf', '.doc', '.docx'],
    excel: ['.xlsx', '.xls'],
    image: ['.jpg', '.jpeg', '.png', '.gif'],
  },
};

/**
 * 路由路径
 */
export const ROUTES = {
  // 公共路由
  LOGIN: '/login',
  REGISTER: '/register',
  NOT_FOUND: '/404',
  
  // 超管路由
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_TEMPLATES: '/admin/templates',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_CANDIDATES: '/admin/candidates',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_LOGS: '/admin/logs',
  
  // 评委路由
  INTERVIEWER_DASHBOARD: '/interviewer/dashboard',
  INTERVIEWER_SESSIONS: '/interviewer/sessions',
  INTERVIEWER_SCORING: '/interviewer/scoring',
  
  // 候选人路由
  CANDIDATE_DASHBOARD: '/candidate/dashboard',
  CANDIDATE_STATUS: '/candidate/status',
  CANDIDATE_REGISTER: '/candidate/register',
};

/**
 * API错误码
 */
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
};

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  TOKEN: 'ats_access_token',
  REFRESH_TOKEN: 'ats_refresh_token',
  USER_INFO: 'ats_user_info',
  THEME: 'ats_theme',
  LANGUAGE: 'ats_language',
};
