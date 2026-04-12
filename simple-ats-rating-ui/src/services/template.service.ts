/**
 * 模板服务
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type {
  TemplateResponse,
  TemplateListResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateQueryParams,
  ApiResponse,
} from '../types';

/**
 * 获取模板列表
 */
export const getTemplates = async (params?: TemplateQueryParams): Promise<TemplateListResponse> => {
  const response: AxiosResponse<TemplateListResponse> = await apiClient.get(
    '/templates',
    { params }
  );
  // 后端直接返回数据对象，不是 ApiResponse 包装格式
  return response.data;
};

/**
 * 获取模板详情
 */
export const getTemplateById = async (templateId: string): Promise<TemplateResponse> => {
  const response: AxiosResponse<TemplateResponse> = await apiClient.get(
    `/templates/${templateId}`
  );
  // 后端直接返回数据对象，不是 ApiResponse 包装格式
  return response.data;
};

/**
 * 创建模板
 */
export const createTemplate = async (data: CreateTemplateRequest): Promise<TemplateResponse> => {
  const response: AxiosResponse<TemplateResponse> = await apiClient.post(
    '/templates',
    data
  );
  // 后端直接返回数据对象，不是 ApiResponse 包装格式
  return response.data;
};

/**
 * 更新模板
 */
export const updateTemplate = async (
  templateId: string,
  data: UpdateTemplateRequest
): Promise<TemplateResponse> => {
  const response: AxiosResponse<TemplateResponse> = await apiClient.put(
    `/templates/${templateId}`,
    data
  );
  // 后端直接返回数据对象，不是 ApiResponse 包装格式
  return response.data;
};

/**
 * 删除模板
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  await apiClient.delete(`/templates/${templateId}`);
};

/**
 * 设置默认模板
 */
export const setDefaultTemplate = async (templateId: string): Promise<TemplateResponse> => {
  const response: AxiosResponse<TemplateResponse> = await apiClient.post(
    `/templates/${templateId}/set-default`
  );
  // 后端直接返回数据对象，不是 ApiResponse 包装格式
  return response.data;
};

const templateService = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
};

export default templateService;
