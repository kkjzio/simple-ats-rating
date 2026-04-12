import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, Star, Clock, CheckCircle, AlertCircle, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/utils/format';
import { scoreService } from '@/services/score.service';

const getSessionStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-700">进行中</Badge>;
    case 'completed':
      return <Badge className="bg-gray-100 text-gray-700">已完成</Badge>;
    case 'draft':
      return <Badge className="bg-yellow-100 text-yellow-700">待开始</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function InterviewerDashboard() {
  const navigate = useNavigate();

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['mySessions'],
    queryFn: () => scoreService.getMySessions(),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['scoreHistory', 'dashboard'],
    queryFn: () => scoreService.getMyScoreHistory({ page: 1, page_size: 5 }),
  });

  const sessions = sessionsData?.items ?? [];
  const historyItems = historyData?.items ?? [];

  const pendingCount = sessions.reduce(
    (sum, s) => sum + Math.max(0, s.my_progress.total - s.my_progress.completed),
    0
  );
  const completedCount = sessions.reduce((sum, s) => sum + s.my_progress.completed, 0);

  if (sessionsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">评委仪表板</h1>
        <p className="text-gray-600 mt-2">管理您的面试场次和评分任务</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">我的场次</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-gray-600 mt-2">
              {sessions.filter(s => s.status === 'active').length} 个进行中
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">待评候选人</CardTitle>
            <div className="p-2 rounded-lg bg-orange-50">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-gray-600 mt-2">需要完成评分</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">已完成评分</CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <Star className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-gray-600 mt-2">累计完成</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 我的场次面板 */}
        <Card>
          <CardHeader>
            <CardTitle>我的场次</CardTitle>
            <CardDescription>您参与的面试场次列表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>暂无场次</p>
                </div>
              ) : (
                sessions.map((session, index) => {
                  const remaining = session.my_progress.total - session.my_progress.completed;
                  const isActive = session.status === 'active';
                  const isFinished = session.status === 'completed' || (isActive && remaining === 0);

                  return (
                    <div key={session.id}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{session.name}</h4>
                              {getSessionStatusBadge(session.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(session.date, 'MM-DD')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.my_progress.total} 人
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 评分进度 */}
                        {session.my_progress.total > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">评分进度</span>
                              <span className="font-medium text-blue-600">
                                {session.my_progress.completed}/{session.my_progress.total}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(session.my_progress.completed / session.my_progress.total) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        {isActive && remaining > 0 && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => navigate(`/interviewer/sessions/${session.id}/candidates`)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            去评分
                          </Button>
                        )}
                        {isFinished && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => navigate(`/interviewer/sessions/${session.id}/stats`)}
                            >
                              <BarChart2 className="h-4 w-4 mr-2" />
                              查看统计
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => navigate(`/interviewer/sessions/${session.id}/candidates`)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              查看候选人
                            </Button>
                          </div>
                        )}
                      </div>
                      {index < sessions.length - 1 && <Separator className="my-4" />}
                    </div>
                  );
                })
              )}
            </div>
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => navigate('/interviewer/sessions')}
              >
                查看全部场次
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 评分历史面板 */}
        <Card>
          <CardHeader>
            <CardTitle>评分历史</CardTitle>
            <CardDescription>您最近完成的评分记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>暂无评分记录</p>
                </div>
              ) : (
                historyItems.map((score, index) => (
                  <div key={score.score_id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{score.candidate_name}</h4>
                          <Badge className="bg-blue-100 text-blue-700">
                            {score.total_score}分
                          </Badge>
                          {score.status === 'draft' && (
                            <Badge className="bg-yellow-100 text-yellow-700">草稿</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{score.session_name}</p>
                        {score.submitted_at && (
                          <p className="text-xs text-gray-400">
                            {formatDate(score.submitted_at, 'MM-DD HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < historyItems.length - 1 && <Separator className="my-3" />}
                  </div>
                ))
              )}
            </div>
            {historyItems.length > 0 && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => navigate('/interviewer/history')}
              >
                查看全部评分历史
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 待办提醒 */}
      {pendingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-orange-900">待办提醒</h3>
                <p className="text-sm text-orange-700 mt-1">
                  您还有 {pendingCount} 位候选人待评分，请及时完成评分任务。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
