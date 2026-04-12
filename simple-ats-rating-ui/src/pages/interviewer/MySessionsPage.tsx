/**
 * 我的场次列表页面
 * 显示评委已绑定的场次列表
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRScanner, SessionCard } from '@/components/interviewer';
import { EmptyState, Loading } from '@/components/common';
import { QrCode, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { scoreService } from '@/services/score.service';
import { SessionStatus } from '@/types/session';
import { filterMySessions } from './mySessions.filter';

/**
 * 我的场次列表页面
 */
export const MySessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  
  const [showScanner, setShowScanner] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 获取我的场次列表
  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['mySessions'],
    queryFn: () => scoreService.getMySessions(),
  });

  // 绑定场次
  const bindSessionMutation = useMutation({
    mutationFn: (token: string) => scoreService.bindSession(token),
    onSuccess: () => {
      success('场次绑定成功');
      setShowScanner(false);
      queryClient.invalidateQueries({ queryKey: ['mySessions'] });
    },
    onError: (err: any) => {
      error(err.message || '绑定失败', '错误');
    },
  });

  /**
   * 处理扫码绑定
   */
  const handleScanSuccess = async (token: string) => {
    await bindSessionMutation.mutateAsync(token);
  };

  /**
   * 进入场次
   */
  const handleEnterSession = (sessionId: string) => {
    navigate(`/interviewer/sessions/${sessionId}/candidates`);
  };

  // 过滤场次
  const filteredSessions = React.useMemo(() => {
    return filterMySessions(sessionsData?.items || [], statusFilter, searchKeyword);
  }, [sessionsData, statusFilter, searchKeyword]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的场次</h1>
          <p className="text-muted-foreground mt-1">
            管理您参与的面试场次和评分任务
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowScanner(true)}>
            <QrCode className="mr-2 h-4 w-4" />
            绑定场次
          </Button>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex items-center gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value={SessionStatus.ACTIVE}>进行中</TabsTrigger>
            <TabsTrigger value={SessionStatus.COMPLETED}>已完成</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索场次名称或岗位..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* 场次列表 */}
      {filteredSessions.length === 0 ? (
        <EmptyState
          title="暂无场次"
          description={
            searchKeyword
              ? '未找到匹配的场次'
              : '点击"绑定场次"按钮扫描二维码加入场次'
          }
          actionText={!searchKeyword ? '绑定场次' : undefined}
          onAction={!searchKeyword ? () => setShowScanner(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEnter={handleEnterSession}
            />
          ))}
        </div>
      )}

      {/* 二维码扫描对话框 */}
      <QRScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default MySessionsPage;
