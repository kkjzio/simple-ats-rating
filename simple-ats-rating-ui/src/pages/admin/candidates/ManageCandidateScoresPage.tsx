import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, User } from 'lucide-react';

import { DynamicScoreForm } from '@/components/interviewer';
import { EmptyState } from '@/components/common/EmptyState';
import { Loading } from '@/components/common/Loading';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import candidateService from '@/services/candidate.service';
import scoreService from '@/services/score.service';
import sessionService from '@/services/session.service';
import templateService from '@/services/template.service';
import type { SaveScoreDraftRequest, ScoreResponse } from '@/types/score';
import { formatDate } from '@/utils/format';

const scoreStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  submitted: { label: '已提交', variant: 'default' },
  modified_by_admin: { label: '管理员已修改', variant: 'outline' },
};

const toFormValues = (score: ScoreResponse): SaveScoreDraftRequest => ({
  dimension_scores: Array.isArray(score.dimension_scores)
    ? score.dimension_scores.map((item) => ({
        dimension_name: item.dimension_name,
        score: item.score,
      }))
    : [],
  text_feedbacks: Array.isArray(score.text_feedbacks)
    ? score.text_feedbacks.map((item) => ({
        field_name: item.field_name,
        content: item.content,
      }))
    : [],
});

export function ManageCandidateScoresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { id: candidateId } = useParams<{ id: string }>();

  const [selectedScoreId, setSelectedScoreId] = React.useState<string | null>(null);
  const [currentFormData, setCurrentFormData] = React.useState<SaveScoreDraftRequest | null>(null);
  const [modifyReason, setModifyReason] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidateService.getCandidateById(candidateId!),
    enabled: !!candidateId,
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', candidate?.session_id],
    queryFn: () => sessionService.getSessionById(candidate!.session_id),
    enabled: !!candidate?.session_id,
  });

  const { data: scoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['candidate-admin-scores', candidateId],
    queryFn: () => scoreService.getAdminCandidateScores(candidateId!),
    enabled: !!candidateId,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', session?.scoring_template_id],
    queryFn: () => templateService.getTemplateById(session!.scoring_template_id),
    enabled: !!session?.scoring_template_id,
  });

  const scores = scoresData?.scores || [];
  const selectedScore = scores.find((score) => score.id === selectedScoreId) || null;
  const currentDisplayTotalScore = selectedScore?.total_score ?? candidate?.total_score;
  const selectedScoreFormValues = React.useMemo(
    () => (selectedScore ? toFormValues(selectedScore) : undefined),
    [selectedScore]
  );

  React.useEffect(() => {
    if (!scores.length) {
      setSelectedScoreId(null);
      return;
    }

    setSelectedScoreId((currentId) => {
      if (currentId && scores.some((score) => score.id === currentId)) {
        return currentId;
      }
      return scores[0]?.id ?? null;
    });
  }, [scores]);

  React.useEffect(() => {
    if (!selectedScore) {
      setCurrentFormData(null);
      setModifyReason('');
      return;
    }

    setCurrentFormData(selectedScoreFormValues ?? null);
    setModifyReason('');
  }, [selectedScore, selectedScoreFormValues]);

  const invalidateAdminScoreQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['candidate-admin-scores', candidateId] });
    queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] });
    queryClient.invalidateQueries({ queryKey: ['candidates'] });

    if (candidate?.session_id) {
      queryClient.invalidateQueries({ queryKey: ['session', candidate.session_id] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats', candidate.session_id] });
    }
  }, [candidate?.session_id, candidateId, queryClient]);

  const modifyMutation = useMutation({
    mutationFn: ({ scoreId, payload }: { scoreId: string; payload: SaveScoreDraftRequest & { modify_reason: string } }) =>
      scoreService.adminModifyScore(scoreId, payload),
    onSuccess: async () => {
      success('评分修改成功');
      setModifyReason('');
      await invalidateAdminScoreQueries();
    },
    onError: (err: any) => {
      error(err.message || '评分修改失败', '错误');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (scoreId: string) => scoreService.adminDeleteScore(scoreId),
    onSuccess: async () => {
      success('评分删除成功');
      setDeleteDialogOpen(false);
      await invalidateAdminScoreQueries();
    },
    onError: (err: any) => {
      error(err.message || '评分删除失败', '错误');
    },
  });

  const handleBack = () => {
    if (candidate?.session_id) {
      navigate(`/admin/candidates?sessionId=${candidate.session_id}`);
      return;
    }
    navigate(-1);
  };

  const handleModify = async () => {
    if (!selectedScore || !currentFormData) {
      error('请选择需要处理的评分', '提示');
      return;
    }

    if (!modifyReason.trim()) {
      error('请填写修改原因', '提示');
      return;
    }

    await modifyMutation.mutateAsync({
      scoreId: selectedScore.id,
      payload: {
        ...currentFormData,
        modify_reason: modifyReason.trim(),
      },
    });
  };

  const handleDelete = async () => {
    if (!selectedScore) {
      return;
    }
    await deleteMutation.mutateAsync(selectedScore.id);
  };

  const isLoading = candidateLoading || sessionLoading || scoresLoading || templateLoading;
  const selectedScoreStatus = selectedScore
    ? scoreStatusMap[selectedScore.status] || { label: selectedScore.status, variant: 'outline' as const }
    : null;

  if (isLoading) {
    return <Loading />;
  }

  if (!candidate || !session || !template) {
    return (
      <EmptyState
        title="信息不存在"
        description="未找到候选人、场次或评分模板信息"
        actionText="返回"
        onAction={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">候选人评分管理</h1>
          <p className="mt-1 text-muted-foreground">
            {candidate.name} · {session.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>候选人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{candidate.name}</div>
                  <div className="text-sm text-muted-foreground">{candidate.phone}</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">场次</span>
                  <span className="text-right">{session.name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">岗位</span>
                  <span>{session.position}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">面试顺序</span>
                  <span>第 {candidate.order} 位</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">当前加权总分</span>
                  <span>{currentDisplayTotalScore?.toFixed(2) || '暂无'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评分概览</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">有效评分数</div>
                <div className="mt-1 text-2xl font-semibold">{scoresData?.statistics.count || 0}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">平均分</div>
                <div className="mt-1 text-2xl font-semibold">
                  {(scoresData?.statistics.average_score || 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">最高分</div>
                <div className="mt-1 text-xl font-semibold">
                  {(scoresData?.statistics.max_score || 0).toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground">最低分</div>
                <div className="mt-1 text-xl font-semibold">
                  {(scoresData?.statistics.min_score || 0).toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>评分记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground">当前候选人暂无评分记录</p>
              ) : (
                scores.map((score) => {
                  const badge = scoreStatusMap[score.status] || { label: score.status, variant: 'outline' as const };
                  const isSelected = score.id === selectedScoreId;

                  return (
                    <button
                      key={score.id}
                      type="button"
                      onClick={() => setSelectedScoreId(score.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{score.interviewer_name || '未知评委'}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            总分 {score.total_score.toFixed(2)}
                          </div>
                        </div>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        更新时间 {formatDate(score.updated_at)}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {!selectedScore ? (
            <EmptyState
              title="暂无可管理评分"
              description="当前候选人还没有任何评分记录"
              actionText="返回候选人列表"
              onAction={handleBack}
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>当前评分详情</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-sm text-muted-foreground">评分评委</div>
                    <div className="mt-1 font-medium">{selectedScore.interviewer_name || '未知评委'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">当前状态</div>
                    <div className="mt-1">
                      {selectedScoreStatus && <Badge variant={selectedScoreStatus.variant}>{selectedScoreStatus.label}</Badge>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">提交时间</div>
                    <div className="mt-1">
                      {selectedScore.submitted_at ? formatDate(selectedScore.submitted_at) : '未提交'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">最后更新时间</div>
                    <div className="mt-1">{formatDate(selectedScore.updated_at)}</div>
                  </div>
                  {selectedScore.modify_reason && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-muted-foreground">最近一次管理员修改原因</div>
                      <div className="mt-1 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm">
                        {selectedScore.modify_reason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <DynamicScoreForm
                dimensions={template.dimensions || []}
                textFields={template.text_fields || []}
                initialValues={selectedScoreFormValues}
                onChange={setCurrentFormData}
              />

              <Card>
                <CardHeader>
                  <CardTitle>管理员操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="modify-reason">
                      修改原因
                    </label>
                    <Textarea
                      id="modify-reason"
                      value={modifyReason}
                      onChange={(event) => setModifyReason(event.target.value)}
                      placeholder="请填写本次改分原因，用于审计和追踪"
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={handleModify}
                      disabled={modifyMutation.isPending || !currentFormData}
                      className="sm:flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {modifyMutation.isPending ? '保存中...' : '保存修改'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deleteMutation.isPending}
                      className="sm:flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteMutation.isPending ? '删除中...' : '删除该评分'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    删除后该条评分会被彻底移除，候选人平均分和场次统计会同步刷新。评委是否能重新评分，仍受当前场次评分规则限制。
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除评分</AlertDialogTitle>
            <AlertDialogDescription>
              将删除 {selectedScore?.interviewer_name || '该评委'} 对候选人 {candidate.name} 的评分记录。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default ManageCandidateScoresPage;
