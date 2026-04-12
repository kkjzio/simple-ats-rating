/**
 * 场次状态徽章组件
 * 根据不同状态显示不同颜色的徽章
 */

import { Badge } from '@/components/ui/badge';
import { SessionStatus } from '@/types';

interface SessionStatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

/**
 * 状态配置映射
 */
const statusConfig: Record<
  SessionStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  [SessionStatus.DRAFT]: {
    label: '草稿',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  },
  [SessionStatus.ACTIVE]: {
    label: '进行中',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  [SessionStatus.COMPLETED]: {
    label: '已完成',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  },
  [SessionStatus.ARCHIVED]: {
    label: '已归档',
    variant: 'secondary',
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  },
};

/**
 * 场次状态徽章组件
 */
export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
}

export default SessionStatusBadge;
