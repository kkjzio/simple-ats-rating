/**
 * 候选人排名表格组件
 * 显示候选人排名、得分，支持排序和导出
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, ArrowUpDown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CandidateRankingItem } from '@/types/score';

export interface CandidateRankingTableProps {
  /** 排名数据 */
  rankings: CandidateRankingItem[];
  /** 是否加载中 */
  loading?: boolean;
  /** 导出回调 */
  onExport?: () => void;
  /** 排序回调 */
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  /** 点击候选人回调 */
  onCandidateClick?: (candidateId: string) => void;
}

/**
 * CandidateRankingTable - 候选人排名表格
 */
export const CandidateRankingTable: React.FC<CandidateRankingTableProps> = ({
  rankings,
  loading = false,
  onExport,
  onSort,
  onCandidateClick,
}) => {
  const [sortField, setSortField] = useState<string>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 处理排序
  const handleSort = (field: string) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    onSort?.(field, newOrder);
  };

  // 获取排名徽章样式
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          第1名
        </Badge>
      );
    }
    if (rank === 2) {
      return (
        <Badge className="bg-gray-400 hover:bg-gray-500 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          第2名
        </Badge>
      );
    }
    if (rank === 3) {
      return (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
          <Trophy className="h-3 w-3 mr-1" />
          第3名
        </Badge>
      );
    }
    return <span className="text-gray-600 font-medium">第{rank}名</span>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          候选人排名 ({rankings.length}人)
        </h3>
        {onExport && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        )}
      </div>

      {/* 排名表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-24">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('rank')}
                  className="h-8 px-2"
                >
                  排名
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>候选人</TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('weighted_total_score')}
                  className="h-8 px-2"
                >
                  加权总分
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('average_score')}
                  className="h-8 px-2"
                >
                  平均分
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">评分数</TableHead>
              <TableHead className="text-center">分数范围</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  暂无排名数据
                </TableCell>
              </TableRow>
            ) : (
              rankings.map((item) => (
                <TableRow
                  key={item.candidate_id}
                  className={cn(
                    'transition-colors',
                    onCandidateClick && 'cursor-pointer hover:bg-gray-50',
                    item.rank <= 3 && 'bg-amber-50/30'
                  )}
                  onClick={() => onCandidateClick?.(item.candidate_id)}
                >
                  <TableCell>{getRankBadge(item.rank)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.candidate_avatar || undefined} />
                        <AvatarFallback>
                          {item.candidate_name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">
                        {item.candidate_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-bold text-blue-600">
                      {item.weighted_total_score.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-gray-900">
                      {item.average_score.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-gray-600">
                    {item.score_count}
                  </TableCell>
                  <TableCell className="text-center text-gray-600 text-sm">
                    {item.min_score.toFixed(1)} - {item.max_score.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CandidateRankingTable;
