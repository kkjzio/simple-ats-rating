/**
 * 分数分布图组件
 * 使用Recharts绘制分数分布柱状图
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScoreDistribution } from '@/types/score';

export interface ScoreDistributionChartProps {
  /** 分数分布数据 */
  data: ScoreDistribution[];
  /** 图表标题 */
  title?: string;
  /** 高度 */
  height?: number;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * ScoreDistributionChart - 分数分布图组件
 */
export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  title = '分数分布',
  height = 350,
  loading = false,
}) => {
  // 柱状图颜色
  const getBarColor = (index: number) => {
    const colors = [
      '#ef4444', // 红色 - 低分
      '#f97316', // 橙色
      '#f59e0b', // 黄色
      '#84cc16', // 黄绿
      '#22c55e', // 绿色 - 高分
      '#10b981', // 深绿
    ];
    return colors[index % colors.length];
  };

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

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{data.range}</p>
          <p className="text-sm text-gray-600">
            人数: <span className="font-bold text-blue-600">{data.count}</span>
          </p>
          <p className="text-sm text-gray-600">
            占比: <span className="font-bold text-blue-600">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="range"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#d1d5db' }}
              label={{
                value: '人数',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#6b7280', fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar
              dataKey="count"
              name="人数"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ScoreDistributionChart;
