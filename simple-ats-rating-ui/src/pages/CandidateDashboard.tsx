import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, User, Mail, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/utils/format';

/**
 * 候选人信息接口
 */
interface CandidateInfo {
  name: string;
  email: string;
  phone: string;
  department?: string;
}

/**
 * 面试信息接口
 */
interface InterviewInfo {
  id: string;
  sessionName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  location: string;
  interviewers: string[];
  score?: number;
  feedback?: string;
}

/**
 * 候选人仪表板页面
 * 显示候选人个人信息、面试状态和面试安排
 */
export default function CandidateDashboard() {
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo | null>(null);
  const [interviews, setInterviews] = useState<InterviewInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载仪表板数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // TODO: 调用实际的API获取数据
      // 这里使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCandidateInfo({
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        department: '技术部',
      });

      setInterviews([
        {
          id: '1',
          sessionName: '2024春季招聘第一轮面试',
          status: 'completed',
          startTime: '2024-12-20T14:00:00',
          endTime: '2024-12-20T15:00:00',
          location: '会议室A',
          interviewers: ['李四', '王五'],
          score: 85,
          feedback: '表现优秀，技术能力强，沟通能力良好。',
        },
        {
          id: '2',
          sessionName: '2024春季招聘第二轮面试',
          status: 'in_progress',
          startTime: '2024-12-26T14:00:00',
          endTime: '2024-12-26T15:30:00',
          location: '会议室B',
          interviewers: ['赵六', '孙七'],
        },
        {
          id: '3',
          sessionName: '2024春季招聘终面',
          status: 'pending',
          startTime: '2024-12-28T10:00:00',
          endTime: '2024-12-28T11:00:00',
          location: '总经理办公室',
          interviewers: ['周八'],
        },
      ]);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取面试状态徽章
  const getInterviewStatusBadge = (status: InterviewInfo['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            待开始
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            进行中
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            已完成
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="default" className="bg-gray-100 text-gray-700">
            <XCircle className="h-3 w-3 mr-1" />
            已取消
          </Badge>
        );
      default:
        return <Badge variant="default">未知</Badge>;
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: InterviewInfo['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'in_progress':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

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

  if (!candidateInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>无法加载候选人信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">候选人仪表板</h1>
        <p className="text-gray-600 mt-2">查看您的个人信息和面试安排</p>
      </div>

      {/* 个人信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
          <CardDescription>您的基本资料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* 头像 */}
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {candidateInfo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* 信息列表 */}
            <div className="flex-1 grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">姓名</p>
                  <p className="font-medium">{candidateInfo.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">邮箱</p>
                  <p className="font-medium">{candidateInfo.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Phone className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">手机</p>
                  <p className="font-medium">{candidateInfo.phone}</p>
                </div>
              </div>

              {candidateInfo.department && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">部门</p>
                    <p className="font-medium">{candidateInfo.department}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 面试状态概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              待参加面试
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">场面试</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              进行中
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.status === 'in_progress').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">场面试</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              已完成
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {interviews.filter(i => i.status === 'completed').length}
            </div>
            <p className="text-xs text-gray-600 mt-2">场面试</p>
          </CardContent>
        </Card>
      </div>

      {/* 面试安排 */}
      <Card>
        <CardHeader>
          <CardTitle>面试安排</CardTitle>
          <CardDescription>您的面试时间表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>暂无面试安排</p>
              </div>
            ) : (
              interviews.map((interview, index) => (
                <div key={interview.id}>
                  <div className="flex items-start gap-4">
                    {/* 状态图标 */}
                    <div className="mt-1">
                      {getStatusIcon(interview.status)}
                    </div>

                    {/* 面试信息 */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{interview.sessionName}</h4>
                          <div className="mt-1">
                            {getInterviewStatusBadge(interview.status)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(interview.startTime, 'YYYY-MM-DD HH:mm')} - {formatDate(interview.endTime, 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{interview.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>面试官：{interview.interviewers.join('、')}</span>
                        </div>
                      </div>

                      {/* 评分和反馈 */}
                      {interview.status === 'completed' && interview.score !== undefined && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">
                              评分：{interview.score} 分
                            </span>
                          </div>
                          {interview.feedback && (
                            <p className="text-sm text-green-700">
                              反馈：{interview.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < interviews.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 温馨提示 */}
      {interviews.some(i => i.status === 'pending') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">温馨提示</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>请提前15分钟到达面试地点</li>
                  <li>请携带身份证件和相关资料</li>
                  <li>如有特殊情况无法参加，请提前联系HR</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
