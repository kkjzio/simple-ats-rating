/**
 * 场次候选人列表页面
 * 显示当前场次的所有候选人和评分进度
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateCard, SessionStatsCard } from '@/components/interviewer';
import { EmptyState, Loading } from '@/components/common';
import { ArrowLeft, Search } from 'lucide-react';
import { scoreService } from '@/services/score.service';

/**
 * 场次候选人列表页面
 */
export const SessionCandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 获取候选人列表
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['myCandidates', sessionId],
    queryFn: () => scoreService.getMyCandidates(sessionId!),
    enabled: !!sessionId,
  });

  /**
   * 开始评分
   */
  const handleScore = (candidateId: string) => {
    navigate(`/interviewer/candidates/${candidateId}/score`);
  };

  /**
   * 返回场次列表
   */
  const handleBack = () => {
    navigate('/interviewer/sessions');
  };

  // 过滤候选人
  const filteredCandidates = React.useMemo(() => {
    if (!candidatesData?.candidates) return [];
    
    let filtered = candidatesData.candidates;
    
    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.score_status === statusFilter);
    }
    
    // 搜索过滤
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter((c) =>
        c.candidate_name.toLowerCase().includes(keyword)
      );
    }
    
    return filtered;
  }, [candidatesData, statusFilter, searchKeyword]);

  if (isLoading) {
    return <Loading />;
  }

  if (!candidatesData) {
    return (
      <EmptyState
        title="场次不存在"
        description="未找到该场次信息"
        actionText="返回场次列表"
        onAction={handleBack}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{candidatesData.session_name}</h1>
          <p className="text-muted-foreground mt-1">
            待评候选人列表
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <SessionStatsCard
        stats={{
          total_candidates: candidatesData.total,
          scored_candidates: candidatesData.completed,
          pending_candidates: candidatesData.total - candidatesData.completed,
          completion_rate: candidatesData.total > 0 
            ? (candidatesData.completed / candidatesData.total) * 100 
            : 0,
        }}
      />

      {/* 筛选和搜索 */}
      <div className="flex items-center gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">
              全部 ({candidatesData.total})
            </TabsTrigger>
            <TabsTrigger value="pending">
              未评分 ({candidatesData.total - candidatesData.completed - candidatesData.draft})
            </TabsTrigger>
            <TabsTrigger value="draft">
              草稿 ({candidatesData.draft})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              已提交 ({candidatesData.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索候选人姓名..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 候选人列表 */}
      {filteredCandidates.length === 0 ? (
        <EmptyState
          title="暂无候选人"
          description={
            searchKeyword
              ? '未找到匹配的候选人'
              : statusFilter === 'all'
              ? '该场次暂无候选人'
              : '该筛选条件下暂无候选人'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.candidate_id}
              candidate={candidate}
              onScore={handleScore}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionCandidatesPage;
