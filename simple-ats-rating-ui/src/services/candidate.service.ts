/**
 * 候选人管理服务
 * 提供候选人的CRUD操作、批量导入、简历上传、顺序调整等功能
 */

import type { AxiosResponse } from 'axios';
import apiClient from './api';
import type {
  CandidateResponse,
  CandidateListResponse,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  CandidateQueryParams,
  ReorderRequest,
  AvailableCandidateUserListResponse,
  AvailableCandidateUserQueryParams,
} from '../types';

/**
 * 获取候选人列表
 * @param sessionId 场次ID
 * @param params 查询参数（分页、搜索、状态筛选）
 */
export const getCandidates = async (
  sessionId: string,
  params?: CandidateQueryParams
): Promise<CandidateListResponse> => {
  const response: AxiosResponse<any> = await apiClient.get(
    `/sessions/${sessionId}/candidates`,
    { params }
  );
  
  // API返回格式: { code, message, data: { items, total, ... } }
  // 需要提取 response.data.data
  const apiData = response.data.data;
  
  // 转换候选人数据结构：将嵌套的user对象扁平化
  if (apiData && apiData.items) {
    apiData.items = apiData.items.map((item: any) => {
      // 如果有user对象，将其字段提取到顶层
      if (item.user) {
        const { user, ...rest } = item;
        return {
          ...rest,
          name: user.name,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          scores_count: rest.scores_count ?? rest.total_scores_count ?? 0,
        };
      }
      return item;
    });
  }
  
  return apiData;
};

/**
 * 获取可添加到场次的候选人用户列表
 * @param sessionId 场次ID
 * @param params 查询参数（分页、关键词）
 */
export const getAvailableCandidateUsers = async (
  sessionId: string,
  params?: AvailableCandidateUserQueryParams
): Promise<AvailableCandidateUserListResponse> => {
  const response: AxiosResponse<any> = await apiClient.get(
    `/sessions/${sessionId}/candidate-users/available`,
    { params }
  );

  return response.data.data;
};

/**
 * 获取候选人详情
 * @param id 候选人ID
 */
export const getCandidateById = async (id: string): Promise<CandidateResponse> => {
  const response: AxiosResponse<any> = await apiClient.get(
    `/candidates/${id}`
  );
  
  // API返回格式: { code, message, data: {...} }
  // 需要提取 response.data.data
  const apiData = response.data.data || response.data;
  
  // 如果有user对象，将其字段提取到顶层
  if (apiData && apiData.user) {
    const { user, ...rest } = apiData;
    return {
      ...rest,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      scores_count: rest.scores_count ?? rest.total_scores_count ?? 0,
    };
  }
  
  return apiData;
};

/**
 * 创建候选人
 * @param sessionId 场次ID
 * @param data 候选人数据
 */
