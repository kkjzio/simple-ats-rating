/**
 * 场次管理服务
 * 提供场次的CRUD操作、评委管理、二维码管理等功能
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type {
  SessionResponse,
  SessionListResponse,
  CreateSessionRequest,
  UpdateSessionRequest,
  SessionQueryParams,
  SessionStatus,
  QRCodeResponse,
  SessionInterviewersResponse,
  AssignInterviewersRequest,
} from '../types';
import type {
  SessionStatsResponse,
  CandidateRankingResponse,
  RankingQueryParams,
  DashboardResponse,
} from '../types/score';

/**
 * 获取场次列表
 * @param params 查询参数（分页、搜索、状态筛选）
 */
export const getSessions = async (
  params?: SessionQueryParams
): Promise<SessionListResponse> => {
  const response: AxiosResponse<SessionListResponse> = await apiClient.get('/sessions', {
    params,
  });
  return response.data;
};

/**
 * 获取场次详情
 * @param id 场次ID
 */
export const getSessionById = async (id: string): Promise<SessionResponse> => {
  const response: AxiosResponse<SessionResponse> = await apiClient.get(`/sessions/${id}`);
  return response.data;
};

/**
 * 创建场次
 * @param data 场次数据
 */
export const createSession = async (
  data: CreateSessionRequest
): Promise<SessionResponse> => {
  const response: AxiosResponse<SessionResponse> = await apiClient.post('/sessions', data);
  return response.data;
};

/**
 * 更新场次
 * @param id 场次ID
 * @param data 更新数据
 */
export const updateSession = async (
  id: string,
  data: UpdateSessionRequest
): Promise<SessionResponse> => {
  const response: AxiosResponse<SessionResponse> = await apiClient.put(
    `/sessions/${id}`,
    data
  );
  return response.data;
};

/**
 * 删除场次
 * @param id 场次ID
 */
export const deleteSession = async (id: string): Promise<void> => {
  await apiClient.delete(`/sessions/${id}`);
};

/**
 * 更新场次状态
 * @param id 场次ID
 * @param status 新状态
 */
export const updateSessionStatus = async (
  id: string,
  status: SessionStatus
): Promise<SessionResponse> => {
  const response: AxiosResponse<SessionResponse> = await apiClient.patch(
    `/sessions/${id}/status`,
    { status }
  );
  return response.data;
};

/**
 * 获取场次评委列表
 * @param sessionId 场次ID
 */
export const getSessionInterviewers = async (
  sessionId: string
): Promise<SessionInterviewersResponse> => {
  const response: AxiosResponse<SessionInterviewersResponse> = await apiClient.get(
    `/sessions/${sessionId}/interviewers`
  );
  return response.data;
};

/**
 * 分配评委到场次
 * @param sessionId 场次ID
 * @param interviewerIds 评委ID列表
 */
export const assignInterviewers = async (
  sessionId: string,
  interviewerIds: string[]
): Promise<SessionInterviewersResponse> => {
  const data: AssignInterviewersRequest = { interviewer_ids: interviewerIds };
  const response: AxiosResponse<SessionInterviewersResponse> = await apiClient.post(
    `/sessions/${sessionId}/assign-interviewers`,
    data
  );
  return response.data;
};

/**
 * 从场次移除评委
 * @param sessionId 场次ID
 * @param interviewerId 评委ID
 */
export const removeInterviewer = async (
  sessionId: string,
  interviewerId: string
): Promise<void> => {
  await apiClient.delete(`/sessions/${sessionId}/interviewers/${interviewerId}`);
};

/**
 * 重新生成场次二维码
 * @param sessionId 场次ID
 */
export const regenerateQRCode = async (sessionId: string): Promise<QRCodeResponse> => {
  const response: AxiosResponse<QRCodeResponse> = await apiClient.post(
    `/sessions/${sessionId}/regenerate-qrcode`
  );
  return response.data;
};

/**
 * 获取场次二维码
 * @deprecated 此接口在后端API中不存在，二维码信息包含在场次详情中
 * @param sessionId 场次ID
 */
