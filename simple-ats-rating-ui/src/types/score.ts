/**
 * 评分相关类型定义
 */

/**
 * 维度评分Schema
 */
export interface DimensionScoreSchema {
  /** 维度名称 */
  dimension_name: string;
  /** 原始得分 */
  score: number;
}

/**
 * 文本评语Schema
 */
export interface TextFeedbackSchema {
  /** 评语字段名 */
  field_name: string;
  /** 评语内容 */
  content: string;
}

/**
 * 维度评分
 */
export interface DimensionScore {
  /** 维度名称 */
  dimension_name: string;
  /** 原始得分 */
  score: number;
  /** 加权得分 */
  weighted_score?: number;
}

/**
 * 文本评语
 */
export interface TextFeedback {
  /** 评语字段名 */
  field_name: string;
  /** 评语内容 */
  content: string;
}

/**
 * 评分响应
 */
export interface ScoreResponse {
  /** 评分ID */
  id: string;
  /** 场次ID */
  session_id: string;
  /** 候选人ID */
  candidate_id: string;
  /** 评委ID */
  interviewer_id: string;
  /** 评委姓名 */
  interviewer_name?: string;
  /** 维度评分列表 */
  dimension_scores: DimensionScore[];
  /** 文本评语列表 */
  text_feedbacks?: TextFeedback[];
  /** 总分 */
  total_score: number;
  /** 状态（draft/submitted） */
  status: string;
  /** 是否为极端分 */
  is_extreme?: boolean;
  /** 提交时间 */
  submitted_at?: string | null;
  /** 修改原因（超管修改时） */
  modify_reason?: string | null;
  /** 修改人ID */
  modified_by?: string | null;
  /** 修改时间 */
  modified_at?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 保存草稿请求
 */
export interface SaveScoreDraftRequest {
  /** 各维度得分 */
  dimension_scores: DimensionScoreSchema[];
  /** 文本评语 */
  text_feedbacks?: TextFeedbackSchema[];
}

/**
 * 提交评分请求（使用已保存的草稿）
 */
export interface SubmitScoreRequest {
  /** 评分ID */
  score_id: string;
}

/**
 * 超管修改评分请求
 */
export interface AdminModifyScoreRequest {
  /** 各维度得分 */
  dimension_scores: DimensionScoreSchema[];
  /** 文本评语 */
  text_feedbacks?: TextFeedbackSchema[];
  /** 修改原因 */
  modify_reason: string;
}

/**
 * 我的候选人项
 */
export interface MyCandidateItem {
  /** 候选人ID */
  candidate_id: string;
  /** 候选人姓名 */
  candidate_name: string;
  /** 候选人头像 */
  candidate_avatar?: string | null;
  /** 面试顺序 */
  order: number;
  /** 评分ID（如果已评分） */
  score_id?: string | null;
  /** 评分状态（pending/draft/submitted） */
  score_status: string;
  /** 总分（如果已评分） */
  total_score?: number | null;
  /** 最后更新时间 */
  updated_at?: string | null;
}

/**
 * 我的候选人列表响应
 */
export interface MyCandidatesResponse {
  /** 场次ID */
  session_id: string;
  /** 场次名称 */
  session_name: string;
  /** 候选人列表 */
  candidates: MyCandidateItem[];
  /** 总数 */
  total: number;
  /** 已完成数 */
  completed: number;
  /** 草稿数 */
  draft: number;
}

/**
 * 候选人所有评分响应
 */
export interface CandidateScoresResponse {
  /** 候选人信息 */
  candidate: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  /** 评分列表 */
  scores: ScoreResponse[];
  /** 统计信息 */
  statistics: {
    /** 平均分 */
    average_score: number;
    /** 最高分 */
    max_score: number;
    /** 最低分 */
    min_score: number;
    /** 标准差 */
    std_dev: number;
    /** 评分数量 */
    count: number;
  };
}

export interface AdminModifyScoreResult {
  message: string;
  score: ScoreResponse;
}

export interface AdminScoreDetailResponse {
  score: ScoreResponse;
  interviewer_name?: string;
  candidate_name?: string;
}

/**
 * 评分查询参数
 */
export interface ScoreQueryParams {
  /** 状态过滤 */
  status?: string;
}

/**
 * 候选人排名项
 */
export interface CandidateRankingItem {
  /** 候选人ID */
  candidate_id: string;
  /** 候选人姓名 */
  candidate_name: string;
  /** 候选人头像 */
  candidate_avatar?: string | null;
  /** 排名 */
  rank: number;
  /** 各维度得分 */
  dimension_scores: DimensionScore[];
  /** 加权总分 */
  weighted_total_score: number;
  /** 平均分 */
  average_score: number;
  /** 评分数量 */
  score_count: number;
  /** 最高分 */
  max_score: number;
  /** 最低分 */
  min_score: number;
}

/**
 * 候选人排名响应
 */
export interface CandidateRankingResponse {
  /** 排名列表 */
  rankings: CandidateRankingItem[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  page_size: number;
}

/**
 * 排名查询参数
 */
export interface RankingQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 排序字段 */
  sort_by?: string;
  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
  /** 最低分过滤 */
  min_score?: number;
  /** 最高分过滤 */
  max_score?: number;
}

/**
 * 分数分布数据
 */
export interface ScoreDistribution {
  /** 分数区间 */
  range: string;
  /** 人数 */
  count: number;
  /** 百分比 */
  percentage: number;
}

/**
 * 评委统计项
 */
export interface InterviewerStatsItem {
  /** 评委ID */
  interviewer_id: string;
  /** 评委姓名 */
  interviewer_name: string;
  /** 已评数量 */
  scored_count: number;
  /** 总候选人数 */
  total_candidates: number;
  /** 平均评分时间（秒） */
  avg_score_time: number;
  /** 平均给分 */
  avg_score: number;
  /** 评分进度 */
  progress_rate: number;
}

/**
 * 场次统计响应（超管版）
 */
export interface SessionStatsResponse {
  /** 场次信息 */
  session: {
    id: string;
    name: string;
    position: string;
    date: string;
    status: string;
  };
  /** 统计概览 */
  overview: {
    total_candidates: number;
    scored_candidates: number;
    pending_candidates: number;
    total_interviewers: number;
    active_interviewers: number;
    completion_rate: number;
  };
  /** 分数统计 */
  score_stats: {
    average_score: number;
    max_score: number;
    min_score: number;
    std_dev: number;
    median_score: number;
  };
  /** 各维度平均分 */
  dimension_averages: Array<{
    dimension_name: string;
    average_score: number;
    max_possible: number;
    weight: number;
  }>;
  /** 分数分布 */
  score_distribution: ScoreDistribution[];
  /** Top候选人 */
  top_candidates: CandidateRankingItem[];
  /** 评委统计 */
  interviewer_stats: InterviewerStatsItem[];
}

/**
 * 实时大屏数据响应
 */
export interface DashboardResponse {
  /** 场次信息 */
  session: {
    id: string;
    name: string;
    position: string;
    date: string;
    status: string;
  };
  /** 实时进度 */
  progress: {
    total_candidates: number;
    scored_candidates: number;
    completion_rate: number;
    total_scores: number;
  };
  /** Top 10排行榜 */
  top_rankings: Array<{
    rank: number;
    candidate_id: string;
    candidate_name: string;
    candidate_avatar?: string | null;
    average_score: number;
    score_count: number;
  }>;
  /** 维度雷达数据 */
  dimension_radar: Array<{
    dimension_name: string;
    average_score: number;
    max_score: number;
  }>;
  /** 分数分布 */
  score_distribution: ScoreDistribution[];
  /** 评委进度 */
  interviewer_progress: Array<{
    interviewer_id: string;
    interviewer_name: string;
    completed: number;
    total: number;
    progress_rate: number;
  }>;
  /** 最后更新时间 */
  last_updated: string;
}
