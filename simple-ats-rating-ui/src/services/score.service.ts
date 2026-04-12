/**
 * 评分服务
 * 提供评委评分相关的API调用
 */

import apiClient from './api';
import type {
  ApiResponse,
  PaginatedResponse,
} from '../types/common';
import type {
  ScoreResponse,
  SaveScoreDraftRequest,
  SubmitScoreRequest,
  MyCandidatesResponse,
  CandidateScoresResponse,
  ScoreQueryParams,
  AdminModifyScoreRequest,
  AdminModifyScoreResult,
  AdminScoreDetailResponse,
} from '../types/score';
import type { SessionResponse } from '../types/session';

/**
 * 场次统计数据
 */
export interface SessionStatsResponse {
  /** 场次信息 */
  session: {
    id: string;
    name: string;
    position: string;
    date: string;
  };
  /** 评分进度 */
  progress: {
    total_candidates: number;
    scored_candidates: number;
    pending_candidates: number;
    completion_rate: number;
  };
  /** 各维度平均分 */
  dimension_averages: Array<{
    dimension_name: string;
    average_score: number;
    max_score: number;
  }>;
  /** 候选人排名 */
  top_candidates: Array<{
    candidate_id: string;
    candidate_name: string;
    candidate_avatar?: string | null;
    average_score: number;
    score_count: number;
  }>;
  /** 整体统计 */
  overall_stats: {
    average_total_score: number;
    max_total_score: number;
    min_total_score: number;
    std_dev: number;
  };
}

/**
 * 我的场次项
 */
export interface MySessionItem extends SessionResponse {
  /** 评分进度 */
  my_progress: {
    total: number;
    completed: number;
    draft: number;
  };
}

/**
 * 我的场次列表响应
 */
export interface MySessionsResponse {
  items: MySessionItem[];
  total: number;
}

/**
 * 评分历史查询参数
 */
export interface ScoreHistoryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 场次ID过滤 */
  session_id?: string | null;
  /** 状态过滤 */
  status?: string | null;
  /** 搜索关键词（候选人姓名） */
  keyword?: string | null;
}

/**
 * 评分历史项
 */
export interface ScoreHistoryItem {
  /** 评分ID */
  score_id: string;
  /** 场次ID */
  session_id: string;
  /** 场次名称 */
  session_name: string;
  /** 候选人ID */
  candidate_id: string;
  /** 候选人姓名 */
  candidate_name: string;
  /** 总分 */
  total_score: number;
  /** 状态 */
  status: string;
  /** 提交时间 */
  submitted_at?: string | null;
}

export const mapMyCandidatesResponse = (backendData: any, sessionId: string): MyCandidatesResponse => {
  const session = backendData?.session || {};
  const candidates = backendData?.candidates || [];
  const progress = backendData?.progress || {};

  const mappedCandidates = candidates.map((candidate: any) => ({
    candidate_id: candidate.candidate_id || candidate.id,
    candidate_name: candidate.name || '',
    candidate_avatar: candidate.avatar || null,
    order: candidate.order || 0,
    score_id: candidate.score_id || null,
    score_status: candidate.score_status || 'pending',
    total_score: candidate.total_score || null,
    updated_at: candidate.updated_at || null,
  }));

  const completedFromList = mappedCandidates.filter(
    (candidate) => candidate.score_status === 'submitted' || candidate.score_status === 'completed'
  ).length;
  const draftFromList = mappedCandidates.filter((candidate) => candidate.score_status === 'draft').length;

  const total = progress.total_candidates ?? mappedCandidates.length;
  const completed = progress.completed_count ?? completedFromList;
  const draft = progress.draft_count ?? draftFromList ?? 0;

  return {
    session_id: session.session_id || sessionId,
    session_name: session.name || '',
    candidates: mappedCandidates,
    total,
    completed,
    draft,
  };
};

export const mapScoreResponse = (scoreData: any): ScoreResponse => ({
  id: scoreData?._id || scoreData?.id,
  session_id: scoreData?.session_id || '',
  candidate_id: scoreData?.candidate_id || '',
  interviewer_id: scoreData?.interviewer_id || '',
  interviewer_name: scoreData?.interviewer_name || undefined,
  dimension_scores: Array.isArray(scoreData?.dimension_scores) ? scoreData.dimension_scores : [],
  text_feedbacks: Array.isArray(scoreData?.text_feedbacks) ? scoreData.text_feedbacks : [],
  total_score: scoreData?.total_score || 0,
  status: scoreData?.status || 'draft',
  is_extreme: scoreData?.is_extreme,
  submitted_at: scoreData?.submitted_at || null,
  modify_reason: scoreData?.modify_reason || null,
  modified_by: scoreData?.modified_by || null,
  modified_at: scoreData?.modified_at || null,
  created_at: scoreData?.created_at || new Date().toISOString(),
  updated_at: scoreData?.updated_at || new Date().toISOString(),
});

