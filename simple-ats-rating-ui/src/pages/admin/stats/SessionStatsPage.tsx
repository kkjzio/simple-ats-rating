/**
 * 场次统计详情页面
 * 显示场次的完整统计信息
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import {
  StatsCard,
  CandidateRankingTable,
  DimensionRadarChart,
  ScoreDistributionChart,
  InterviewerStatsTable,
} from '@/components/admin/stats';
import { getSessionStats, getSessionRanking } from '@/services/session.service';
import statisticsService from '@/services/statistics.service';
import type { SessionStatsResponse, CandidateRankingResponse } from '@/types/score';

/**
 * SessionStatsPage - 场次统计详情页面
 */
export const SessionStatsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  // 获取场次统计数据
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<SessionStatsResponse>({
    queryKey: ['session-stats', id],
    queryFn: () => getSessionStats(id!),
    enabled: !!id,
    refetchInterval: 30000, // 30秒自动刷新
  });

  // 获取Top候选人排名（用于显示在统计详情页）
  const {
    data: topRankings,
    isLoading: isLoadingRankings,
  } = useQuery<CandidateRankingResponse>({
    queryKey: ['session-top-rankings', id],
    queryFn: () => getSessionRanking(id!, { page: 1, page_size: 10 }),
    enabled: !!id,
    refetchInterval: 30000, // 30秒自动刷新
  });

  // 处理导出
  const handleExport = async () => {
    if (!id) return;
    try {
      const blob = await statisticsService.exportSessionScoreDetail(id);
      statisticsService.downloadExcelBlob(blob, `${id}_scores_detail.xlsx`);
      success('导出成功', '导出功能');
    } catch {
      showError('导出失败，请稍后重试', '导出功能');
    }
  };

  // 跳转到排名页面
  const handleViewRanking = () => {
    navigate(`/admin/stats/sessions/${id}/ranking`);
  };

  // 跳转到实时大屏
  const handleViewDashboard = () => {
    navigate(`/admin/stats/sessions/${id}/dashboard`);
  };

  if (isLoading) {
    return <Loading text="加载统计数据..." />;
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">加载统计数据失败</p>
          <Button onClick={() => refetch()}>重试</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/stats')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stats.session.name}</h1>
            <p className="text-gray-600 mt-1">
              {stats.session.position} · {stats.session.date}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleViewRanking}>
            <BarChart3 className="h-4 w-4 mr-2" />
            查看排名
          </Button>
          <Button variant="outline" onClick={handleViewDashboard}>
            <Eye className="h-4 w-4 mr-2" />
            实时大屏
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="总候选人数"
          value={stats.overview.total_candidates}
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="已评分数"
          value={stats.overview.scored_candidates}
          description={`${stats.overview.completion_rate.toFixed(1)}% 完成`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="待评分数"
          value={stats.overview.pending_candidates}
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="活跃评委"
          value={`${stats.overview.active_interviewers}/${stats.overview.total_interviewers}`}
          icon={TrendingUp}
          variant="info"
        />
      </div>

      {/* 分数统计卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>分数统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">平均分</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.score_stats.average_score.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">最高分</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.score_stats.max_score.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">最低分</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.score_stats.min_score.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">中位数</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats.score_stats.median_score.toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">标准差</div>
              <div className="text-2xl font-bold text-gray-600">
                {stats.score_stats.std_dev.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细分析 */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">候选人排名</TabsTrigger>
          <TabsTrigger value="dimensions">维度分析</TabsTrigger>
          <TabsTrigger value="distribution">分数分布</TabsTrigger>
          <TabsTrigger value="interviewers">评委统计</TabsTrigger>
        </TabsList>

        {/* 候选人排名 */}
        <TabsContent value="ranking">
          {isLoadingRankings ? (
            <Loading text="加载排名数据..." />
          ) : (
            <CandidateRankingTable
              rankings={topRankings?.rankings || []}
              onExport={handleExport}
              onCandidateClick={(candidateId) =>
                navigate(`/admin/candidates/${candidateId}`)
              }
            />
          )}
        </TabsContent>

        {/* 维度分析 */}
        <TabsContent value="dimensions">
          <DimensionRadarChart
            data={stats.dimension_averages.map((d) => ({
              dimension_name: d.dimension_name,
              average_score: d.average_score,
              max_possible: d.max_possible,
            }))}
            title="各维度平均分分析"
            height={500}
          />
        </TabsContent>

        {/* 分数分布 */}
        <TabsContent value="distribution">
          <ScoreDistributionChart
            data={stats.score_distribution}
            title="候选人分数分布"
            height={450}
          />
        </TabsContent>

        {/* 评委统计 */}
        <TabsContent value="interviewers">
          <InterviewerStatsTable data={stats.interviewer_stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionStatsPage;
