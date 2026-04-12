/**
 * 场次列表表格组件
 * 显示场次列表，支持查看、编辑、删除等操作
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck,
  QrCode,
  PlayCircle,
  CheckCircle,
  Archive,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { SessionStatusBadge } from './SessionStatusBadge';
import { SessionStatus } from '@/types';
import type { SessionResponse } from '@/types';

interface SessionTableProps {
  sessions: SessionResponse[];
  onEdit?: (session: SessionResponse) => void;
  onDelete?: (sessionId: string) => void;
  onStatusChange?: (sessionId: string, status: SessionStatus) => void;
  onViewInterviewers?: (sessionId: string) => void;
  onViewQRCode?: (sessionId: string) => void;
  onManageCandidates?: (sessionId: string) => void;
}

/**
 * 场次列表表格组件
 */
export function SessionTable({
  sessions,
  onEdit,
  onDelete,
  onStatusChange,
  onViewInterviewers,
  onViewQRCode,
  onManageCandidates,
}: SessionTableProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);

  /**
   * 处理查看详情
   */
  const handleView = (session: SessionResponse) => {
    navigate(`/admin/sessions/${session.id}`);
  };

  /**
   * 处理删除确认
   */
  const handleDeleteClick = (session: SessionResponse) => {
    setSelectedSession(session);
    setDeleteDialogOpen(true);
  };

  /**
   * 确认删除
   */
  const handleDeleteConfirm = () => {
    if (selectedSession && onDelete) {
      onDelete(selectedSession.id);
    }
    setDeleteDialogOpen(false);
    setSelectedSession(null);
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>场次名称</TableHead>
              <TableHead>岗位</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>面试时间</TableHead>
              <TableHead>评委数</TableHead>
              <TableHead>候选人数</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{session.position}</TableCell>
                  <TableCell>
                    <SessionStatusBadge status={session.status} />
                  </TableCell>
                  <TableCell>{formatDateTime(session.date)}</TableCell>
                  <TableCell>
                    {session.statistics?.total_interviewers || 0}
                  </TableCell>
                  <TableCell>
                    {session.statistics?.total_candidates || 0}
                  </TableCell>
                  <TableCell>{formatDateTime(session.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleView(session)}>
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        {session.status === 'draft' && onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(session)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                        )}
                        {onManageCandidates && (
                          <DropdownMenuItem
                            onClick={() => onManageCandidates(session.id)}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            候选人管理
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onViewInterviewers && (
                          <DropdownMenuItem
                            onClick={() => onViewInterviewers(session.id)}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            管理评委
                          </DropdownMenuItem>
                        )}
                        {onViewQRCode && (
                          <DropdownMenuItem
                            onClick={() => onViewQRCode(session.id)}
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            查看二维码
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {/* 状态切换 */}
                        {session.status === SessionStatus.DRAFT && onStatusChange && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(session.id, SessionStatus.ACTIVE)}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            激活场次
                          </DropdownMenuItem>
                        )}
                        {session.status === SessionStatus.ACTIVE && onStatusChange && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(session.id, SessionStatus.COMPLETED)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            完成场次
                          </DropdownMenuItem>
                        )}
                        {session.status === SessionStatus.COMPLETED && onStatusChange && (
                          <DropdownMenuItem
                            onClick={() => onStatusChange(session.id, SessionStatus.ARCHIVED)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            归档场次
                          </DropdownMenuItem>
                        )}
                        {/* 删除 */}
                        {session.status === SessionStatus.DRAFT && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(session)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除场次"{selectedSession?.name}"吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SessionTable;