class ScoreService {
  /**
   * 扫码绑定场次
   * @param token 二维码token
   */
  async bindSession(token: string): Promise<SessionResponse> {
    const response = await apiClient.post<ApiResponse<SessionResponse>>(
      '/interviewer/sessions/join',
      { qr_code_token: token }
    );
    return response.data.data!;
  }

  /**
   * 获取我的场次列表
   * @param status 状态过滤（可选）
   */
  async getMySessions(status?: string): Promise<MySessionsResponse> {
    const params: any = {};
    if (status) {
      params.status = status;
    }
    
    const response = await apiClient.get<ApiResponse<any>>(
      '/interviewer/sessions',
      { params }
    );
    
    // 数据适配：后端返回 sessions 数组，需要转换为前端期望的格式
    const backendData = response.data.data;
    const sessions = backendData?.sessions || [];
    
    // 转换数据结构，将后端字段映射到前端期望的字段
    const items: MySessionItem[] = sessions.map((session: any) => {
      // 获取评分进度数据
      const progress = session.progress || {};
      const totalCandidates = progress.total_candidates || 0;
      const completedCount = progress.completed_count || 0;
      const pendingCount = progress.pending_count || 0;
      
      return {
        // 基础字段映射
        id: session.session_id || session.id,
        name: session.name || '',
        date: session.date || '',
        position: session.position || '',
        round: session.round || 1,
        status: session.status || 'draft',
        scoring_template_id: session.scoring_template_id || '',
        description: session.description || null,
        qr_code_url: session.qr_code_url || null,
        qr_code_expires_at: session.qr_code_expires_at || null,
        created_by: session.created_by || '',
        created_at: session.created_at || session.date || new Date().toISOString(),
        updated_at: session.updated_at || session.date || new Date().toISOString(),
        
        // 设置和统计信息
        settings: session.settings || {
          anonymous_mode: false,
          pass_threshold: 60,
          extreme_score_threshold: 30,
        },
        statistics: session.statistics || {
          total_interviewers: 0,
          total_candidates: 0,
          scored_candidates: 0,
          passed_candidates: 0,
        },
        
        // 评分进度映射：后端的 progress 转换为前端的 my_progress
        // 注意：pending_count 是待评分数量，draft 需要从其他地方获取
        my_progress: {
          total: totalCandidates,
          completed: completedCount,
          draft: pendingCount, // 暂时使用 pending_count，后续可能需要调整
        },
      };
    });
    
    return {
      items,
      total: items.length,
    };
  }

