/**
 * 批量导入候选人对话框
 * 支持Excel文件上传、预览、错误提示和导入进度
 */

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, X, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription } from '../../ui/alert';
import { candidateService } from '../../../services';

interface ImportCandidatesDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 场次ID */
  sessionId: string;
  /** 关闭回调 */
  onClose: () => void;
  /** 导入成功回调 */
  onSuccess?: (result: { success: number; failed: number }) => void;
}

/**
 * 批量导入候选人对话框
 */
export const ImportCandidatesDialog: React.FC<ImportCandidatesDialogProps> = ({
  open,
  sessionId,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [importResult, setImportResult] = React.useState<{
    success: number;
    failed: number;
    errors?: any[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // 配置文件上传
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
          setFile(selectedFile);
          setError(null);
          setImportResult(null);
        }
      }
    },
  });

  // 下载模板
  const handleDownloadTemplate = () => {
    candidateService.downloadTemplate();
  };

  // 移除文件
  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setImportResult(null);
  };

  // 导入文件
  const handleImport = async () => {
    if (!file) {
      setError('请先选择文件');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await candidateService.importCandidates(sessionId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setImportResult(result);

      // 如果全部成功，延迟关闭对话框
      if (result.failed === 0) {
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result);
          }
          handleClose();
        }, 1500);
      } else if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      setError(err.message || '导入失败，请检查文件格式');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setFile(null);
    setError(null);
    setImportResult(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>批量导入候选人</DialogTitle>
          <DialogDescription>
            上传Excel文件批量导入候选人信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 下载模板 */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">导入模板</p>
                <p className="text-xs text-muted-foreground">
                  下载CSV模板，按格式填写：姓名、手机、邮箱、备注
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              下载模板
            </Button>
          </div>

          {/* 文件上传区域 */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {isDragActive
                  ? '释放文件以上传'
                  : '拖拽文件到此处，或点击选择文件'}
              </p>
              <p className="text-xs text-muted-foreground">
                支持 CSV、XLS、XLSX 格式，列顺序：姓名*、手机*、邮箱、备注
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                {!isUploading && !importResult && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* 上传进度 */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    正在导入... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 导入结果 */}
          {importResult && (
            <div className="space-y-3">
              <Alert
                variant={importResult.failed === 0 ? 'default' : 'destructive'}
              >
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">导入完成</p>
                    <p className="text-sm">
                      成功导入 {importResult.success} 条，失败 {importResult.failed} 条
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* 错误详情 */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">错误详情：</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {importResult.errors.map((err, index) => (
                      <li key={index}>
                        第 {err.row} 行: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {importResult ? '关闭' : '取消'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!file || isUploading}
            >
              {isUploading ? '导入中...' : '开始导入'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCandidatesDialog;
