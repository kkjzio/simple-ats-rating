import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SessionFilters, SessionTable } from '@/components/admin/sessions';
import type { SessionFiltersValue } from '@/components/admin/sessions/SessionFilters';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { sessionService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { SessionStatus, SessionQueryParams } from '@/types';

export function SessionListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [filters, setFilters] = useState<SessionFiltersValue>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const queryParams: SessionQueryParams = {
    page,
    page_size: pageSize,
    keyword: filters.keyword,
    status: filters.status === 'all' ? undefined : filters.status,
    date_from: filters.dateFrom,
    date_to: filters.dateTo,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions', queryParams],
    queryFn: () => sessionService.getSessions(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: sessionService.deleteSession,
    onSuccess: () => {
      success('场次删除成功', '删除成功');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => {
      error('删除场次失败，请重试', '删除失败');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      sessionService.updateSessionStatus(id, status),
    onSuccess: () => {
      success('状态更新成功', '更新成功');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => {
      error('状态更新失败', '更新失败');
    },
  });

  const handleFiltersChange = (newFilters: SessionFiltersValue) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleCreate = () => {
    navigate('/admin/sessions/create');
  };

  const handleEdit = (session: any) => {
    navigate(`/admin/sessions/${session.id}/edit`);
  };

  const handleDelete = (sessionId: string) => {
    deleteMutation.mutate(sessionId);
  };

  const handleStatusChange = (sessionId: string, status: SessionStatus) => {
    updateStatusMutation.mutate({ id: sessionId, status });
  };

  const handleViewInterviewers = (sessionId: string) => {
    navigate(`/admin/sessions/${sessionId}/interviewers`);
  };

  const handleViewQRCode = (sessionId: string) => {
    navigate(`/admin/sessions/${sessionId}?tab=qrcode`);
  };

  const handleManageCandidates = (sessionId: string) => {
    navigate(`/admin/candidates?sessionId=${sessionId}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value, 10));
    setPage(1);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <EmptyState
        title="加载失败"
        description="无法加载场次列表，请刷新页面重试"
      />
    );
  }

  const sessions = data?.items || [];
  const totalPages = data?.total_pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">场次管理</h1>
          <p className="text-muted-foreground">
            管理面试场次信息，包括筛选、编辑、状态变更和候选人管理
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          创建场次
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
          <CardDescription>按需筛选场次列表</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionFilters
            value={filters}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>场次列表</CardTitle>
              <CardDescription>
                共 {data?.total || 0} 个场次
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">每页显示</span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <EmptyState
              title="暂无场次"
              description="当前没有符合条件的场次，您可以调整筛选条件或创建新场次"
            />
          ) : (
            <>
              <SessionTable
                sessions={sessions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onViewInterviewers={handleViewInterviewers}
                onViewQRCode={handleViewQRCode}
                onManageCandidates={handleManageCandidates}
              />

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    第 {page} 页，共 {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionListPage;
