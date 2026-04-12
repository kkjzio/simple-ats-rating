/**
 * 统计卡片组件
 * 显示单个统计指标，支持趋势指示器和图标展示
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  /** 标题 */
  title: string;
  /** 数值 */
  value: string | number;
  /** 描述 */
  description?: string;
  /** 图标 */
  icon?: LucideIcon;
  /** 趋势（上升/下降/持平） */
  trend?: 'up' | 'down' | 'neutral';
  /** 趋势百分比 */
  trendValue?: string;
  /** 卡片颜色主题 */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** 是否可点击 */
  onClick?: () => void;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * StatsCard - 统计卡片组件
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  onClick,
  loading = false,
}) => {
  // 趋势图标
  const TrendIcon = trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : MinusIcon;

  // 趋势颜色
  const trendColor =
    trend === 'up'
      ? 'text-green-600'
      : trend === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  // 卡片颜色
  const variantStyles = {
    default: 'border-gray-200 hover:border-gray-300',
    success: 'border-green-200 bg-green-50/50 hover:border-green-300',
    warning: 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-300',
    danger: 'border-red-200 bg-red-50/50 hover:border-red-300',
    info: 'border-blue-200 bg-blue-50/50 hover:border-blue-300',
  };

  const iconStyles = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md',
        loading && 'opacity-50 pointer-events-none'
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && <Icon className={cn('h-5 w-5', iconStyles[variant])} />}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          )}
          
          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && trendValue && (
                <div className={cn('flex items-center gap-1', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="font-medium">{trendValue}</span>
                </div>
              )}
              {description && (
                <span className="text-gray-500">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
