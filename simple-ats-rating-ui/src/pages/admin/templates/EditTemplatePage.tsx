/**
 * 编辑模板页面
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import templateService from '../../../services/template.service';
import { useUIStore } from '../../../stores';
import { ToastType } from '../../../types';
import type { CreateTemplateRequest } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { TemplateForm } from '../../../components/admin/templates';
import { Loading } from '../../../components/common/Loading';
import { EmptyState } from '../../../components/common/EmptyState';

/**
 * 编辑模板页面
 */
export default function EditTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  // 获取模板详情
  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templateService.getTemplateById(id!),
    enabled: !!id,
  });

  // 更新模板
  const updateMutation = useMutation({
    mutationFn: (data: CreateTemplateRequest) => templateService.updateTemplate(id!, data),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '模板更新成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      navigate('/admin/templates');
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '更新模板失败');
    },
  });

  /**
   * 处理表单提交
   */
  const handleSubmit = (data: CreateTemplateRequest) => {
    updateMutation.mutate(data);
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    navigate('/admin/templates');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !template) {
    return (
      <EmptyState
        title="加载失败"
        description={(error as any)?.message || '无法加载模板信息'}
        actionText="返回列表"
        onAction={() => navigate('/admin/templates')}
      />
    );
  }

  // 系统模板不允许编辑
  if (template.is_system) {
    return (
      <EmptyState
        title="无法编辑"
        description="系统预置模板不允许编辑"
        actionText="返回列表"
        onAction={() => navigate('/admin/templates')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/templates')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑评分模板</h1>
          <p className="text-muted-foreground mt-2">
            修改模板的基本信息、评分维度和文本评语字段
          </p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>模板信息</CardTitle>
          <CardDescription>
            修改模板的详细信息，所有维度的权重总和必须等于100%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            initialData={template}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
