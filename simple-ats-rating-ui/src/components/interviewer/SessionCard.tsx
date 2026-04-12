/**
 * 场次卡片组件
 * 显示场次信息和评分进度
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, FileText, ArrowRight } from 'lucide-react';
import { SessionStatus } from '@/types/session';
import { formatDate } from '@/utils/format';
import type { MySessionItem } from '@/services/score.service';

interface SessionCardProps {
  /** 场次数据 */
  session: MySessionItem;
  /** 点击场次回调 */
  onEnter: (sessionId: string) => void;
}

/**
 * 获取状态徽章配置
 */
const getStatusBadge = (status: SessionStatus) => {
  const configs = {
    [SessionStatus.DRAFT]: { label: '草稿', variant: 'secondary' as const },
    [SessionStatus.ACTIVE]: { label: '进行中', variant: 'default' as const },
    [SessionStatus.COMPLETED]: { label: '已完成', variant: 'outline' as const },
    [SessionStatus.ARCHIVED]: { label: '已归档', variant: 'secondary' as const },
  };
  return configs[status] || configs[SessionStatus.DRAFT];
};

/**
 * 场次卡片组件
 */
export const SessionCard: React.FC<SessionCardProps> = ({ session, onEnter }) => {
  const statusBadge = getStatusBadge(session.status);
  const progress = session.my_progress.total > 0
    ? (session.my_progress.completed / session.my_progress.total) * 100
    : 0;
  const canViewSession =
    session.status === SessionStatus.ACTIVE || session.status === SessionStatus.COMPLETED;
  const actionText = session.status === SessionStatus.COMPLETED ? '查看场次' : '进入场次';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{session.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(session.date)}</span>
            </div>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.position}</span>
          </div>

          {session.description && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p className="line-clamp-2">{session.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">评分进度</span>
            <span className="font-medium">
              {session.my_progress.completed} / {session.my_progress.total}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>已完成 {session.my_progress.completed} 人</span>
            {session.my_progress.draft > 0 && (
              <span className="text-amber-600">草稿 {session.my_progress.draft} 份</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onEnter(session.id)}
          disabled={!canViewSession}
        >
          {actionText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SessionCard;
