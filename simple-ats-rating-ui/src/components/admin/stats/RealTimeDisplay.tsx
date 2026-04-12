/**
 * 实时大屏展示组件
 * 全屏模式显示实时评分数据，支持自动刷新
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { DashboardResponse } from '@/types/score';
import DimensionRadarChart from './DimensionRadarChart';
import ScoreDistributionChart from './ScoreDistributionChart';

export interface RealTimeDisplayProps {
  /** 大屏数据 */
  data: DashboardResponse;
  /** 是否全屏 */
  isFullscreen?: boolean;
  /** 刷新间隔（秒） */
  refreshInterval?: number;
  /** 是否自动刷新 */
  autoRefresh?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 退出回调 */
  onExit?: () => void;
  /** 切换全屏回调 */
  onToggleFullscreen?: () => void;
}

/**
 * RealTimeDisplay - 实时大屏展示组件
 */
export const RealTimeDisplay: React.FC<RealTimeDisplayProps> = ({
  data,
  isFullscreen = false,
  refreshInterval = 10,
  autoRefresh = true,
  onRefresh,
  onExit,
  onToggleFullscreen,
}) => {
  const [countdown, setCountdown] = useState(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 自动刷新倒计时
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval]);

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh?.();
    setCountdown(refreshInterval);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [isRefreshing, onRefresh, refreshInterval]);

  // ESC键退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onExit?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExit]);

  // 进度环形图数据
  const progressData = [
    { name: '已评分', value: data.progress.scored_candidates },
    { name: '待评分', value: data.progress.total_candidates - data.progress.scored_candidates },
  ];

  const COLORS = ['#22c55e', '#e5e7eb'];

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-50 via-white to-purple-50',
        isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : 'rounded-lg border'
      )}
    >
      {/* 顶部控制栏 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.session.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {data.session.position} · {data.session.date}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 刷新倒计时 */}
          {autoRefresh && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              <span>
                {isRefreshing ? '刷新中...' : `${countdown}秒后自动刷新`}
              </span>
            </div>
          )}
          {/* 手动刷新 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            刷新
          </Button>
          {/* 全屏切换 */}
          <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {/* 退出 */}
          {onExit && (
            <Button variant="outline" size="sm" onClick={onExit}>
              <X className="h-4 w-4 mr-2" />
              退出
            </Button>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="p-6 space-y-6">
        {/* 第一行：关键指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-600 mb-2">总候选人数</div>
            <div className="text-3xl font-bold text-gray-900">
              {data.progress.total_candidates}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-600 mb-2">已评分数</div>
            <div className="text-3xl font-bold text-green-600">
              {data.progress.scored_candidates}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-600 mb-2">评分进度</div>
            <div className="text-3xl font-bold text-blue-600">
              {data.progress.completion_rate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-sm text-gray-600 mb-2">总评分数</div>
            <div className="text-3xl font-bold text-purple-600">
              {data.progress.total_scores}
            </div>
          </div>
        </div>

        {/* 第二行：进度环形图 + Top10排行 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 进度环形图 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评分进度</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.value}`}
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top10排行榜 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 排行榜</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {data.top_rankings.slice(0, 10).map((item) => (
                <div
                  key={item.candidate_id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 w-8 text-center">
                    {item.rank <= 3 ? (
                      <Badge
                        className={cn(
                          item.rank === 1 && 'bg-yellow-500',
                          item.rank === 2 && 'bg-gray-400',
                          item.rank === 3 && 'bg-amber-600'
                        )}
                      >
                        {item.rank}
                      </Badge>
                    ) : (
                      <span className="text-gray-600 font-medium">{item.rank}</span>
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.candidate_avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {item.candidate_name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {item.candidate_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.score_count} 个评分
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {item.average_score.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 第三行：维度雷达图 + 分数分布 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DimensionRadarChart
            data={data.dimension_radar}
            title="维度平均分雷达图"
            height={350}
          />
          <ScoreDistributionChart
            data={data.score_distribution}
            title="分数分布"
            height={350}
          />
        </div>

        {/* 第四行：评委进度 */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">评委评分进度</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.interviewer_progress.map((interviewer) => (
              <div key={interviewer.interviewer_id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">
                    {interviewer.interviewer_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {interviewer.completed}/{interviewer.total}
                  </div>
                </div>
                <Progress value={interviewer.progress_rate} className="h-2" />
                <div className="text-xs text-gray-500 mt-2 text-right">
                  {interviewer.progress_rate.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最后更新时间 */}
        <div className="text-center text-sm text-gray-500">
          最后更新: {new Date(data.last_updated).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDisplay;
