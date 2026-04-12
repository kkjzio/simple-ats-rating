/**
 * 场次表单组件
 * 用于创建和编辑场次，支持表单验证
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-picker';
import { templateService } from '@/services';
import type { SessionResponse, CreateSessionRequest } from '@/types';

/**
 * 表单验证Schema
 */
const sessionFormSchema = z.object({
  name: z.string().min(1, '场次名称不能为空').max(100, '场次名称不能超过100个字符'),
  description: z.string().optional().or(z.literal('')),
  position: z.string().min(1, '面试岗位不能为空').max(100, '岗位名称不能超过100个字符'),
  scoring_template_id: z.string().min(1, '请选择评分模板'),
  date: z.date({ message: '请选择面试日期' }),
  anonymous_mode: z.boolean(),
  pass_threshold: z.number().min(0, '通过分数线不能小于0').max(100, '通过分数线不能大于100'),
  extreme_score_threshold: z.number().min(0, '极端分预警阈值不能小于0').max(100, '极端分预警阈值不能大于100'),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface SessionFormProps {
  mode: 'create' | 'edit';
  initialData?: SessionResponse;
  onSubmit: (data: CreateSessionRequest) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * 场次表单组件
 */
export function SessionForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SessionFormProps) {
  // 获取模板列表
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.getTemplates({ page: 1, page_size: 100 }),
  });

  // 初始化表单
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      position: '',
      scoring_template_id: '',
      date: undefined,
      anonymous_mode: false,
      pass_threshold: 60,
      extreme_score_threshold: 30,
    },
  });

  // 编辑模式下加载初始数据
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const sessionDate = new Date(initialData.date);
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        position: initialData.position,
        scoring_template_id: initialData.scoring_template_id,
        date: sessionDate,
        anonymous_mode: initialData.settings?.anonymous_mode || false,
        pass_threshold: initialData.settings?.pass_threshold || 60,
        extreme_score_threshold: initialData.settings?.extreme_score_threshold || 30,
      });
    }
  }, [mode, initialData, form]);

  /**
   * 处理表单提交
   */
  const handleSubmit = (values: SessionFormValues) => {
    // 直接使用用户选择的Date对象转换为ISO时间戳
    // toISOString() 会自动将本地时间转换为UTC时间
    // 例如：东八区 2024-03-15 14:30 -> UTC 2024-03-15T06:30:00.000Z
    const formattedDate = values.date.toISOString();

    const submitData: CreateSessionRequest = {
      name: values.name,
      description: values.description || null,
      position: values.position,
      round: mode === 'edit' ? (initialData?.round ?? 1) : 1,
      scoring_template_id: values.scoring_template_id,
      date: formattedDate, // ISO时间戳格式，保留用户选择的完整时间
      settings: {
        anonymous_mode: values.anonymous_mode,
        pass_threshold: values.pass_threshold,
        extreme_score_threshold: values.extreme_score_threshold,
      },
    };

    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 场次名称 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>场次名称 *</FormLabel>
              <FormControl>
                <Input placeholder="例如：2024春季校招技术岗第一轮" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 场次描述 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>场次描述</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="描述本次面试的目的、要求等信息..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 面试岗位 */}
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>面试岗位 *</FormLabel>
                <FormControl>
                  <Input placeholder="例如：Java开发工程师" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 评分模板 */}
        <FormField
          control={form.control}
          name="scoring_template_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>评分模板 *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingTemplates}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="选择评分模板" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templatesData?.items.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.is_default && ' (默认)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                选择用于本场次评分的模板
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 面试时间 */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>面试时间 *</FormLabel>
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                placeholder="选择时间"
              />
              <FormDescription>
                选择面试进行的日期和时间
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 通过分数线 */}
          <FormField
            control={form.control}
            name="pass_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>通过分数线</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                  />
                </FormControl>
                <FormDescription>
                  设置候选人通过的最低分数（0-100），默认60分
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 极端分预警阈值 */}
          <FormField
            control={form.control}
            name="extreme_score_threshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>极端分预警阈值</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                  />
                </FormControl>
                <FormDescription>
                  评委评分与平均分差距超过此值时会预警（0-100），默认30分
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 匿名评分 */}
        <FormField
          control={form.control}
          name="anonymous_mode"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">匿名评分</FormLabel>
                <FormDescription>
                  开启后，评委之间无法看到彼此的评分
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? '创建场次' : '保存修改'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default SessionForm;