  /**
   * 获取待评候选人列表
   * @param sessionId 场次ID
   */
  async getMyCandidates(sessionId: string): Promise<MyCandidatesResponse> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/interviewer/sessions/${sessionId}/candidates`
    );
    
    // 数据适配：将后端返回的数据映射到前端期望的格式
    const backendData = response.data.data;
    
    return mapMyCandidatesResponse(backendData, sessionId);
  }

  /**
   * 获取候选人的所有评分
   * @param candidateId 候选人ID
   */
  async getCandidateScores(candidateId: string): Promise<CandidateScoresResponse> {
    const response = await apiClient.get<ApiResponse<CandidateScoresResponse>>(
      `/interviewer/candidates/${candidateId}/scores`
    );
    return response.data.data!;
  }

  async getAdminCandidateScores(candidateId: string): Promise<CandidateScoresResponse> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/candidates/${candidateId}/scores`
    );

    const backendData = response.data.data || {};
    const scores = Array.isArray(backendData.scores)
      ? backendData.scores.map((score: any) => mapScoreResponse(score))
      : [];

    return {
      candidate: {
        id: backendData.candidate_id || candidateId,
        name: backendData.candidate_name || '',
        avatar: backendData.candidate_avatar || null,
      },
      scores,
      statistics: {
        average_score: backendData.statistics?.average_score || 0,
        max_score: backendData.statistics?.max_score || 0,
        min_score: backendData.statistics?.min_score || 0,
        std_dev: backendData.statistics?.std_dev || 0,
        count: backendData.statistics?.count ?? backendData.statistics?.total_scores ?? scores.length,
      },
    };
  }

  /**
   * 获取我对候选人的评分
   * @param sessionId 场次ID
   * @param candidateId 候选人ID
   */
  async getMyScore(sessionId: string, candidateId: string): Promise<ScoreResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `/interviewer/sessions/${sessionId}/candidates/${candidateId}/my-score`
      );

      const backendData = response.data.data;
      if (!backendData) {
        return null;
      }

      // 数据适配：处理后端返回的字段映射
      const scoreData = backendData.score || backendData;

      return mapScoreResponse(scoreData);
    } catch (error: any) {
      // 如果404表示还未评分，返回null
      if (error.status === 404 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 保存评分草稿
   * @param sessionId 场次ID
   * @param candidateId 候选人ID
   * @param data 评分数据
   */
  async saveDraft(
    sessionId: string,
    candidateId: string,
    data: SaveScoreDraftRequest
  ): Promise<ScoreResponse> {
    const response = await apiClient.post<ApiResponse<ScoreResponse>>(
      `/interviewer/sessions/${sessionId}/candidates/${candidateId}/scores/draft`,
      data
    );
    return response.data.data!;
  }

  async getScoreDetail(scoreId: string): Promise<AdminScoreDetailResponse> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/scores/${scoreId}`
    );

    const backendData = response.data.data || {};
    return {
      score: mapScoreResponse(backendData.score || backendData),
      interviewer_name: backendData.interviewer_name || undefined,
      candidate_name: backendData.candidate_name || undefined,
    };
  }

  async adminModifyScore(
    scoreId: string,
    data: AdminModifyScoreRequest
  ): Promise<AdminModifyScoreResult> {
    const response = await apiClient.put<ApiResponse<any>>(
      `/scores/${scoreId}/admin-modify`,
      data
    );

    const backendData = response.data.data || {};
    return {
      message: backendData.message || response.data.message || '评分修改成功',
      score: mapScoreResponse(backendData.score || backendData),
    };
  }

  async adminDeleteScore(scoreId: string): Promise<void> {
    await apiClient.delete(`/scores/${scoreId}/admin-delete`);
  }

  /**
   * 提交评分
   * @param sessionId 场次ID
   * @param candidateId 候选人ID
   * @param data 提交请求数据
   */
  async submitScore(
    sessionId: string,
    candidateId: string,
    data: SubmitScoreRequest
  ): Promise<ScoreResponse> {
    const response = await apiClient.post<ApiResponse<ScoreResponse>>(
      `/interviewer/sessions/${sessionId}/candidates/${candidateId}/scores/submit`,
      data
    );
    return response.data.data!;
  }

  /**
   * 获取我的评分历史
   * @param params 查询参数
   */
  async getMyScoreHistory(
    params?: ScoreHistoryParams
  ): Promise<PaginatedResponse<ScoreHistoryItem>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ScoreHistoryItem>>>(
      '/interviewer/scores/history',
      { params }
    );
    return response.data.data!;
  }

  /**
   * 获取场次统计数据
   * @param sessionId 场次ID
   */
  async getSessionStats(sessionId: string): Promise<SessionStatsResponse> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/interviewer/sessions/${sessionId}/stats`
    );
    
    // 数据适配：确保返回的数据结构符合前端期望
    const backendData = response.data.data;
    const sessionInfo = backendData?.session_info || {};
    const overallStats = backendData?.overall_stats || {};
    const myStats = backendData?.my_stats || {};
    
    return {
      session: {
        id: sessionInfo.session_id || sessionId,
        name: sessionInfo.name || '',
        position: sessionInfo.position || '',
        date: sessionInfo.date || '',
      },
      progress: {
        total_candidates: overallStats.total_candidates || 0,
        scored_candidates: overallStats.completed_scores || 0,
        pending_candidates: (overallStats.total_candidates || 0) - (overallStats.completed_scores || 0),
        completion_rate: overallStats.completion_rate || 0,
      },
      dimension_averages: backendData?.dimension_averages || [],
      top_candidates: (backendData?.top_candidates || []).map((candidate: any) => ({
        candidate_id: candidate.candidate_id || candidate.id,
        candidate_name: candidate.candidate_name || candidate.name,
        candidate_avatar: candidate.candidate_avatar || candidate.avatar || null,
        average_score: candidate.average_score || 0,
        score_count: candidate.score_count || candidate.scores_count || 0,
      })),
      overall_stats: {
        average_total_score: overallStats.average_score || 0,
        max_total_score: overallStats.max_score || 0,
        min_total_score: overallStats.min_score || 0,
        std_dev: overallStats.std_dev || 0,
      },
    };
  }
}

// 导出单例
export const scoreService = new ScoreService();
export default scoreService;
