/**
 * 评委分配组件
 * 用于管理场次的评委分配
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, UserPlus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { userService } from '@/services';
import { SessionStatus, type InterviewerInfo } from '@/types';

interface InterviewerAssignmentProps {
  sessionId: string;
  interviewers: InterviewerInfo[];
  onAdd?: (interviewerId: string) => void;
  onRemove?: (interviewerId: string) => void;
  isLoading?: boolean;
  canManage?: boolean;
  sessionStatus?: SessionStatus;
}

export const getInterviewerItemClassName = (sessionStatus?: SessionStatus): string => {
  if (sessionStatus === SessionStatus.ARCHIVED) {
    return 'flex items-center justify-between rounded-lg border p-3 opacity-60 bg-muted/30';
  }

  return 'flex items-center justify-between rounded-lg border p-3';
};

/**
 * 评委分配组件
 */
export function InterviewerAssignment({
  sessionId,
  interviewers,
  onAdd,
  onRemove,
  isLoading = false,
  canManage = true,
  sessionStatus,
}: InterviewerAssignmentProps) {
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('');

  // 获取所有评委用户
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'interviewer'],
    queryFn: () => userService.getUsers({ role: 'interviewer', page: 1, page_size: 100 }),
  });

  /**
   * 处理添加评委
   */
  const handleAdd = () => {
    if (!canManage) {
      return;
    }

    if (selectedInterviewerId && onAdd) {
      onAdd(selectedInterviewerId);
      setSelectedInterviewerId('');
    }
  };

  /**
   * 获取可选评委列表（排除已分配的）
   */
  const availableInterviewers = usersData?.items.filter(
    (user) => !interviewers.some((interviewer) => interviewer.id === user.id)
  ) || [];

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* 添加评委 */}
      <Card>
        <CardHeader>
          <CardTitle>添加评委</CardTitle>
          <CardDescription>从用户列表中选择评委并添加到本场次</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select
              value={selectedInterviewerId}
              onValueChange={setSelectedInterviewerId}
              disabled={isLoadingUsers || isLoading || !canManage}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="选择评委" />
              </SelectTrigger>
              <SelectContent>
                {availableInterviewers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.profile?.name || user.username}
                    {user.profile?.email && ` (${user.profile.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAdd}
              disabled={!selectedInterviewerId || isLoading || !canManage}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {!canManage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          当前状态不允许调整评委（仅 draft 场次可增删）
        </div>
      )}

      {/* 已分配评委列表 */}
      <Card>
        <CardHeader>
          <CardTitle>已分配评委 ({interviewers.length})</CardTitle>
          <CardDescription>当前场次的评委列表</CardDescription>
        </CardHeader>
        <CardContent>
          {interviewers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无评委，请添加评委
            </div>
          ) : (
            <div className="space-y-2">
              {interviewers.map((interviewer) => (
                <div
                  key={interviewer.id}
                  className={getInterviewerItemClassName(sessionStatus)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {interviewer.real_name || interviewer.username}
                      </span>
                      <Badge variant="outline">评委</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {interviewer.email && <span>{interviewer.email}</span>}
                      {interviewer.joined_at && (
                        <span className="ml-4">
                          加入时间: {formatDate(interviewer.joined_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!canManage || isLoading) {
                          return;
                        }

                        if (window.confirm('确认移除该评委吗？')) {
                          onRemove(interviewer.id);
                        }
                      }}
                      disabled={isLoading || !canManage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InterviewerAssignment;
