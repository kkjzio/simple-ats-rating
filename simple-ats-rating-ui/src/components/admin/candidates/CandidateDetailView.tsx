/**
 * 候选人详情查看组件
 * 显示完整的候选人信息、简历下载和评分记录
 */

import React from 'react';
import { Download, Mail, Phone, GraduationCap, Briefcase, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import type { CandidateResponse } from '../../../types';
import { formatDate } from '../../../utils/format';
import { candidateService } from '../../../services';

interface CandidateDetailViewProps {
  /** 候选人数据 */
  candidate: CandidateResponse;
}

/**
 * 候选人详情查看组件
 */
export const CandidateDetailView: React.FC<CandidateDetailViewProps> = ({
  candidate,
}) => {
  const displayTotalScore = candidate.total_score;

  // 状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: '待面试', variant: 'secondary' },
      completed: { label: '已完成', variant: 'default' },
      cancelled: { label: '已取消', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // 获取标准化的简历文件列表（兼容旧数据）
  const resumeFiles = candidate.resume_files && candidate.resume_files.length > 0
    ? candidate.resume_files
    : candidate.resume_url
    ? [{ url: candidate.resume_url, filename: candidate.resume_filename || '候选人简历' }]
    : [];

  // 下载指定简历文件
  const [downloadingIndex, setDownloadingIndex] = React.useState<number | null>(null);
  const handleDownloadResume = async (index: number, filename?: string) => {
    if (!candidate.id) return;
    setDownloadingIndex(index);
    try {
      await candidateService.downloadResumeByIndex(candidate.id, index, filename);
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>基本信息</CardTitle>
            {getStatusBadge(candidate.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 姓名 */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">姓名</p>
              <p className="font-medium">{candidate.name}</p>
            </div>

            {/* 性别 */}
            {candidate.gender && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">性别</p>
                <p className="font-medium">{candidate.gender}</p>
              </div>
            )}

            {/* 手机 */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">手机</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{candidate.phone}</p>
              </div>
            </div>

            {/* 邮箱 */}
            {candidate.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">邮箱</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{candidate.email}</p>
                </div>
              </div>
            )}

            {/* 教育背景 */}
            {candidate.education && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">教育背景</p>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{candidate.education}</p>
                </div>
              </div>
            )}

            {/* 工作经验 */}
            {candidate.work_experience !== null &&
              candidate.work_experience !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">工作经验</p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{candidate.work_experience}年</p>
                  </div>
                </div>
              )}

            {/* 面试顺序 */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">面试顺序</p>
              <p className="font-medium">第 {candidate.order} 位</p>
            </div>

            {/* 创建时间 */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">创建时间</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatDate(candidate.created_at)}</p>
              </div>
            </div>
          </div>

          {/* 备注 */}
          {candidate.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">备注</p>
                <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 简历信息卡片 */}
      {resumeFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>简历文件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumeFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {file.filename || `简历文件 ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">点击下载查看</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadResume(index, file.filename)}
                  disabled={downloadingIndex === index}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {downloadingIndex === index ? '下载中...' : '下载'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 评分记录卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>评分记录</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.scores_count && candidate.scores_count > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">加权总分</p>
                  <p className="text-2xl font-bold">
                    {displayTotalScore?.toFixed(1) || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">评分数量</p>
                  <p className="text-2xl font-bold">{candidate.scores_count}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                详细评分记录请在评分管理中查看
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无评分记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateDetailView;
