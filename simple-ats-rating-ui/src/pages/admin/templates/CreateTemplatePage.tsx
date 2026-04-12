/**
 * 创建模板页面
 */

import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import templateService from '../../../services/template.service';
import { useUIStore } from '../../../stores';
import { ToastType } from '../../../types';
import type { CreateTemplateRequest } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { TemplateForm } from '../../../components/admin/templates';

/**
 * 创建模板页面
 */
export default function CreateTemplatePage() {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  // 创建模板
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateRequest) => templateService.createTemplate(data),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '模板创建成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/admin/templates');
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '创建模板失败');
    },
  });

  /**
   * 处理表单提交
   */
  const handleSubmit = (data: CreateTemplateRequest) => {
    createMutation.mutate(data);
  };

  /**
   * 处理取消
   */
  const handleCancel = () => {
    navigate('/admin/templates');
  };

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
          <h1 className="text-3xl font-bold tracking-tight">创建评分模板</h1>
          <p className="text-muted-foreground mt-2">
            设置模板的基本信息、评分维度和文本评语字段
          </p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>模板信息</CardTitle>
          <CardDescription>
            填写模板的详细信息，所有维度的权重总和必须等于100%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