export const getQRCode = async (sessionId: string): Promise<QRCodeResponse> => {
  throw new Error('API不支持：获取二维码接口在后端不存在，请使用 getSessionById 获取场次详情');
};

/**
 * API返回的统计数据结构
 */
interface ApiSessionStatsResponse {
  session: {
    id: string;
    name: string;
    date: string;
  };
  candidate_statistics: {
    total: number;
    average_score: number;
    max_score: number;
    min_score: number;
    std_dev: number;
    pass_count: number;
    pass_rate: number;
    score_distribution: Array<{
      range: string;
      count: number;
    }>;
  };
  dimension_statistics: Array<{
    dimension_name: string;
    average_score: number;
    max_score: number;
    min_score: number;
  }>;
  interviewer_statistics: Array<{
    interviewer: {
      id: string;
      name: string;
    };
    completed_count: number;
    average_score: number;
    std_dev: number;
    extreme_scores_count: number;
  }>;
}

/**
 * 转换API数据到前端期望的格式
 */
const transformStatsResponse = (apiData: ApiSessionStatsResponse): SessionStatsResponse => {
  const { session, candidate_statistics, dimension_statistics, interviewer_statistics } = apiData;
  
  // 计算中位数（简化处理，使用平均值）
  const median_score = candidate_statistics.average_score;
  
  // 转换分数分布，添加百分比
  const score_distribution = candidate_statistics.score_distribution.map(item => ({
    range: item.range,
    count: item.count,
    percentage: (item.count / candidate_statistics.total) * 100,
  }));
  
  // 转换维度统计
  const dimension_averages = dimension_statistics.map(dim => ({
    dimension_name: dim.dimension_name,
    average_score: dim.average_score,
    max_possible: dim.max_score,
    weight: 1, // 默认权重
  }));
  
  // 转换评委统计
  const interviewer_stats = interviewer_statistics.map(stat => ({
    interviewer_id: stat.interviewer.id,
    interviewer_name: stat.interviewer.name,
    scored_count: stat.completed_count,
    total_candidates: candidate_statistics.total,
    avg_score_time: 0, // API未返回，使用默认值
    avg_score: stat.average_score,
    progress_rate: (stat.completed_count / candidate_statistics.total) * 100,
  }));
  
  // 构造前端期望的响应格式
  return {
    session: {
      id: session.id,
      name: session.name,
      position: '', // API未返回，使用空字符串
      date: session.date,
      status: 'active', // API未返回，使用默认值
    },
    overview: {
      total_candidates: candidate_statistics.total,
      scored_candidates: candidate_statistics.pass_count + (candidate_statistics.total - candidate_statistics.pass_count),
      pending_candidates: 0, // API未明确返回
      total_interviewers: interviewer_statistics.length,
      active_interviewers: interviewer_statistics.filter(i => i.completed_count > 0).length,
      completion_rate: candidate_statistics.pass_rate,
    },
    score_stats: {
      average_score: candidate_statistics.average_score,
      max_score: candidate_statistics.max_score,
      min_score: candidate_statistics.min_score,
      std_dev: candidate_statistics.std_dev,
      median_score,
    },
    dimension_averages,
    score_distribution,
    top_candidates: [], // 需要从排名接口获取
    interviewer_stats,
  };
};

/**
 * 获取场次统计数据
 * @param sessionId 场次ID
 */
export const getSessionStats = async (sessionId: string): Promise<SessionStatsResponse> => {
  const response: AxiosResponse<ApiSessionStatsResponse> = await apiClient.get(
    `/sessions/${sessionId}/statistics`
  );
  return transformStatsResponse(response.data);
};

/**
 * API返回的排名数据结构
 */
interface ApiRankingItem {
  rank: number;
  candidate: {
    id: string;
    name: string;
    avatar?: string;
  };
  average_score: number;
  scores_count: number;
  status: string;
}