export const createCandidate = async (
  sessionId: string,
  data: CreateCandidateRequest
): Promise<CandidateResponse> => {
  // 添加调试日志
  // console.log('[DEBUG] createCandidate called with:', {
  //   sessionId,
  //   hasResume: !!data.resume,
  //   data: { ...data, resume: data.resume ? 'File object' : null }
  // });

  // 始终使用FormData格式，即使没有简历文件
  const formData = new FormData();
  if (data.user_id) formData.append('user_id', data.user_id);
  if (data.name) formData.append('name', data.name);
  if (data.gender) formData.append('gender', data.gender);
  if (data.phone) formData.append('phone', data.phone);
  if (data.email) formData.append('email', data.email);
  if (data.education) formData.append('education', data.education);
  if (data.work_experience !== undefined && data.work_experience !== null) {
    formData.append('work_experience', data.work_experience.toString());
  }
  if (data.order !== undefined && data.order !== null) {
    formData.append('order', data.order.toString());
  }
  if (data.notes) formData.append('notes', data.notes);
  
  // 多文件简历
  if (data.resumes && data.resumes.length > 0) {
    data.resumes.forEach((file) => formData.append('resumes', file));
  }

  const response: AxiosResponse<CandidateResponse> = await apiClient.post(
    `/sessions/${sessionId}/candidates`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  console.log('[DEBUG] Response received:', response.status);
  return response.data;
};

/**
 * 更新候选人（仅管理员）
 * @param id 候选人ID
 * @param data 更新数据（含可选新增简历文件，追加到已有列表）
 */
export const updateCandidate = async (
  id: string,
  data: UpdateCandidateRequest & { resumes?: File[] | null }
): Promise<CandidateResponse> => {
  const formData = new FormData();
  if (data.order !== undefined && data.order !== null) formData.append('order', data.order.toString());
  if (data.status) formData.append('status', data.status);
  if (data.notes !== undefined && data.notes !== null) formData.append('notes', data.notes);
  if (data.resumes && data.resumes.length > 0) {
    data.resumes.forEach((file) => formData.append('resumes', file));
  }

  const response: AxiosResponse<any> = await apiClient.put(
    `/candidates/${id}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  const apiData = response.data.data || response.data;
  if (apiData && apiData.user) {
    const { user, ...rest } = apiData;
    return { ...rest, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar };
  }
  return apiData;
};

/**
 * 删除候选人
 * @param id 候选人ID
 */
export const deleteCandidate = async (id: string): Promise<void> => {
  await apiClient.delete(`/candidates/${id}`);
};

/**
 * 批量导入候选人
 * @param sessionId 场次ID
 * @param file Excel文件
 */
export const importCandidates = async (
  sessionId: string,
  file: File
): Promise<{ success: number; failed: number; errors?: any[] }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response: AxiosResponse<{
    success: number;
    failed: number;
    errors?: any[];
  }> = await apiClient.post(`/sessions/${sessionId}/candidates/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * 调整候选人顺序
 * @param sessionId 场次ID
 * @param candidateIds 候选人ID列表（按新顺序排列）
 */
export const reorderCandidates = async (
  sessionId: string,
  candidateIds: string[]
): Promise<void> => {
  const orders = candidateIds.map((candidate_id, index) => ({
    candidate_id,
    order: index + 1,
  }));

  const data: ReorderRequest = { orders };
  await apiClient.post(`/sessions/${sessionId}/candidates/reorder`, data);
};

/**
 * 按索引下载候选人的指定简历文件
 * @param candidateId 候选人ID
 * @param fileIndex 文件索引（从0开始）
 * @param filename 保存的文件名
 */
export const downloadResumeByIndex = async (
  candidateId: string,
  fileIndex: number,
  filename?: string
): Promise<void> => {
  const response = await apiClient.get(
    `/candidates/${candidateId}/resumes/${fileIndex}/download`,
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `简历_${fileIndex + 1}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 删除候选人指定简历文件
 * @param candidateId 候选人ID
 * @param fileIndex 文件索引（从0开始）
 */
export const deleteResumeFile = async (
  candidateId: string,
  fileIndex: number
): Promise<CandidateResponse> => {
  const response: AxiosResponse<any> = await apiClient.delete(
    `/candidates/${candidateId}/resumes/${fileIndex}`
  );
  const apiData = response.data.data || response.data;
  if (apiData && apiData.user) {
    const { user, ...rest } = apiData;
    return { ...rest, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar };
  }
  return apiData;
};

/**
 * 下载候选人简历（向后兼容，下载第一个文件）
 * @param candidateId 候选人ID
 * @param filename 保存的文件名
 */
export const downloadResume = async (candidateId: string, filename?: string): Promise<void> => {
  const response = await apiClient.get(`/candidates/${candidateId}/resume/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || '候选人简历';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 下载Excel导入模板
 */
export const downloadTemplate = (): void => {
  // 创建一个简单的CSV模板
  const headers = ['姓名*', '性别', '手机*', '邮箱', '教育背景', '工作经验(年)', '备注'];
  const example = ['张三', '男', '13800138000', 'zhangsan@example.com', '本科', '3', '优秀候选人'];
  
  const csvContent = [
    headers.join(','),
    example.join(','),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', '候选人导入模板.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 导出所有服务方法
const candidateService = {
  getCandidates,
  getAvailableCandidateUsers,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  importCandidates,
  reorderCandidates,
  downloadResumeByIndex,
  deleteResumeFile,
  downloadResume,
  downloadTemplate,
};

export default candidateService;
