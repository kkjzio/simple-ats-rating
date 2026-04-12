/**
 * 场次统计页面
 * 显示场次的整体统计信息
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SessionStatsCard } from '@/components/interviewer';
import { EmptyState, Loading } from '@/components/common';
import { ArrowLeft, User, TrendingUp } from 'lucide-react';
import { scoreService } from '@/services/score.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * 场次统计页面
 */
export const SessionStatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  // 获取场次统计
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['sessionStats', sessionId],
    queryFn: () => scoreService.getSessionStats(sessionId!),
    enabled: !!sessionId,
  });

  /**
   * 返回
   */
  const handleBack = () => {
    navigate(`/interviewer/sessions/${sessionId}/candidates`);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!statsData) {
    return (
      <EmptyState
        title="统计数据不存在"
        description="未找到该场次的统计信息"
        actionText="返回"
        onAction={handleBack}
      />
    );
  }

  // 准备维度平均分图表数据
  const dimensionChartData = statsData.dimension_averages.map((dim) => ({
    name: dim.dimension_name,
    平均分: parseFloat(dim.average_score.toFixed(2)),
    满分: dim.max_score,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{statsData.session.name}</h1>
          <p className="text-muted-foreground mt-1">
            {statsData.session.position} · {statsData.session.date}
          </p>
        </div>
      </div>

      {/* 统计概览 */}
      <SessionStatsCard
        stats={{
          total_candidates: statsData.progress.total_candidates,
          scored_candidates: statsData.progress.scored_candidates,
          pending_candidates: statsData.progress.pending_candidates,
          completion_rate: statsData.progress.completion_rate,
          average_total_score: statsData.overall_stats.average_total_score,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 整体统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              整体统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">平均总分</span>
              <span className="text-lg font-bold text-primary">
                {statsData.overall_stats.average_total_score.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">最高分</span>
              <span className="text-lg font-semibold text-green-600">
                {statsData.overall_stats.max_total_score.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">最低分</span>
              <span className="text-lg font-semibold text-red-600">
                {statsData.overall_stats.min_total_score.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">标准差</span>
              <span className="text-lg font-semibold">
                {statsData.overall_stats.std_dev.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 候选人 */}
        <Card>
          <CardHeader>
            <CardTitle>候选人排名 (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statsData.top_candidates.slice(0, 10).map((candidate, index) => (
                <div
                  key={candidate.candidate_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={candidate.candidate_avatar || undefined} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{candidate.candidate_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.score_count} 位评委评分
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {candidate.average_score.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 各维度平均分图表 */}
      <Card>
        <CardHeader>
          <CardTitle>各维度平均分</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dimensionChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="平均分" fill="hsl(var(--primary))" />
              <Bar dataKey="满分" fill="hsl(var(--muted))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionStatsPage;
