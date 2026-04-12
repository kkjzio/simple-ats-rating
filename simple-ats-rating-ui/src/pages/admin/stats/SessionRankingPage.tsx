/**
 * 候选人排名页面
 * 显示详细的候选人排名和对比功能
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loading } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { CandidateRankingTable, DimensionRadarChart } from '@/components/admin/stats';
import { getSessionRanking } from '@/services/session.service';
import type { CandidateRankingResponse, RankingQueryParams } from '@/types/score';

/**
 * SessionRankingPage - 候选人排名页面
 */
export const SessionRankingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [filterOpen, setFilterOpen] = useState(false);

  // 查询参数
  const [params, setParams] = useState<RankingQueryParams>({
    page: 1,
    page_size: 20,
    sort_by: 'weighted_total_score',
    sort_order: 'desc',
  });

  // 筛选参数
  const [minScore, setMinScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('');

  // 对比选择
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  // 获取排名数据
  const {
    data: ranking,
    isLoading,
    error,
  } = useQuery<CandidateRankingResponse>({
    queryKey: ['session-ranking', id, params],
    queryFn: () => getSessionRanking(id!, params),
    enabled: !!id,
  });

  // 处理排序
  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setParams((prev) => ({
      ...prev,
      sort_by: field,
      sort_order: order,
    }));
  };

  // 应用筛选
  const handleApplyFilter = () => {
    setParams((prev) => ({
      ...prev,
      min_score: minScore ? parseFloat(minScore) : undefined,
      max_score: maxScore ? parseFloat(maxScore) : undefined,
      page: 1,
    }));
  };

  // 重置筛选
  const handleResetFilter = () => {
    setMinScore('');
    setMaxScore('');
    setParams((prev) => ({
      ...prev,
      min_score: undefined,
      max_score: undefined,
      page: 1,
    }));
  };

  // 处理导出
  const handleExport = () => {
    success('正在准备导出排名数据...', '导出排名');
    // TODO: 实现导出功能
  };

  // 切换候选人对比
  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 3) {
        showError('请先取消已选择的候选人', '最多选择3个候选人');
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  if (isLoading) {
    return <Loading text="加载排名数据..." />;
  }

  if (error || !ranking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">加载排名数据失败</p>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
      </div>
    );
  }

  // 获取选中候选人的数据用于对比
  const comparisonCandidates = ranking.rankings.filter((c) =>
    selectedCandidates.includes(c.candidate_id)
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">候选人排名</h1>
            <p className="text-gray-600 mt-1">共 {ranking.total} 人</p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* 筛选按钮 */}
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>筛选条件</DialogTitle>
                <DialogDescription>设置分数范围等筛选条件</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>最低分</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                  />
                </div>
                <div>
                  <Label>最高分</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => { handleApplyFilter(); setFilterOpen(false); }} className="flex-1">
                    应用筛选
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { handleResetFilter(); setFilterOpen(false); }}
                    className="flex-1"
                  >
                    重置
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出排名
          </Button>
        </div>
      </div>

      {/* 候选人对比 */}
      {comparisonCandidates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              候选人对比 ({comparisonCandidates.length}/3)
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCandidates([])}
            >
              清除选择
            </Button>
          </div>
          <DimensionRadarChart
            data={
              comparisonCandidates[0]?.dimension_scores.map((d) => ({
                dimension_name: d.dimension_name,
                average_score: d.score,
                max_possible: 100,
              })) || []
            }
            title="维度对比"
            height={350}
          />
        </div>
      )}

      {/* 排名表格 */}
      <CandidateRankingTable
        rankings={ranking.rankings}
        onSort={handleSort}
        onExport={handleExport}
        onCandidateClick={toggleCandidateSelection}
      />

      {/* 分页 */}
      {ranking.total > ranking.page_size && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={params.page === 1}
            onClick={() => setParams((prev) => ({ ...prev, page: prev.page! - 1 }))}
          >
            上一页
          </Button>
          <div className="flex items-center px-4">
            第 {params.page} 页
          </div>
          <Button
            variant="outline"
            disabled={params.page! * ranking.page_size >= ranking.total}
            onClick={() => setParams((prev) => ({ ...prev, page: prev.page! + 1 }))}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

export default SessionRankingPage;
