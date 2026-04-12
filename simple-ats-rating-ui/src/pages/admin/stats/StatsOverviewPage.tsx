import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  ArrowRight,
  Search,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/common';
import { sessionService } from '@/services';
import statisticsService from '@/services/statistics.service';
import { SessionStatus } from '@/types';
import { formatDate } from '@/utils/format';

export type ExportActionType = 'enter-select' | 'cancel' | 'confirm';

export function getExportButtonLabel(
  isExportSelecting: boolean,
  isExporting: boolean,
  selectedCount: number
): string {
  if (!isExportSelecting) return '导出';
  if (isExporting) return '导出中...';
  if (selectedCount > 0) return `确认导出 (${selectedCount})`;
  return '取消';
}

export function getExportActionType(
  isExportSelecting: boolean,
  selectedCount: number
): ExportActionType {
  if (!isExportSelecting) return 'enter-select';
  if (selectedCount === 0) return 'cancel';
  return 'confirm';
}

export const StatsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState<string | undefined>(undefined);
  const [isExportSelecting, setIsExportSelecting] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      keyword,
    }),
    [page, pageSize, keyword]
  );

  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ['stats-overview-sessions', queryParams],
    queryFn: () => sessionService.getSessions(queryParams),
  });

  const { data: overviewData } = useQuery({
    queryKey: ['stats-overview-cards'],
    queryFn: statisticsService.getAdminOverview,
  });

  const handleExportAction = async () => {
    const action = getExportActionType(isExportSelecting, selectedSessionIds.length);
    if (action === 'enter-select') {
      setIsExportSelecting(true);
      setSelectedSessionIds([]);
    } else if (action === 'cancel') {
      setIsExportSelecting(false);
      setSelectedSessionIds([]);
    } else {
      setIsExporting(true);
      try {
        const blob = await statisticsService.exportScoresBySessions(selectedSessionIds);
        statisticsService.downloadExcelBlob(blob, `stats_scores_${Date.now()}.xlsx`);
        setIsExportSelecting(false);
        setSelectedSessionIds([]);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const handleSearch = () => {
    const trimmed = keywordInput.trim();
    setKeyword(trimmed ? trimmed : undefined);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value, 10));
    setPage(1);
  };

  const getStatusBadge = (status: SessionStatus) => {
    const statusConfig: Record<SessionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      [SessionStatus.DRAFT]: { label: '草稿', variant: 'secondary' },
      [SessionStatus.ACTIVE]: { label: '进行中', variant: 'default' },
      [SessionStatus.COMPLETED]: { label: '已完成', variant: 'outline' },
      [SessionStatus.ARCHIVED]: { label: '已归档', variant: 'destructive' },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const stats = useMemo(() => {
    const sessions = overviewData?.sessions ?? [];
    return {
      total: overviewData?.total_sessions ?? sessionsData?.total ?? 0,
      active: sessions.filter((s) => s.status === SessionStatus.ACTIVE).length,
      completed: sessions.filter((s) => s.status === SessionStatus.COMPLETED).length,
      draft: sessions.filter((s) => s.status === SessionStatus.DRAFT).length,
    };
  }, [overviewData, sessionsData]);

  if (isSessionsLoading && !sessionsData) {
    return <Loading text="加载统计分析数据中..." />;
  }

  if (sessionsError || !sessionsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">加载场次统计失败</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  const sessions = sessionsData.items;
  const totalPages = sessionsData.total_pages || 1;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">统计分析</h1>
          <p className="text-gray-600 mt-1">查看场次整体概览与每个场次的详细统计</p>
        </div>
        <Button
          variant={isExportSelecting ? 'default' : 'outline'}
          onClick={handleExportAction}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {getExportButtonLabel(isExportSelecting, isExporting, selectedSessionIds.length)}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">场次总数</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">系统中全部场次</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">当前进行中的场次</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">已完成场次数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">未开始的场次</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>场次统计列表</CardTitle>
              <CardDescription>
                共 {sessionsData.total} 条
                {keyword ? `，当前关键字“${keyword}”` : ''}
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
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="按场次名称查询"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="sm:max-w-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                查询
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setKeywordInput('');
                  setKeyword(undefined);
                  setPage(1);
                }}
              >
                重置
              </Button>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无符合条件的场次</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/admin/sessions/create')}
              >
                创建场次
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isExportSelecting && (
                      <Checkbox
                        className="mr-3"
                        checked={selectedSessionIds.includes(session.id)}
                        onCheckedChange={() => toggleSessionSelection(session.id)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{session.name}</h3>
                        {getStatusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.date)}
                        </span>
                        <span>岗位：{session.position}</span>
                        {session.description && (
                          <span className="truncate max-w-md">{session.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(session.status === SessionStatus.ACTIVE ||
                        session.status === SessionStatus.COMPLETED) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/stats/sessions/${session.id}`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            统计详情
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/stats/sessions/${session.id}/ranking`)}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            排名
                          </Button>
                          {session.status === SessionStatus.ACTIVE && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/stats/sessions/${session.id}/dashboard`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              实时大屏
                            </Button>
                          )}
                        </>
                      )}
                      {session.status === SessionStatus.DRAFT && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/sessions/${session.id}/edit`)}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          编辑场次
                        </Button>
                      )}
                      {session.status === SessionStatus.ARCHIVED && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/sessions/${session.id}`)}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          查看详情
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
};

export default StatsOverviewPage;
