/**
 * 模板表单组件
 * 支持创建和编辑模式，包含完整的表单验证
 */

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import type { TemplateResponse, CreateTemplateRequest } from '../../../types';
import { ScoreType } from '../../../types';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { DimensionEditor } from './DimensionEditor';
import { TextFieldEditor } from './TextFieldEditor';

/**
 * 维度Schema验证
 */
const dimensionSchema = z.object({
  name: z.string().min(1, '维度名称不能为空').max(50, '维度名称不能超过50个字符'),
  description: z.string().optional().nullable(),
  score_type: z.nativeEnum(ScoreType).optional(),
  max_score: z.number().min(1, '最大分值必须大于0').max(1000, '最大分值不能超过1000'),
  weight: z.number().min(0, '权重不能小于0').max(100, '权重不能超过100'),
});

/**
 * 文本字段Schema验证
 */
const textFieldSchema = z.object({
  name: z.string().min(1, '字段名称不能为空').max(50, '字段名称不能超过50个字符'),
  required: z.boolean().optional(),
  max_length: z.number().min(1, '最大字符数必须大于0').optional().nullable(),
  placeholder: z.string().optional().nullable(),
});

/**
 * 模板表单Schema验证
 */
const templateFormSchema = z.object({
  name: z.string().min(1, '模板名称不能为空').max(100, '模板名称不能超过100个字符'),
  description: z.string().max(500, '模板描述不能超过500个字符').optional().nullable(),
  dimensions: z.array(dimensionSchema).min(1, '至少需要一个评分维度'),
  text_fields: z.array(textFieldSchema).optional(),
}).refine(
  (data) => {
    // 验证权重总和必须等于100
    const totalWeight = data.dimensions.reduce((sum, dim) => sum + dim.weight, 0);
    return totalWeight === 100;
  },
  {
    message: '所有维度的权重总和必须等于100%',
    path: ['dimensions'],
  }
);

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  /** 初始数据（编辑模式） */
  initialData?: TemplateResponse;
  /** 提交回调 */
  onSubmit: (data: CreateTemplateRequest) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

/**
 * 模板表单组件
 */
export function TemplateForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TemplateFormProps) {
  const isEditMode = !!initialData;

  // 初始化表单
  const methods = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      dimensions: [],
      text_fields: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  // 编辑模式下加载初始数据
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        dimensions: initialData.dimensions.map((dim) => ({
          name: dim.name,
          description: dim.description || '',
          score_type: dim.score_type,
          max_score: dim.max_score,
          weight: dim.weight,
        })),
        text_fields: initialData.text_fields.map((field) => ({
          name: field.name,
          required: field.required || false,
          max_length: field.max_length || null,
          placeholder: field.placeholder || '',
        })),
      });
    }
  }, [initialData, reset]);

  /**
   * 处理表单提交
   */
  const handleFormSubmit = (data: TemplateFormData) => {
    const submitData: CreateTemplateRequest = {
      name: data.name,
      description: data.description || null,
      dimensions: data.dimensions.map((dim) => ({
        name: dim.name,
        description: dim.description || null,
        score_type: dim.score_type,
        max_score: dim.max_score,
        weight: dim.weight,
      })),
      text_fields: data.text_fields?.map((field) => ({
        name: field.name,
        required: field.required || false,
        max_length: field.max_length || undefined,
        placeholder: field.placeholder || null,
      })),
    };

    onSubmit(submitData);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>设置模板的名称和描述</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 模板名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                模板名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="例如：技术岗位评分模板"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* 模板描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">模板描述</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="描述该模板的用途和适用场景..."
                rows={3}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 评分维度 */}
        <Card>
          <CardHeader>
            <CardTitle>评分维度</CardTitle>
            <CardDescription>
              设置评分的各个维度，权重总和必须等于100%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DimensionEditor />
            {errors.dimensions && (
              <p className="text-sm text-destructive mt-2">
                {typeof errors.dimensions === 'object' && 'message' in errors.dimensions
                  ? (errors.dimensions as any).message
                  : '请检查维度配置'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 文本评语字段 */}
        <Card>
          <CardHeader>
            <CardTitle>文本评语字段</CardTitle>
            <CardDescription>
              设置需要评委填写的文本评语字段（可选）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextFieldEditor />
            {errors.text_fields && (
              <p className="text-sm text-destructive mt-2">
                {typeof errors.text_fields === 'object' && 'message' in errors.text_fields
                  ? (errors.text_fields as any).message
                  : '请检查文本字段配置'}
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? '保存修改' : '创建模板'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
