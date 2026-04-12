/**
 * 评委管理页面
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InterviewerAssignment } from '@/components/admin/sessions';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { sessionService } from '@/services';
import { useToast } from '@/hooks/useToast';

import { SessionStatus } from '@/types';

export const canManageInterviewers = (status: SessionStatus): boolean => {
  return status === SessionStatus.DRAFT;
};

/**
 * 评委管理页面
 */
export function ManageInterviewersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // 获取场次信息
  const { data: session } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionService.getSessionById(id!),
    enabled: !!id,
  });

  // 获取评委列表
  const { data: interviewersData, isLoading } = useQuery({
    queryKey: ['session-interviewers', id],
    queryFn: () => sessionService.getSessionInterviewers(id!),
    enabled: !!id,
  });

  // 添加评委
  const addMutation = useMutation({
    mutationFn: async (interviewerId: string) => {
      if (!canManage) {
        throw new Error('当前状态不允许调整评委（仅 draft 场次可增删）');
      }

      return sessionService.assignInterviewers(id!, [interviewerId]);
    },
    onSuccess: () => {
      success('评委添加成功', '添加成功');
      queryClient.invalidateQueries({ queryKey: ['session-interviewers', id] });
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err: any) => {
      error(err?.message || '添加评委失败，请重试', '添加失败');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (interviewerId: string) => {
      if (!canManage) {
        throw new Error('当前状态不允许调整评委（仅 draft 场次可增删）');
      }

      await sessionService.removeInterviewer(id!, interviewerId);
    },
    onSuccess: () => {
      success('评委已移除', '移除成功');
      queryClient.invalidateQueries({ queryKey: ['session-interviewers', id] });
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (err: any) => {
      error(err?.message || '移除评委失败，请重试', '移除失败');
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return (
      <EmptyState
        title="场次不存在"
        description="找不到该场次，请返回列表页"
      />
    );
  }

  const canManage = canManageInterviewers(session.status);

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={() => navigate('/admin/sessions')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">评委管理</h1>
        <p className="text-muted-foreground">
          {session.name} - 管理评委分配
        </p>
      </div>

      {/* 评委分配组件 */}
      <InterviewerAssignment
        sessionId={id!}
        interviewers={interviewersData?.interviewers || []}
        onAdd={(interviewerId) => addMutation.mutate(interviewerId)}
        onRemove={(interviewerId) => removeMutation.mutate(interviewerId)}
        isLoading={addMutation.isPending || removeMutation.isPending}
        canManage={canManage}
        sessionStatus={session.status}
      />
    </div>
  );
}

export default ManageInterviewersPage;
