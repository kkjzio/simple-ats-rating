/**
 * 评分页面
 * 对候选人进行评分（核心页面）
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { DynamicScoreForm } from '@/components/interviewer';
import { EmptyState, Loading } from '@/components/common';
import { ArrowLeft, Calendar, Download, FileText, Save, Send, User } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { scoreService } from '@/services/score.service';
import candidateService from '@/services/candidate.service';
import templateService from '@/services/template.service';
import sessionService from '@/services/session.service';
import type { SaveScoreDraftRequest } from '@/types/score';
import { formatDate } from '@/utils/format';

/**
 * 评分页面
 */
export const ScoreCandidatePage: React.FC = () => {
  const navigate = useNavigate();
  const { candidateId } = useParams<{ candidateId: string }>();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [currentFormData, setCurrentFormData] = React.useState<SaveScoreDraftRequest | null>(null);
  const [downloadingResumeIndex, setDownloadingResumeIndex] = React.useState<number | null>(null);

  // 获取候选人信息
  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidateService.getCandidateById(candidateId!),
    enabled: !!candidateId,
  });

  // 获取场次信息
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', candidate?.session_id],
    queryFn: () => sessionService.getSessionById(candidate!.session_id),
    enabled: !!candidate?.session_id,
  });

  // 获取我的评分
  const { data: myScore, isLoading: scoreLoading } = useQuery({
    queryKey: ['myScore', candidateId, candidate?.session_id],
    queryFn: () => scoreService.getMyScore(candidate!.session_id, candidateId!),
    enabled: !!candidateId && !!candidate?.session_id,
  });

  // 获取评分模板
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', session?.scoring_template_id],
    queryFn: () => templateService.getTemplateById(session!.scoring_template_id),
    enabled: !!session?.scoring_template_id,
  });

  // 保存草稿
  const saveDraftMutation = useMutation({
    mutationFn: (data: SaveScoreDraftRequest) =>
      scoreService.saveDraft(candidate!.session_id, candidateId!, data),
    onSuccess: () => {
      success('草稿保存成功');
      queryClient.invalidateQueries({ queryKey: ['myScore', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['myCandidates'] });
    },
    onError: (err: any) => {
      error(err.message || '保存失败', '错误');
    },
  });

  // 提交评分
  const submitScoreMutation = useMutation({
    mutationFn: (scoreId: string) =>
      scoreService.submitScore(candidate!.session_id, candidateId!, { score_id: scoreId }),
    onSuccess: () => {
      success('评分提交成功');
      queryClient.invalidateQueries({ queryKey: ['myScore', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['myCandidates'] });
      queryClient.invalidateQueries({ queryKey: ['mySessions'] });
      // 返回候选人列表
      navigate(-1);
    },
    onError: (err: any) => {
      error(err.message || '提交失败', '错误');
    },
  });

  /**
   * 处理保存草稿
   */
  const handleSaveDraft = async () => {
    if (!currentFormData) {
      error('请先填写评分内容', '提示');
      return;
    }
    await saveDraftMutation.mutateAsync(currentFormData);
  };

  /**
   * 处理提交评分
   */
  const handleSubmitClick = async () => {
    if (!currentFormData) {
      error('请先填写评分内容', '提示');
      return;
    }

    // 如果没有草稿或草稿需要更新，先保存草稿
    if (!myScore || myScore.status === 'draft') {
      await saveDraftMutation.mutateAsync(currentFormData);
    }

    setShowSubmitDialog(true);
  };

  /**
   * 确认提交
   */
  const handleConfirmSubmit = async () => {
    if (!myScore?.id) {
      error('请先保存草稿', '提示');
      return;
    }
    await submitScoreMutation.mutateAsync(myScore.id);
    setShowSubmitDialog(false);
  };

  /**
   * 返回
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * 按索引下载简历文件
   */
  const handleDownloadResume = async (fileIndex: number, filename?: string) => {
    if (!candidateId) return;
    setDownloadingResumeIndex(fileIndex);
    try {
      await candidateService.downloadResumeByIndex(candidateId, fileIndex, filename);
    } catch (err: any) {
      error(err.message || '简历下载失败', '错误');
    } finally {
      setDownloadingResumeIndex(null);
    }
  };

  /**
   * 候选人状态标签
   */
  const getCandidateStatusLabel = (status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      waiting:     { label: '待面试', variant: 'secondary' },
      in_progress: { label: '面试中', variant: 'default' },
      completed:   { label: '已完成', variant: 'outline' },
      passed:      { label: '已通过', variant: 'default' },
      rejected:    { label: '未通过', variant: 'destructive' },
      absent:      { label: '缺席',   variant: 'destructive' },
    };
    return map[status] ?? { label: status, variant: 'secondary' };
  };

  const isLoading = candidateLoading || sessionLoading || scoreLoading || templateLoading;
  const isSubmitted = myScore?.status === 'submitted' || myScore?.status === 'modified_by_admin';
  const isReadOnly = isSubmitted;

  if (isLoading) {
    return <Loading />;
  }

  if (!candidate || !template) {
    return (
      <EmptyState
        title="信息不存在"
        description="未找到候选人或评分模板信息"
        actionText="返回"
        onAction={handleBack}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">候选人评分</h1>
          <p className="text-muted-foreground mt-1">
            {session?.name} · {session?.position}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：候选人信息 */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>候选人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  {candidate.avatar && <AvatarImage src={candidate.avatar} alt={candidate.name} />}
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{candidate.name}</h3>
                {candidate.gender && (
                  <p className="text-sm text-muted-foreground mt-0.5">{candidate.gender}</p>
                )}
                <div className="mt-2">
                  {(() => {
                    const { label, variant } = getCandidateStatusLabel(candidate.status);
                    return <Badge variant={variant}>{label}</Badge>;
                  })()}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {candidate.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">联系电话</span>
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">邮箱</span>
                    <span className="text-right break-all max-w-[160px]">{candidate.email}</span>
                  </div>
                )}
                {candidate.education && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">教育背景</span>
                    <span>{candidate.education}</span>
                  </div>
                )}
                {candidate.work_experience !== null && candidate.work_experience !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">工作经验</span>
                    <span>{candidate.work_experience}年</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">面试顺序</span>
                  <span>第 {candidate.order} 位</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    注册时间
                  </span>
                  <span>{formatDate(candidate.created_at, 'YYYY-MM-DD')}</span>
                </div>
              </div>

              {candidate.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">备注</p>
                    <p className="text-sm text-muted-foreground">{candidate.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* 简历下载 */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  候选人简历
                </p>
                {(() => {
                  const resumeFiles =
                    candidate.resume_files && candidate.resume_files.length > 0
                      ? candidate.resume_files
                      : candidate.resume_url
                      ? [{ url: candidate.resume_url, filename: candidate.resume_filename || '候选人简历' }]
                      : [];
                  if (resumeFiles.length === 0) {
                    return <p className="text-sm text-muted-foreground">暂无简历</p>;
                  }
                  return (
                    <div className="space-y-2">
                      {resumeFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {file.filename || `简历文件 ${index + 1}`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-7 px-2"
                            onClick={() => handleDownloadResume(index, file.filename)}
                            disabled={downloadingResumeIndex === index}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {downloadingResumeIndex === index ? '...' : '下载'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* 评分状态 */}
          {isSubmitted && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Send className="h-5 w-5" />
                  <span className="font-medium">评分已提交</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                  您已成功提交对该候选人的评分，无法再次修改
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：评分表单 */}
        <div className="lg:col-span-2">
          <DynamicScoreForm
            dimensions={template.dimensions || []}
            textFields={template.text_fields || []}
            initialValues={
              myScore && myScore.dimension_scores && Array.isArray(myScore.dimension_scores)
                ? {
                    dimension_scores: myScore.dimension_scores.map((d) => ({
                      dimension_name: d.dimension_name,
                      score: d.score,
                    })),
                    text_feedbacks: Array.isArray(myScore.text_feedbacks)
                      ? myScore.text_feedbacks.map((t) => ({
                          field_name: t.field_name,
                          content: t.content,
                        }))
                      : [],
                  }
                : undefined
            }
            readOnly={isReadOnly}
            onChange={setCurrentFormData}
          />

          {/* 操作按钮 */}
          {!isReadOnly && (
            <div className="flex items-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending || !currentFormData}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveDraftMutation.isPending ? '保存中...' : '保存草稿'}
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={submitScoreMutation.isPending || !currentFormData}
                className="flex-1"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitScoreMutation.isPending ? '提交中...' : '提交评分'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 提交确认对话框 */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认提交评分？</AlertDialogTitle>
            <AlertDialogDescription>
              提交后将无法修改评分内容。请确认您的评分准确无误。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              确认提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScoreCandidatePage;
