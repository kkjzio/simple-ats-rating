/**
 * 创建场次页面
 */

import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionForm } from '@/components/admin/sessions';
import { sessionService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { CreateSessionRequest } from '@/types';

/**
 * 创建场次页面
 */
export function CreateSessionPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // 创建场次
  const createMutation = useMutation({
    mutationFn: sessionService.createSession,
    onSuccess: () => {
      success('场次创建成功', '创建成功');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      navigate('/admin/sessions');
    },
    onError: () => {
      error('创建场次失败，请重试', '创建失败');
    },
  });

  /**
   * 处理提交
   */
  const handleSubmit = (data: CreateSessionRequest) => {
    createMutation.mutate(data);
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    navigate('/admin/sessions');
  };

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={handleCancel}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回列表
      </Button>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">创建场次</h1>
        <p className="text-muted-foreground">
          填写场次信息并选择评分模板
        </p>
      </div>

      {/* 表单 */}
      <Card>
        <CardHeader>
          <CardTitle>场次信息</CardTitle>
          <CardDescription>请填写完整的场次信息</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateSessionPage;
