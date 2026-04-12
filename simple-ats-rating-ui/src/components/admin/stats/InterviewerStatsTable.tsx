/**
 * 评委统计表格组件
 * 显示评委评分统计信息
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterviewerStatsItem } from '@/types/score';

export interface InterviewerStatsTableProps {
  /** 评委统计数据 */
  data: InterviewerStatsItem[];
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * InterviewerStatsTable - 评委统计表格
 */
export const InterviewerStatsTable: React.FC<InterviewerStatsTableProps> = ({
  data,
  loading = false,
}) => {
  // 格式化评分时间
  const formatScoreTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 获取进度颜色
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>评委评分统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>评委评分统计</CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center text-gray-500 py-8">暂无评委数据</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>评委</TableHead>
                  <TableHead className="text-center">评分进度</TableHead>
                  <TableHead className="text-center">已评/总数</TableHead>
                  <TableHead className="text-center">平均评分时间</TableHead>
                  <TableHead className="text-center">平均给分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.interviewer_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-blue-100">
                          <AvatarFallback className="text-blue-600 text-sm font-medium">
                            {item.interviewer_name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">
                          {item.interviewer_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {item.progress_rate.toFixed(0)}%
                          </span>
                          {item.progress_rate >= 100 && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <Progress
                          value={item.progress_rate}
                          className={cn('h-2', getProgressColor(item.progress_rate))}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-gray-900">
                        {item.scored_count}
                      </span>
                      <span className="text-gray-500"> / {item.total_candidates}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {formatScoreTime(item.avg_score_time)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-bold',
                          item.avg_score >= 80
                            ? 'text-green-600'
                            : item.avg_score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        )}
                      >
                        {item.avg_score.toFixed(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterviewerStatsTable;
