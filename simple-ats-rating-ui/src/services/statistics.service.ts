/**
 * 统计分析服务
 * 提供管理概览等全局统计接口
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';

/**
 * 概览场次条目
 */
export interface OverviewSessionItem {
  id: string;
  name: string;
  status: string;
  date: string;
  candidate_count: number;
  interviewer_count: number;
  score_count: number;
  created_at: string;
}

/**
 * 管理概览响应
 */
export interface OverviewResponse {
  total_users: number;
  total_sessions: number;
  total_candidates: number;
  total_scores: number;
  sessions: OverviewSessionItem[];
}

/**
 * 获取管理概览数据（超管专用）
 * 对应后端 GET /api/v1/overview
 */
export const getAdminOverview = async (): Promise<OverviewResponse> => {
  const response: AxiosResponse<OverviewResponse> = await apiClient.get('/overview');
  return response.data;
};

export const exportScoresBySessions = async (sessionIds: string[]): Promise<Blob> => {
  const response = await apiClient.post(
    '/exports/stats/scores',
    { session_ids: sessionIds },
    { responseType: 'blob' }
  );
  return response.data;
};

export const exportSessionScoreDetail = async (sessionId: string): Promise<Blob> => {
  const response = await apiClient.post(
    `/exports/stats/sessions/${sessionId}/scores-detail`,
    undefined,
    { responseType: 'blob' }
  );
  return response.data;
};

export const downloadExcelBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const statisticsService = {
  getAdminOverview,
  exportScoresBySessions,
  exportSessionScoreDetail,
  downloadExcelBlob,
};

export default statisticsService;