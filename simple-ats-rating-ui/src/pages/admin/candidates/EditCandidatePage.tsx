/**
 * 编辑候选人页面
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CandidateForm } from '@/components/admin/candidates';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { candidateService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { CreateCandidateRequest } from '@/types';

/**
 * 编辑候选人页面
 */
export function EditCandidatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // 获取候选人详情
  const { data: candidate, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidateService.getCandidateById(id!),
    enabled: !!id,
  });

  // 更新候选人（追加新简历文件）
  const updateMutation = useMutation({
    mutationFn: (data: CreateCandidateRequest) => {
      const updateData = {
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        resumes: data.resumes ?? undefined,
      };
      return candidateService.updateCandidate(id!, updateData);
    },
    onSuccess: () => {
      success('候选人信息已更新', '更新成功');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      navigate(`/admin/candidates/${id}`);
    },
    onError: (err: any) => {
      error(err.message || '更新候选人失败，请重试', '更新失败');
    },
  });

  // 删除指定简历文件
  const deleteResumeMutation = useMutation({
    mutationFn: (fileIndex: number) =>
      candidateService.deleteResumeFile(id!, fileIndex),
    onSuccess: () => {
      success('简历文件已删除', '删除成功');
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
    },
    onError: (err: any) => {
      error(err.message || '删除简历文件失败，请重试', '删除失败');
    },
  });

  // 处理提交
  const handleSubmit = async (data: CreateCandidateRequest) => {
    updateMutation.mutate(data);
  };

  // 处理取消
  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !candidate) {
    return (
      <EmptyState
        title="加载失败"
        description="无法加载候选人信息，请刷新页面重试"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑候选人</h1>
          <p className="text-muted-foreground">修改候选人信息</p>
        </div>
      </div>

      {/* 候选人表单 */}
      <Card>
        <CardHeader>
          <CardTitle>候选人信息</CardTitle>
          <CardDescription>修改候选人的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <CandidateForm
            initialData={candidate}
            onSubmit={handleSubmit}
            onDeleteExistingFile={(fileIndex) => deleteResumeMutation.mutate(fileIndex)}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending || deleteResumeMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default EditCandidatePage;
