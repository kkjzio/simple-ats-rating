/**
 * 场次统计卡片组件
 * 显示场次评分统计信息
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface SessionStatsCardProps {
  /** 统计数据 */
  stats: {
    /** 总候选人数 */
    total_candidates: number;
    /** 已评分候选人数 */
    scored_candidates: number;
    /** 未评分候选人数 */
    pending_candidates: number;
    /** 完成率 */
    completion_rate: number;
    /** 平均总分（可选） */
    average_total_score?: number;
  };
}

/**
 * 场次统计卡片组件
 */
export const SessionStatsCard: React.FC<SessionStatsCardProps> = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">评分进度</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">整体完成度</span>
            <span className="font-semibold">{stats.completion_rate.toFixed(1)}%</span>
          </div>
          <Progress value={stats.completion_rate} className="h-2" />
        </div>

        {/* 统计数据网格 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 总候选人数 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">总人数</p>
              <p className="text-lg font-semibold">{stats.total_candidates}</p>
            </div>
          </div>

          {/* 已完成 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">已完成</p>
              <p className="text-lg font-semibold">{stats.scored_candidates}</p>
            </div>
          </div>

          {/* 待评分 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">待评分</p>
              <p className="text-lg font-semibold">{stats.pending_candidates}</p>
            </div>
          </div>

          {/* 平均分 */}
          {stats.average_total_score !== undefined && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">平均分</p>
                <p className="text-lg font-semibold">{stats.average_total_score.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionStatsCard;
