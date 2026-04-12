/**
 * 评分历史卡片组件
 * 显示单条评分记录
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Calendar, Trophy } from 'lucide-react';
import { formatDate } from '@/utils/format';
import type { ScoreHistoryItem } from '@/services/score.service';

interface ScoreHistoryCardProps {
  /** 评分历史数据 */
  score: ScoreHistoryItem;
  /** 点击卡片回调（可选） */
  onClick?: (scoreId: string) => void;
}

/**
 * 评分历史卡片组件
 */
export const ScoreHistoryCard: React.FC<ScoreHistoryCardProps> = ({
  score,
  onClick,
}) => {
  const isDraft = score.status === 'draft';

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(score.score_id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{score.candidate_name}</h4>
              <p className="text-xs text-muted-foreground">
                {score.session_name}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isDraft ? 'outline' : 'default'}>
              {isDraft ? '草稿' : '已提交'}
            </Badge>
            <div className="flex items-center gap-1 text-lg font-bold text-primary">
              <Trophy className="h-4 w-4" />
              {score.total_score.toFixed(2)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {isDraft
              ? '草稿'
              : `提交于 ${formatDate(score.submitted_at!)}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreHistoryCard;
