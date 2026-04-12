/**
 * 操作日志相关类型定义
 */

/**
 * 操作日志响应
 */
export interface OperationLogResponse {
  /** 日志ID */
  id: string;
  /** 操作人ID */
  user_id: string;
  /** 操作类型 */
  action: string;
  /** 资源类型 */
  resource_type: string;
  /** 资源ID */
  resource_id?: string | null;
  /** 详细信息 */
  details: Record<string, any>;
  /** IP地址 */
  ip_address?: string | null;
  /** 浏览器UA */
  user_agent?: string | null;
  /** 创建时间 */
  created_at: string;
}

/**
 * 日志列表响应
 */
export interface LogListResponse {
  /** 日志列表 */
  items: OperationLogResponse[];
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
 * 日志查询参数
 */
export interface LogQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 操作人ID筛选 */
  user_id?: string | null;
  /** 操作类型筛选 */
  action?: string | null;
  /** 资源类型筛选 */
  resource_type?: string | null;
  /** 开始日期 */
  date_from?: string | null;
  /** 结束日期 */
  date_to?: string | null;
}