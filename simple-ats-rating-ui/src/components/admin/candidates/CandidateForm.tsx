/**
 * 候选人表单组件
 * 支持创建和编辑模式，包含表单验证和多文件简历上传
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import type { CandidateResponse, CreateCandidateRequest } from '../../../types';

// 表单验证schema
const candidateFormSchema = z.object({
  name: z.string().min(1, '请输入姓名').max(50, '姓名不能超过50个字符'),
  phone: z
    .string()
    .min(1, '请输入手机号')
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
  email: z
    .string()
    .email('请输入有效的邮箱地址')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
});

type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  /** 初始数据（编辑模式） */
  initialData?: CandidateResponse;
  /** 提交回调 */
  onSubmit: (data: CreateCandidateRequest) => void;
  /** 删除已有简历文件回调（编辑模式） */
  onDeleteExistingFile?: (fileIndex: number) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

/**
 * 候选人表单组件
 */
export const CandidateForm: React.FC<CandidateFormProps> = ({
  initialData,
  onSubmit,
  onDeleteExistingFile,
  onCancel,
  isSubmitting = false,
}) => {
  // 新选择的文件列表（待上传）
  const [newFiles, setNewFiles] = React.useState<File[]>([]);

  // 初始化表单
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      notes: initialData?.notes || '',
    },
  });

  // 已有简历文件列表（编辑模式）
  const existingFiles = initialData?.resume_files ?? (
    initialData?.resume_url
      ? [{ url: initialData.resume_url, filename: initialData.resume_filename || '已上传简历' }]
      : []
  );

  // 配置多文件简历上传
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setNewFiles((prev) => [...prev, ...acceptedFiles]);
      }
    },
  });

  // 移除新选择的文件
  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 处理表单提交
  const handleSubmit = (values: CandidateFormValues) => {
    const data: CreateCandidateRequest = {
      name: values.name,
      phone: values.phone,
      email: values.email || null,
      notes: values.notes ?? null,
      resumes: newFiles.length > 0 ? newFiles : null,
    };

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">基本信息</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 姓名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    姓名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 手机 */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    手机 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="请输入手机号" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 邮箱 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="请输入邮箱地址"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 备注 */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>备注</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="请输入备注信息"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 简历上传 */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">简历文件</h3>

          {/* 已有简历文件列表（编辑模式） */}
          {existingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">已上传的简历文件：</p>
              {existingFiles.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg px-4 py-3 flex items-center justify-between bg-muted/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm truncate">
                      {file.filename || `简历文件 ${index + 1}`}
                    </span>
                  </div>
                  {onDeleteExistingFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      onClick={() => onDeleteExistingFile(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 新文件列表（待上传） */}
          {newFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">待上传的文件：</p>
              {newFiles.map((file, index) => (
                <div
                  key={index}
                  className="border rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveNewFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 拖拽上传区域 */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-colors
              ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              {isDragActive
                ? '释放文件以上传'
                : existingFiles.length > 0 || newFiles.length > 0
                ? '继续拖拽或点击添加更多简历文件'
                : '拖拽文件到此处，或点击选择文件'}
            </p>
            <p className="text-xs text-muted-foreground">
              支持 PDF、DOC、DOCX 格式，可选择多个文件
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : initialData ? '更新' : '创建'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CandidateForm;