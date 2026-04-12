/**
 * 编辑场次页面
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionForm } from '@/components/admin/sessions';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { sessionService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { UpdateSessionRequest } from '@/types';

/**
 * 编辑场次页面
 */
export function EditSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // 获取场次详情
  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionService.getSessionById(id!),
    enabled: !!id,
  });

  // 更新场次
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSessionRequest) => sessionService.updateSession(id!, data),
    onSuccess: () => {
      success('场次更新成功', '更新成功');
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/admin/sessions');
    },
    onError: () => {
      error('更新场次失败，请重试', '更新失败');
    },
  });

  /**
   * 处理提交
   */
  const handleSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    navigate('/admin/sessions');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !session) {
    return (
      <EmptyState
        title="加载失败"
        description="无法加载场次信息，请返回重试"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={handleCancel}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">编辑场次</h1>
        <p className="text-muted-foreground">
          修改场次信息
        </p>
      </div>

      {/* 表单 */}
      <Card>
        <CardHeader>
          <CardTitle>场次信息</CardTitle>
          <CardDescription>修改场次的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
            mode="edit"
            initialData={session}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default EditSessionPage;