interface ApiRankingResponse {
  items: ApiRankingItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 转换API排名数据到前端期望的格式
 */
const transformRankingResponse = (apiData: ApiRankingResponse): CandidateRankingResponse => {
  const rankings = apiData.items.map(item => ({
    candidate_id: item.candidate.id,
    candidate_name: item.candidate.name,
    candidate_avatar: item.candidate.avatar || null,
    rank: item.rank,
    dimension_scores: [], // API未返回，使用空数组
    weighted_total_score: item.average_score, // 使用平均分作为加权总分
    average_score: item.average_score,
    score_count: item.scores_count,
    max_score: item.average_score, // API未返回，使用平均分
    min_score: item.average_score, // API未返回，使用平均分
  }));

  return {
    rankings,
    total: apiData.total,
    page: apiData.page,
    page_size: apiData.page_size,
  };
};

/**
 * 获取候选人排名
 * @param sessionId 场次ID
 * @param params 查询参数
 */
export const getSessionRanking = async (
  sessionId: string,
  params?: RankingQueryParams
): Promise<CandidateRankingResponse> => {
  const response: AxiosResponse<ApiRankingResponse> = await apiClient.get(
    `/sessions/${sessionId}/rankings`,
    { params }
  );
  return transformRankingResponse(response.data);
};

/**
 * API返回的实时大屏数据结构
 */
interface ApiDashboardResponse {
  session_info: {
    name: string;
    date: string;
    status: string;
  };
  progress: {
    total_candidates: number;
    completed_scores: number;
    completion_rate: number;
  };
  top_candidates: Array<{
    rank: number;
    name: string;
    average_score: number;
  }>;
  dimension_averages: Array<{
    dimension_name: string;
    average: number;
  }>;
  score_distribution: {
    labels: string[];
    data: number[];
  };
}

/**
 * 转换API大屏数据到前端期望的格式
 */
const transformDashboardResponse = (apiData: ApiDashboardResponse): DashboardResponse => {
  // 转换场次信息
  const session = {
    id: '', // API未返回，使用空字符串
    name: apiData.session_info.name,
    position: '', // API未返回，使用空字符串
    date: apiData.session_info.date,
    status: apiData.session_info.status,
  };

  // 转换进度信息
  const progress = {
    total_candidates: apiData.progress.total_candidates,
    scored_candidates: apiData.progress.completed_scores,
    completion_rate: apiData.progress.completion_rate,
    total_scores: apiData.progress.completed_scores,
  };

  // 转换Top候选人
  const top_rankings = apiData.top_candidates.map(item => ({
    rank: item.rank,
    candidate_id: '', // API未返回
    candidate_name: item.name,
    candidate_avatar: null,
    average_score: item.average_score,
    score_count: 0, // API未返回
  }));

  // 转换维度雷达数据
  const dimension_radar = apiData.dimension_averages.map(dim => ({
    dimension_name: dim.dimension_name,
    average_score: dim.average,
    max_score: 10, // 假设最大分10分
  }));

  // 转换分数分布
  const total = apiData.score_distribution.data.reduce((sum, count) => sum + count, 0);
  const score_distribution = apiData.score_distribution.labels.map((label, index) => ({
    range: label,
    count: apiData.score_distribution.data[index] || 0,
    percentage: total > 0 ? ((apiData.score_distribution.data[index] || 0) / total) * 100 : 0,
  }));

  return {
    session,
    progress,
    top_rankings,
    dimension_radar,
    score_distribution,
    interviewer_progress: [], // API未返回，使用空数组
    last_updated: new Date().toISOString(),
  };
};

/**
 * 获取实时大屏数据
 * @param sessionId 场次ID
 */
export const getSessionDashboard = async (sessionId: string): Promise<DashboardResponse> => {
  const response: AxiosResponse<ApiDashboardResponse> = await apiClient.get(
    `/sessions/${sessionId}/dashboard`
  );
  return transformDashboardResponse(response.data);
};

// 导出所有服务方法
const sessionService = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  updateSessionStatus,
  getSessionInterviewers,
  assignInterviewers,
  removeInterviewer,
  regenerateQRCode,
  getQRCode,
  getSessionStats,
  getSessionRanking,
  getSessionDashboard,
};

export default sessionService;
