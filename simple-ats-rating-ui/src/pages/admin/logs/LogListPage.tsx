/**
 * 系统日志列表页面
 */

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loading } from '@/components/common/Loading';
import logService from '@/services/log.service';
import type { LogQueryParams, OperationLogResponse } from '@/types/log';

// 操作类型选项（与后端 ActionType 枚举对应）
const ACTION_OPTIONS = [
  { value: 'user_login', label: '用户登录' },
  { value: 'user_logout', label: '用户登出' },
  { value: 'user_create', label: '创建用户' },
  { value: 'user_update', label: '更新用户' },
  { value: 'user_delete', label: '删除用户' },
  { value: 'user_password_reset', label: '重置密码' },
  { value: 'session_create', label: '创建场次' },
  { value: 'session_update', label: '更新场次' },
  { value: 'session_delete', label: '删除场次' },
  { value: 'session_status_change', label: '场次状态变更' },
  { value: 'session_qr_regenerate', label: '重新生成二维码' },
  { value: 'candidate_create', label: '创建候选人' },
  { value: 'candidate_import', label: '导入候选人' },
  { value: 'candidate_update', label: '更新候选人' },
  { value: 'candidate_delete', label: '删除候选人' },
  { value: 'candidate_order_change', label: '调整候选人顺序' },
  { value: 'score_draft_save', label: '保存评分草稿' },
  { value: 'score_submit', label: '提交评分' },
  { value: 'score_admin_modify', label: '管理员修改评分' },
  { value: 'score_admin_delete', label: '管理员删除评分' },
  { value: 'template_create', label: '创建模板' },
  { value: 'template_update', label: '更新模板' },
  { value: 'template_delete', label: '删除模板' },
  { value: 'export_candidate_scores', label: '导出候选人得分' },
  { value: 'export_interviewer_stats', label: '导出评委统计' },
];

// 资源类型选项（与后端 ResourceType 枚举对应）
const RESOURCE_TYPE_OPTIONS = [
  { value: 'user', label: '用户' },
  { value: 'session', label: '场次' },
  { value: 'candidate', label: '候选人' },
  { value: 'template', label: '评分模板' },
  { value: 'score', label: '评分' },
];

/**
 * 格式化时间
 */
function formatDateTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

/**
 * 日志详情面板
 */
function LogDetailPanel({
  log,
  onClose,
}: {
  log: OperationLogResponse;
  onClose: () => void;
}) {
  return (
    <Card className="border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">日志详情</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <span className="text-muted-foreground">日志ID：</span>
            <span className="font-mono text-xs">{log.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">时间：</span>
            <span>{formatDateTime(log.created_at)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">操作人ID：</span>
            <span className="font-mono text-xs">{log.user_id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">操作类型：</span>
            <span>{log.action}</span>
          </div>
          <div>
            <span className="text-muted-foreground">资源类型：</span>
            <span>{log.resource_type}</span>
          </div>
          <div>
            <span className="text-muted-foreground">资源ID：</span>
            <span className="font-mono text-xs">{log.resource_id ?? '-'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">IP地址：</span>
            <span>{log.ip_address ?? '-'}</span>
          </div>
        </div>

        {log.user_agent && (
          <div>
            <p className="text-muted-foreground mb-1">User Agent：</p>
            <p className="text-xs break-all bg-muted rounded p-2">{log.user_agent}</p>
          </div>
        )}

        <div>
          <p className="text-muted-foreground mb-1">详细信息：</p>
          <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogListPage() {
  const [queryParams, setQueryParams] = useState<LogQueryParams>({
    page: 1,
    page_size: 20,
  });

  // 筛选表单临时状态
  const [filterForm, setFilterForm] = useState({
    user_id: '',
    action: '',
    resource_type: '',
    date_from: '',
    date_to: '',
  });

  // 当前选中查看详情的日志
  const [detailLog, setDetailLog] = useState<OperationLogResponse | null>(null);

  // 获取日志列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', queryParams],
    queryFn: () => logService.getLogs(queryParams),
    refetchOnWindowFocus: false,
  });

  // 应用筛选
  const handleSearch = useCallback(() => {
    setDetailLog(null);
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      user_id: filterForm.user_id.trim() || null,
      action: filterForm.action || null,
      resource_type: filterForm.resource_type || null,
      date_from: filterForm.date_from || null,
      date_to: filterForm.date_to || null,
    }));
  }, [filterForm]);

  // 重置筛选
  const handleReset = useCallback(() => {
    setDetailLog(null);
    setFilterForm({ user_id: '', action: '', resource_type: '', date_from: '', date_to: '' });
    setQueryParams({ page: 1, page_size: 20 });
  }, []);

  // 分页
  const handlePageChange = useCallback((page: number) => {
    setDetailLog(null);
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: string) => {
    setDetailLog(null);
    setQueryParams((prev) => ({ ...prev, page: 1, page_size: parseInt(pageSize) }));
  }, []);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">加载失败</p>
          <p className="text-sm text-muted-foreground">获取日志列表时发生错误</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">系统日志</h1>
        <p className="text-muted-foreground">查看所有操作记录</p>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>操作人ID</Label>
              <Input
                placeholder="输入操作人ID"
                value={filterForm.user_id}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, user_id: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="space-y-2">
              <Label>操作类型</Label>
              <Select
                value={filterForm.action || '_all'}
                onValueChange={(val) =>
                  setFilterForm((prev) => ({ ...prev, action: val === '_all' ? '' : val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部</SelectItem>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>资源类型</Label>
              <Select
                value={filterForm.resource_type || '_all'}
                onValueChange={(val) =>
                  setFilterForm((prev) => ({ ...prev, resource_type: val === '_all' ? '' : val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部</SelectItem>
                  {RESOURCE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={filterForm.date_from}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, date_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={filterForm.date_to}
                onChange={(e) => setFilterForm((prev) => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              查询
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            日志列表
            {data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                共 {data.total} 条记录
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : data && data.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">时间</TableHead>
                      <TableHead>操作人ID</TableHead>
                      <TableHead>操作类型</TableHead>
                      <TableHead>资源类型</TableHead>
                      <TableHead>资源ID</TableHead>
                      <TableHead>IP地址</TableHead>
                      <TableHead className="w-16 text-center">详情</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((log) => (
                      <TableRow
                        key={log.id}
                        className={detailLog?.id === log.id ? 'bg-muted/50' : ''}
                      >
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {log.user_id}
                        </TableCell>
                        <TableCell className="text-sm">{log.action}</TableCell>
                        <TableCell className="text-sm">{log.resource_type}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {log.resource_id ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">{log.ip_address ?? '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant={detailLog?.id === log.id ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() =>
                              setDetailLog(detailLog?.id === log.id ? null : log)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页控制 */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页显示</span>
                  <Select
                    value={queryParams.page_size?.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 条</SelectItem>
                      <SelectItem value="20">20 条</SelectItem>
                      <SelectItem value="50">50 条</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 {data.page} / {data.total_pages} 页
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page - 1)}
                      disabled={data.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page + 1)}
                      disabled={data.page >= data.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium">暂无日志记录</p>
                <p className="text-sm text-muted-foreground">当前筛选条件下没有日志数据</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 日志详情面板（内联展示，避免 Portal 问题） */}
      {detailLog && (
        <LogDetailPanel log={detailLog} onClose={() => setDetailLog(null)} />
      )}
    </div>
  );
}

export default LogListPage;