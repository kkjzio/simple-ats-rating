import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, UserCheck, Star, TrendingUp, BarChart2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { sessionService } from '@/services';
import statisticsService from '@/services/statistics.service';
import type { OverviewResponse } from '@/services/statistics.service';
import type { SessionListResponse } from '@/types';

const SESSION_STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
  active: { label: '进行中', className: 'bg-green-100 text-green-700' },
  completed: { label: '已完成', className: 'bg-blue-100 text-blue-700' },
  archived: { label: '已归档', className: 'bg-yellow-100 text-yellow-700' },
};

const getStatusBadge = (status: string) => {
  const config = SESSION_STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<SessionListResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState<string | undefined>(undefined);
  const pageSize = 6;

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [page, keyword]);

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await statisticsService.getAdminOverview();
      setOverview(data);
    } catch (err) {
      console.error('加载概览数据失败:', err);
      setError('加载数据失败，请刷新后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      const data = await sessionService.getSessions({
        page,
        page_size: pageSize,
        keyword,
      });
      setSessionData(data);
    } catch (err) {
      console.error('加载场次统计列表失败:', err);
      setSessionError('加载场次统计列表失败');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSearch = () => {
    const trimmed = keywordInput.trim();
    setKeyword(trimmed ? trimmed : undefined);
    setPage(1);
  };

  const statCards = [
    {
      title: '用户总数',
      value: overview?.total_users ?? 0,
      icon: Users,
      description: '系统内所有用户',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '场次总数',
      value: overview?.total_sessions ?? 0,
      icon: Calendar,
      description: '全部面试场次',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '候选人总数',
      value: overview?.total_candidates ?? 0,
      icon: UserCheck,
      description: '已导入候选人',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '评分总数',
      value: overview?.total_scores ?? 0,
      icon: Star,
      description: '已提交评分记录',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const quickActions = [
    {
      title: '创建用户',
      description: '新增系统用户账号',
      icon: Users,
      onClick: () => navigate('/admin/users/create'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: '创建场次',
      description: '新增面试场次',
      icon: Calendar,
      onClick: () => navigate('/admin/sessions/create'),
      color: 'from-green-500 to-green-600',
    },
    {
      title: '导入候选人',
      description: '批量导入候选人',
      icon: UserCheck,
      onClick: () => navigate('/admin/candidates/import'),
      color: 'from-purple-500 to-purple-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadOverview}>重新加载</Button>
        </div>
      </div>
    );
  }

  const sessions = sessionData?.items ?? [];
  const totalPages = sessionData?.total_pages ?? 1;
  const total = sessionData?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统概览仪表板</h1>
        <p className="text-gray-600 mt-2">快速查看关键数据与常用操作入口</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-2">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>常用功能快速入口</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 justify-start hover:bg-gray-50"
                  onClick={action.onClick}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} mr-4`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-gray-600">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>场次统计</CardTitle>
              <CardDescription>
                共 {total} 条{keyword ? `，关键字“${keyword}”` : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/sessions')}
            >
              查看全部
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="按场次名称查询"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Button size="sm" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-1" />
                查询
              </Button>
            </div>

            {sessionLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm">加载列表中...</div>
            ) : sessionError ? (
              <div className="text-center py-8 text-red-600 text-sm">{sessionError}</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart2 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-sm">暂无符合条件的场次</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/admin/sessions/${session.id}`)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(session.status)}
                          <span className="text-sm font-medium truncate">{session.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>日期 {session.date}</span>
                          <span>候选人 {session.statistics?.total_candidates ?? 0}</span>
                          <span>评委 {session.statistics?.total_interviewers ?? 0}</span>
                          <span>评分 {session.statistics?.total_scores ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
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

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">系统运行提示</h3>
              <p className="text-sm text-blue-700 mt-1">
                建议定期查看统计分析页，跟踪评分进度和场次完成情况。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
