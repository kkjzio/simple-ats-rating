/**
 * 场次相关类型定义
 */

/**
 * 场次状态枚举
 */
export enum SessionStatus {
  /** 草稿 */
  DRAFT = 'draft',
  /** 进行中 */
  ACTIVE = 'active',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已归档 */
  ARCHIVED = 'archived',
}

/**
 * 场次设置Schema
 */
export interface SessionSettingsSchema {
  /** 是否匿名评分 */
  anonymous_mode?: boolean;
  /** 通过分数线 */
  pass_threshold?: number;
  /** 极端分预警阈值 */
  extreme_score_threshold?: number;
}

/**
 * 场次统计Schema
 */
export interface SessionStatisticsSchema {
  /** 评委总数 */
  total_interviewers?: number;
  /** 候选人总数 */
  total_candidates?: number;
  /** 已评分候选人数 */
  scored_candidates?: number;
  /** 通过人数 */
  passed_candidates?: number;
}

/**
 * 场次响应
 */
export interface SessionResponse {
  /** 场次ID */
  id: string;
  /** 场次名称 */
  name: string;
  /** 面试日期 */
  date: string;
  /** 面试岗位 */
  position: string;
  /** 面试轮次 */
  round: number;
  /** 场次状态 */
  status: SessionStatus;
  /** 评分模板ID */
  scoring_template_id: string;
  /** 场次设置 */
  settings: SessionSettingsSchema;
  /** 统计信息 */
  statistics: SessionStatisticsSchema;
  /** 场次描述 */
  description?: string | null;
  /** 二维码URL */
  qr_code_url?: string | null;
  /** 二维码过期时间 */
  qr_code_expires_at?: string | null;
  /** 创建人ID */
  created_by: string;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建场次请求
 */
export interface CreateSessionRequest {
  /** 场次名称 */
  name: string;
  /** 面试日期 */
  date: string;
  /** 面试岗位 */
  position: string;
  /** 面试轮次 */
  round: number;
  /** 评分模板ID */
  scoring_template_id: string;
  /** 场次设置 */
  settings?: SessionSettingsSchema;
  /** 场次描述 */
  description?: string | null;
}

/**
 * 更新场次请求
 */
export interface UpdateSessionRequest {
  /** 场次名称 */
  name?: string | null;
  /** 面试日期 */
  date?: string | null;
  /** 面试岗位 */
  position?: string | null;
  /** 面试轮次 */
  round?: number | null;
  /** 评分模板ID */
  scoring_template_id?: string | null;
  /** 场次设置 */
  settings?: SessionSettingsSchema | null;
  /** 场次描述 */
  description?: string | null;
}

/**
 * 更新状态请求
 */
export interface UpdateStatusRequest {
  /** 新状态 */
  status: SessionStatus;
}

/**
 * 二维码响应
 */
export interface QRCodeResponse {
  /** 二维码URL */
  qr_code_url: string;
  /** 二维码Token */
  qr_code_token: string;
  /** 过期时间 */
  expires_at: string;
}

/**
 * 分配评委请求
 */
export interface AssignInterviewersRequest {
  /** 评委ID列表 */
  interviewer_ids: string[];
}

/**
 * 评委扫码绑定请求
 */
export interface JoinSessionRequest {
  /** 二维码Token */
  qr_code_token: string;
}

/**
 * 评委信息
 */
export interface InterviewerInfo {
  /** 评委ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 真实姓名 */
  real_name?: string | null;
  /** 邮箱 */
  email?: string | null;
  /** 加入时间 */
  joined_at: string;
}

/**
 * 场次评委列表响应
 */
export interface SessionInterviewersResponse {
  /** 场次ID */
  session_id: string;
  /** 评委列表 */
  interviewers: InterviewerInfo[];
  /** 评委总数 */
  total: number;
}

/**
 * 场次列表响应
 */
export interface SessionListResponse {
  /** 场次列表 */
  items: SessionResponse[];
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
 * 场次查询参数
 */
export interface SessionQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 状态筛选 */
  status?: SessionStatus | null;
  /** 开始日期 */
  date_from?: string | null;
  /** 结束日期 */
  date_to?: string | null;
  /** 搜索关键词 */
  keyword?: string | null;
}
