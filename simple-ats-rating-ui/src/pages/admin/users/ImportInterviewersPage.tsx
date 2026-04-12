/**
 * 批量导入评委页面
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ImportResult } from '@/types/user';
import userService from '@/services/user.service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImportPreview, type ImportRow } from '@/components/admin/users';

export function ImportInterviewersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // 导入mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => userService.importInterviewers(file),
    onSuccess: (result) => {
      setImportResult(result);
      if (result.failed === 0) {
        toast.success(`成功导入 ${result.success} 条评委数据`, '导入成功');
      } else {
        toast.warning(
          `成功 ${result.success} 条，失败 ${result.failed} 条`,
          '导入完成'
        );
      }
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '导入评委时发生错误',
        '导入失败'
      );
    },
  });

  // 处理文件上传
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);
    setImportResult(null);

    // 读取Excel文件
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return;
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // 解析数据（跳过标题行）
        const rows: ImportRow[] = jsonData.slice(1).map((row, index) => {
          const username = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          const phone = row[2]?.toString().trim() || '';
          const email = row[3]?.toString().trim() || '';
          const department = row[4]?.toString().trim() || '';

          // 验证数据
          let error = '';
          if (!username) error = '用户名不能为空';
          else if (!/^[a-zA-Z0-9_]+$/.test(username)) error = '用户名格式不正确';
          else if (!name) error = '姓名不能为空';
          else if (!phone) error = '手机号不能为空';
          else if (!/^1[3-9]\d{9}$/.test(phone)) error = '手机号格式不正确';
          else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = '邮箱格式不正确';

          return {
            row: index + 2, // Excel行号（从2开始，因为第1行是标题）
            username,
            name,
            phone,
            email,
            department,
            error,
          };
        }).filter(row => row.username || row.name || row.phone); // 过滤空行

        setPreviewData(rows);
      } catch (error) {
        toast.error('文件解析失败，请确保文件格式正确', '解析失败');
      }
    };
    reader.readAsBinaryString(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  // 下载模板
  const handleDownloadTemplate = () => {
    const template = [
      ['用户名', '姓名', '手机号', '邮箱', '部门'],
      ['zhangsan', '张三', '13800138000', 'zhangsan@example.com', '技术部'],
      ['lisi', '李四', '13800138001', 'lisi@example.com', '产品部'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '评委导入模板');
    XLSX.writeFile(wb, '评委导入模板.xlsx');
  };

  // 执行导入
  const handleImport = () => {
    if (!file) return;

    const validRows = previewData.filter(row => !row.error);
    if (validRows.length === 0) {
      toast.error('没有有效的数据可以导入', '导入失败');
      return;
    }

    importMutation.mutate(file);
  };

  // 重置
  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
  };

  const validCount = previewData.filter(row => !row.error).length;
  const errorCount = previewData.filter(row => row.error).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">批量导入评委</h1>
          <p className="text-muted-foreground">通过Excel文件批量导入评委账号</p>
        </div>
      </div>

      {/* 下载模板 */}
      <Card>
        <CardHeader>
          <CardTitle>第一步：下载模板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">评委导入模板.xlsx</p>
                <p className="text-sm text-muted-foreground">
                  下载Excel模板，按照格式填写评委信息
                </p>
              </div>
            </div>
            <Button onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 上传文件 */}
      <Card>
        <CardHeader>
          <CardTitle>第二步：上传文件</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              {isDragActive ? '释放文件以上传' : '拖拽文件到此处，或点击选择文件'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              支持 .xlsx 和 .xls 格式，单次最多上传1个文件
            </p>
            {file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 数据预览 */}
      {previewData.length > 0 && !importResult && (
        <Card>
          <CardHeader>
            <CardTitle>第三步：预览数据</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImportPreview data={previewData} showErrors />

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleReset}>
                重新上传
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? '导入中...' : `导入 ${validCount} 条数据`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 导入进度 */}
      {importMutation.isPending && (
        <Card>
          <CardHeader>
            <CardTitle>导入中...</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={50} className="w-full" />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              正在导入评委数据，请稍候...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 导入结果 */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>导入结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  总数
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {importResult.total}
                </div>
              </div>
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  成功
                </div>
                <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {importResult.success}
                </div>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950">
                <div className="text-sm font-medium text-red-900 dark:text-red-100">
                  失败
                </div>
                <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                  {importResult.failed}
                </div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 dark:text-red-100">
                      错误详情
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>
                          第 {error.row} 行: {error.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleReset}>
                继续导入
              </Button>
              <Button onClick={() => navigate('/admin/users')}>
                返回用户列表
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
