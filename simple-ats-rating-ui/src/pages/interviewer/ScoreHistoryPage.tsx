/**
 * 评分历史页面
 * 显示我的所有评分记录
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScoreHistoryCard } from '@/components/interviewer';
import { EmptyState, Loading } from '@/components/common';
import { Search, RefreshCw } from 'lucide-react';
import { scoreService } from '@/services/score.service';

/**
 * 评分历史页面
 */
export const ScoreHistoryPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // 获取评分历史
  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['scoreHistory', statusFilter, searchKeyword, page],
    queryFn: () =>
      scoreService.getMyScoreHistory({
        page,
        page_size: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        keyword: searchKeyword || undefined,
      }),
  });

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPage(1);
  };

  /**
   * 处理状态过滤
   */
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  if (isLoading) {
    return <Loading />;
  }

  const totalPages = historyData?.total_pages || 0;
  const hasHistory = historyData && historyData.items.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">评分历史</h1>
          <p className="text-muted-foreground mt-1">
            查看我的所有评分记录
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="submitted">已提交</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索候选人姓名..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {historyData && (
          <div className="text-sm text-muted-foreground">
            共 {historyData.total} 条记录
          </div>
        )}
      </div>

      {/* 评分历史列表 */}
      {!hasHistory ? (
        <EmptyState
          title="暂无评分记录"
          description={
            searchKeyword
              ? '未找到匹配的评分记录'
              : '您还没有进行过评分'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyData.items.map((score) => (
              <ScoreHistoryCard key={score.score_id} score={score} />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-10"
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScoreHistoryPage;
