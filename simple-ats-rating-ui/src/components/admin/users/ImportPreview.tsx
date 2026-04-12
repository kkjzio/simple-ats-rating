/**
 * 导入预览组件
 * 显示Excel数据表格，高亮错误行
 */
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface ImportRow {
  row: number;
  username: string;
  name: string;
  phone: string;
  email?: string;
  department?: string;
  error?: string;
}

interface ImportPreviewProps {
  data: ImportRow[];
  showErrors?: boolean;
}

export function ImportPreview({ data, showErrors = false }: ImportPreviewProps) {
  const validRows = data.filter((row) => !row.error);
  const errorRows = data.filter((row) => row.error);

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 rounded-lg border bg-green-50 px-4 py-2 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <div className="text-sm font-medium text-green-900 dark:text-green-100">
              有效数据
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {validRows.length}
            </div>
          </div>
        </div>

        {errorRows.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-red-50 px-4 py-2 dark:bg-red-950">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <div className="text-sm font-medium text-red-900 dark:text-red-100">
                错误数据
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {errorRows.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">行号</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>部门</TableHead>
              {showErrors && <TableHead>状态</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showErrors ? 7 : 6} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.row}
                  className={row.error ? 'bg-red-50 dark:bg-red-950/20' : ''}
                >
                  <TableCell className="font-medium">{row.row}</TableCell>
                  <TableCell>{row.username}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.email || '-'}</TableCell>
                  <TableCell>{row.department || '-'}</TableCell>
                  {showErrors && (
                    <TableCell>
                      {row.error ? (
                        <Badge variant="destructive" className="whitespace-nowrap">
                          {row.error}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="whitespace-nowrap">
                          有效
                        </Badge>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 错误提示 */}
      {errorRows.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100">
                发现 {errorRows.length} 条错误数据
              </h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                请修正错误后重新上传，或者选择跳过错误数据继续导入。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
