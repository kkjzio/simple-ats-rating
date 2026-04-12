/**
 * 查看候选人详情页面
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CandidateDetailView } from '@/components/admin/candidates';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { candidateService } from '@/services';
import { useToast } from '@/hooks/useToast';

export function ViewCandidatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: candidate, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidateService.getCandidateById(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => candidateService.deleteCandidate(id!),
    onSuccess: () => {
      success('候选人已删除', '删除成功');
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      navigate('/admin/candidates');
    },
    onError: (err: any) => {
      error(err.message || '删除候选人失败，请重试', '删除失败');
    },
  });

  const handleEdit = () => {
    navigate(`/admin/candidates/${id}/edit`);
  };

  const handleManageScores = () => {
    navigate(`/admin/candidates/${id}/scores`);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError || !candidate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">候选人详情</h1>
          </div>
        </div>
        <EmptyState
          title="加载失败"
          description="无法加载候选人信息，请刷新页面重试"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">候选人详情</h1>
            <p className="text-muted-foreground">{candidate.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManageScores}>
            <FileText className="mr-2 h-4 w-4" />
            评分管理
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <CandidateDetailView candidate={candidate} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除候选人“{candidate.name}”吗？此操作无法撤销，相关评分记录也会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ViewCandidatePage;
