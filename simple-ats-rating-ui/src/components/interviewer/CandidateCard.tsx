/**
 * 候选人卡片组件
 * 显示候选人基本信息和评分状态
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, FileEdit, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '@/utils/format';
import type { MyCandidateItem } from '@/types/score';

interface CandidateCardProps {
  /** 候选人数据 */
  candidate: MyCandidateItem;
  /** 点击开始评分回调 */
  onScore: (candidateId: string) => void;
}

/**
 * 获取状态配置
 */
const getStatusConfig = (status: string) => {
  const configs = {
    pending: {
      label: '未评分',
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-gray-500',
    },
    draft: {
      label: '草稿',
      variant: 'outline' as const,
      icon: FileEdit,
      color: 'text-amber-600',
    },
    submitted: {
      label: '已提交',
      variant: 'default' as const,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    completed: {
      label: '已完成',
      variant: 'default' as const,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
  } as const;
  
  return (configs as any)[status] || configs.pending;
};

/**
 * 候选人卡片组件
 */
export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onScore,
}) => {
  const statusConfig = getStatusConfig(candidate.score_status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.candidate_avatar || undefined} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{candidate.candidate_name}</h3>
              <p className="text-sm text-muted-foreground">
                面试顺序：第 {candidate.order} 位
              </p>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {candidate.score_status !== 'pending' && (
          <div className="space-y-2">
            {candidate.total_score !== null && candidate.total_score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总分</span>
                <span className="text-lg font-semibold">{candidate.total_score.toFixed(2)}</span>
              </div>
            )}
            {candidate.updated_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">最后更新</span>
                <span className="text-muted-foreground">
                  {formatDate(candidate.updated_at)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onScore(candidate.candidate_id)}
          variant={candidate.score_status === 'completed' || candidate.score_status === 'submitted' ? 'outline' : 'default'}
        >
          {candidate.score_status === 'pending' && '开始评分'}
          {candidate.score_status === 'draft' && '继续编辑'}
          {(candidate.score_status === 'submitted' || candidate.score_status === 'completed') && '查看评分'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateCard;
