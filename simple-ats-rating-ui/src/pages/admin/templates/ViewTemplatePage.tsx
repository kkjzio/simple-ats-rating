/**
 * 查看模板详情页面
 */

import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, Star } from 'lucide-react';
import templateService from '../../../services/template.service';
import { useUIStore } from '../../../stores';
import { ToastType } from '../../../types';
import { Button } from '../../../components/ui/button';
import { TemplatePreview } from '../../../components/admin/templates';
import { Loading } from '../../../components/common/Loading';
import { EmptyState } from '../../../components/common/EmptyState';

/**
 * 查看模板详情页面
 */
export default function ViewTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, showConfirm } = useUIStore();

  // 获取模板详情
  const { data: template, isLoading, error } = useQuery({
    queryKey: ['template', id],
    queryFn: () => templateService.getTemplateById(id!),
    enabled: !!id,
  });

  // 删除模板
  const deleteMutation = useMutation({
    mutationFn: () => templateService.deleteTemplate(id!),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '模板删除成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/admin/templates');
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '删除模板失败');
    },
  });

  // 设置默认模板
  const setDefaultMutation = useMutation({
    mutationFn: () => templateService.setDefaultTemplate(id!),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '默认模板设置成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', id] });
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '设置默认模板失败');
    },
  });

  /**
   * 处理删除
   */
  const handleDelete = () => {
    if (!template) return;

    showConfirm(
      {
        title: '删除模板',
        message: `确定要删除模板"${template.name}"吗？此操作无法撤销。`,
        confirmText: '删除',
        cancelText: '取消',
        confirmType: 'danger',
      },
      () => deleteMutation.mutate()
    );
  };

  /**
   * 处理设置为默认
   */
  const handleSetDefault = () => {
    if (!template) return;

    showConfirm(
      {
        title: '设置默认模板',
        message: `确定要将"${template.name}"设置为默认模板吗？`,
        confirmText: '确定',
        cancelText: '取消',
        confirmType: 'primary',
      },
      () => setDefaultMutation.mutate()
    );
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

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">模板详情</h1>
            <p className="text-muted-foreground mt-2">
              查看模板的完整信息
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 设置为默认按钮 - 所有非默认模板都可以设置 */}
          {!template.is_default && (
            <Button
              variant="outline"
              onClick={handleSetDefault}
              disabled={setDefaultMutation.isPending}
            >
              <Star className="h-4 w-4 mr-2" />
              设置为默认
            </Button>
          )}
          
          {/* 编辑和删除按钮 - 仅非系统模板可用 */}
          {!template.is_system && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/templates/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 模板预览 */}
      <TemplatePreview template={template} />
    </div>
  );
}
