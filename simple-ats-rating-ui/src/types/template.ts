/**
 * 评分模板相关类型定义
 */

/**
 * 评分类型枚举
 */
export enum ScoreType {
  /** 整数 */
  INTEGER = 'integer',
  /** 小数 */
  DECIMAL = 'decimal',
  /** 星级 */
  STAR = 'star',
}

/**
 * 维度Schema
 */
export interface DimensionSchema {
  /** 维度名称 */
  name: string;
  /** 权重（0-100） */
  weight: number;
  /** 最高分 */
  max_score: number;
  /** 评分类型 */
  score_type?: ScoreType;
  /** 维度说明 */
  description?: string | null;
}

/**
 * 评分维度
 */
export interface Dimension {
  /** 维度名称 */
  name: string;
  /** 权重（0-100） */
  weight: number;
  /** 最高分 */
  max_score: number;
  /** 评分类型 */
  score_type?: ScoreType;
  /** 维度说明 */
  description?: string | null;
}

/**
 * 评语字段Schema
 */
export interface TextFieldSchema {
  /** 字段名称 */
  name: string;
  /** 是否必填 */
  required?: boolean;
  /** 最大字符数 */
  max_length?: number;
  /** 输入提示 */
  placeholder?: string | null;
}

/**
 * 评语字段
 */
export interface TextField {
  /** 字段名称 */
  name: string;
  /** 是否必填 */
  required?: boolean;
  /** 最大字符数 */
  max_length?: number;
  /** 输入提示 */
  placeholder?: string | null;
}

/**
 * 模板响应
 */
export interface TemplateResponse {
  /** 模板ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string | null;
  /** 评分维度列表 */
  dimensions: Dimension[];
  /** 文本评语字段 */
  text_fields: TextField[];
  /** 是否为默认模板 */
  is_default: boolean;
  /** 是否为系统预置模板 */
  is_system: boolean;
  /** 创建人ID */
  created_by?: string | null;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/**
 * 创建模板请求
 */
export interface CreateTemplateRequest {
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string | null;
  /** 评分维度列表 */
  dimensions: DimensionSchema[];
  /** 文本评语字段 */
  text_fields?: TextFieldSchema[];
}

/**
 * 更新模板请求
 */
export interface UpdateTemplateRequest {
  /** 模板名称 */
  name?: string | null;
  /** 模板描述 */
  description?: string | null;
  /** 评分维度列表 */
  dimensions?: DimensionSchema[] | null;
  /** 文本评语字段 */
  text_fields?: TextFieldSchema[] | null;
}

/**
 * 模板列表响应
 */
export interface TemplateListResponse {
  /** 模板列表 */
  items: TemplateResponse[];
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
 * 模板查询参数
 */
export interface TemplateQueryParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  page_size?: number;
  /** 搜索关键词 */
  keyword?: string | null;
}
