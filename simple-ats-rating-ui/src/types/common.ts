/**
 * 通用类型定义
 */

/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T | null;
}

/**
 * 成功响应
 */
export interface SuccessResponse<T = any> {
  /** 是否成功 */
  success: true;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  detail?: any;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T = any> {
  /** 数据列表 */
  items: T[];
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
 * 分页查询参数
 */
export interface PaginationParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
}

/**
 * 通用查询参数
 */
export interface QueryParams extends PaginationParams {
  /** 搜索关键词 */
  keyword?: string | null;
  /** 排序字段 */
  sort_by?: string;
  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
}

/**
 * 消息响应
 */
export interface MessageResponse {
  /** 消息内容 */
  message: string;
}

/**
 * ID参数
 */
export interface IdParam {
  /** ID */
  id: string;
}

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  /** 文件URL */
  url: string;
  /** 文件名 */
  filename: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  mime_type: string;
}

/**
 * 统计数据
 */
export interface Statistics {
  /** 总数 */
  total: number;
  /** 已完成数 */
  completed?: number;
  /** 进行中数 */
  in_progress?: number;
  /** 待处理数 */
  pending?: number;
  /** 其他统计字段 */
  [key: string]: any;
}

/**
 * 选项类型
 */
export interface Option<T = string> {
  /** 标签 */
  label: string;
  /** 值 */
  value: T;
  /** 是否禁用 */
  disabled?: boolean;
  /** 其他属性 */
  [key: string]: any;
}

/**
 * 表单字段错误
 */
export interface FieldError {
  /** 字段名 */
  field: string;
  /** 错误消息 */
  message: string;
}

/**
 * 表单验证错误
 */
export interface ValidationError {
  /** 错误消息 */
  message: string;
  /** 字段错误列表 */
  errors?: FieldError[];
}

/**
 * 加载状态
 */
export interface LoadingState {
  /** 是否正在加载 */
  isLoading: boolean;
  /** 错误信息 */
  error?: string | null;
}

/**
 * 异步操作状态
 */
export interface AsyncState<T = any> extends LoadingState {
  /** 数据 */
  data?: T | null;
}

/**
 * Toast通知类型
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Toast通知
 */
export interface Toast {
  /** ID */
  id: string;
  /** 类型 */
  type: ToastType;
  /** 标题 */
  title?: string;
  /** 消息 */
  message: string;
  /** 持续时间（毫秒） */
  duration?: number;
}

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  /** 标题 */
  title: string;
  /** 消息 */
  message: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmType?: 'primary' | 'danger' | 'warning';
}

/**
 * 导出任务状态
 */
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 导出任务
 */
export interface ExportTask {
  /** 任务ID */
  id: string;
  /** 任务类型 */
  type: string;
  /** 状态 */
  status: ExportStatus;
  /** 文件URL */
  file_url?: string | null;
  /** 错误信息 */
  error?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 完成时间 */
  completed_at?: string | null;
}
