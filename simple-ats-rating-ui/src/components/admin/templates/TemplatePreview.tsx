/**
 * 模板预览组件
 * 显示模板的完整信息，包括维度列表、文本字段列表和权重分布可视化
 */

import { Star, FileText, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { TemplateResponse } from '../../../types';
import { formatDate } from '../../../utils/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';

interface TemplatePreviewProps {
  /** 模板数据 */
  template: TemplateResponse;
}

// 图表颜色配置
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

/**
 * 评分类型标签映射
 */
const scoreTypeLabels: Record<string, string> = {
  integer: '整数',
  decimal: '小数',
  star: '星级',
};

/**
 * 模板预览组件
 */
export function TemplatePreview({ template }: TemplatePreviewProps) {
  // 准备权重分布图表数据
  const chartData = template.dimensions.map((dim, index) => ({
    name: dim.name,
    value: dim.weight,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{template.name}</CardTitle>
              <CardDescription>
                {template.description || '暂无描述'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {template.is_default && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3" />
                  默认模板
                </Badge>
              )}
              {template.is_system && (
                <Badge variant="secondary">系统模板</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">维度数量</p>
              <p className="text-lg font-semibold">{template.dimensions.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">文本字段</p>
              <p className="text-lg font-semibold">{template.text_fields.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">创建时间</p>
              <p className="text-lg font-semibold">{formatDate(template.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">更新时间</p>
              <p className="text-lg font-semibold">{formatDate(template.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 评分维度 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            评分维度
          </CardTitle>
          <CardDescription>
            共 {template.dimensions.length} 个维度，权重总和 100%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 维度列表 */}
          <div className="space-y-4">
            {template.dimensions.map((dimension, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-muted/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{dimension.name}</h4>
                    {dimension.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {dimension.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2">
                    权重 {dimension.weight}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>最大分值: {dimension.max_score}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>
                    评分类型: {scoreTypeLabels[dimension.score_type || 'integer']}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 权重分布图 */}
          {template.dimensions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-4">权重分布</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 文本评语字段 */}
      {template.text_fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              文本评语字段
            </CardTitle>
            <CardDescription>
              共 {template.text_fields.length} 个文本字段
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {template.text_fields.map((field, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border bg-muted/50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium">{field.name}</h4>
                    <Badge variant={field.required ? 'default' : 'outline'}>
                      {field.required ? '必填' : '可选'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {field.max_length && (
                      <>
                        <span>最大字符数: {field.max_length}</span>
                        <Separator orientation="vertical" className="h-4" />
                      </>
                    )}
                    {field.placeholder && (
                      <span>提示: {field.placeholder}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
