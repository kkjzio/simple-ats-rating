/**
 * 操作日志服务
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type { LogListResponse, LogQueryParams, ApiResponse } from '../types';

/**
 * 获取操作日志列表
 */
export const getLogs = async (params?: LogQueryParams): Promise<LogListResponse> => {
  const response: AxiosResponse<ApiResponse<LogListResponse>> = await apiClient.get('/logs', {
    params,
  });
  return response.data.data!;
};

const logService = {
  getLogs,
};

export default logService;