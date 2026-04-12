/**
 * 候选人相关类型定义
 */

/**
 * 候选人信息
 */
export interface CandidateInfo {
  /** 候选人ID */
  id: string;
  /** 候选人姓名 */
  name: string;
  /** 头像URL */
  avatar?: string | null;
}

/**
 * 候选人响应
 */
export interface CandidateResponse {
  /** 候选人ID */
  id: string;
  /** 场次ID */
  session_id: string;
  /** 姓名 */
  name: string;
  /** 性别 */
  gender?: string | null;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string | null;
  /** 教育背景 */
  education?: string | null;
  /** 工作经验（年） */
  work_experience?: number | null;
  /** 面试顺序 */
  order: number;
  /** 状态 */
  status: string;
  /** 头像URL */
  avatar?: string | null;
  /** 简历URL（向后兼容） */
  resume_url?: string | null;
  /** 简历文件名（向后兼容） */
  resume_filename?: string | null;
  /** 简历文件列表 */
  resume_files?: Array<{ url: string; filename: string }> | null;
  /** 备注 */
  notes?: string | null;
  /** 加权总分 */
  total_score?: number | null;
  /** 平均分 */
  average_score?: number | null;
  /** 评分数量 */
  scores_count?: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建候选人请求
 */
export interface CreateCandidateRequest {
  /** 已有候选人用户ID */
  user_id?: string | null;
  /** 姓名 */
  name?: string;
  /** 性别 */
  gender?: string | null;
  /** 手机号 */
  phone?: string;
  /** 邮箱 */
  email?: string | null;
  /** 教育背景 */
  education?: string | null;
  /** 工作经验（年） */
  work_experience?: number | null;
  /** 面试顺序 */
  order?: number | null;
  /** 备注 */
  notes?: string | null;
  /** 简历文件列表 */
  resumes?: File[] | null;
}

/**
 * 更新候选人请求
 */
export interface UpdateCandidateRequest {
  /** 姓名 */
  name?: string | null;
  /** 性别 */
  gender?: string | null;
  /** 手机号 */
  phone?: string | null;
  /** 邮箱 */
  email?: string | null;
  /** 教育背景 */
  education?: string | null;
  /** 工作经验（年） */
  work_experience?: number | null;
  /** 面试顺序 */
  order?: number | null;
  /** 状态 */
  status?: string | null;
  /** 备注 */
  notes?: string | null;
}

/**
 * 候选人自助注册请求
 */
export interface SelfRegisterRequest {
  /** 场次令牌 */
  session_token: string;
  /** 姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string | null;
  /** 应聘岗位 */
  position?: string | null;
  /** 简历文件列表 */
  resumes?: File[] | null;
}

/**
 * 顺序调整项
 */
export interface ReorderItem {
  /** 候选人ID */
  candidate_id: string;
  /** 新顺序 */
  order: number;
}

/**
 * 调整顺序请求
 */
export interface ReorderRequest {
  /** 顺序列表 */
  orders: ReorderItem[];
}

/**
 * 候选人列表响应
 */
export interface CandidateListResponse {
  /** 候选人列表 */
  items: CandidateResponse[];
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
 * 候选人查询参数
 */
export interface CandidateQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 状态筛选 */
  status?: string | null;
  /** 关键词搜索 */
  keyword?: string | null;
  /** 排序字段 */
  sort_by?: string;
}

/**
 * 可选候选人用户
 */
export interface AvailableCandidateUser {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email?: string | null;
  /** 状态 */
  status: string;
}

/**
 * 可选候选人用户列表响应
 */
export interface AvailableCandidateUserListResponse {
  /** 用户列表 */
  items: AvailableCandidateUser[];
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
 * 可选候选人用户查询参数
 */
export interface AvailableCandidateUserQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 关键词 */
  keyword?: string | null;
}
