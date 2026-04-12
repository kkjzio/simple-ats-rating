/**
 * 维度雷达图组件
 * 使用Recharts绘制维度评分雷达图
 */

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DimensionData {
  /** 维度名称 */
  dimension_name: string;
  /** 平均分 */
  average_score: number;
  /** 满分 */
  max_possible?: number;
}

export interface DimensionRadarChartProps {
  /** 维度数据 */
  data: DimensionData[];
  /** 图表标题 */
  title?: string;
  /** 是否显示满分线 */
  showMaxLine?: boolean;
  /** 高度 */
  height?: number;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * DimensionRadarChart - 维度雷达图组件
 */
export const DimensionRadarChart: React.FC<DimensionRadarChartProps> = ({
  data,
  title = '维度分析',
  showMaxLine = true,
  height = 400,
  loading = false,
}) => {
  // 转换数据格式用于雷达图
  const chartData = data.map((item) => ({
    dimension: item.dimension_name,
    实际得分: item.average_score,
    满分: item.max_possible || 100,
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center bg-gray-100 animate-pulse rounded"
            style={{ height }}
          >
            <span className="text-gray-400">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center bg-gray-50 rounded"
            style={{ height }}
          >
            <span className="text-gray-400">暂无数据</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'dataMax']}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Radar
              name="实际得分"
              dataKey="实际得分"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            {showMaxLine && (
              <Radar
                name="满分"
                dataKey="满分"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.1}
                strokeDasharray="5 5"
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value) => (value ? Number(value).toFixed(2) : '0.00')}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DimensionRadarChart;
