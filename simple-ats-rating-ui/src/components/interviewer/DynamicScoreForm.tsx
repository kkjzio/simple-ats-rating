/**
 * 动态评分表单组件
 * 根据评分模板动态生成表单字段
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Info } from 'lucide-react';
import { ScoreType, type Dimension, type TextField } from '@/types/template';
import type { SaveScoreDraftRequest } from '@/types/score';

interface DynamicScoreFormProps {
  /** 评分维度 */
  dimensions: Dimension[];
  /** 文本评语字段 */
  textFields: TextField[];
  /** 初始值（编辑草稿时） */
  initialValues?: SaveScoreDraftRequest;
  /** 是否只读 */
  readOnly?: boolean;
  /** 表单提交回调 */
  onSubmit?: (data: SaveScoreDraftRequest) => void;
  /** 表单变化回调（用于自动保存） */
  onChange?: (data: SaveScoreDraftRequest) => void;
}

/**
 * 动态评分表单组件
 */
export const DynamicScoreForm: React.FC<DynamicScoreFormProps> = ({
  dimensions,
  textFields,
  initialValues,
  readOnly = false,
  onSubmit,
  onChange,
}) => {
  // 动态构建验证schema
  const formSchema = useMemo(() => {
    const dimensionSchemas: Record<string, z.ZodNumber> = {};
    const textFieldSchemas: Record<string, z.ZodString> = {};

    // 维度验证
    dimensions.forEach((dim) => {
      dimensionSchemas[dim.name] = z
        .number({
          message: `"${dim.name}"必须是数字`,
        })
        .min(0, `"${dim.name}"不能小于0`)
        .max(dim.max_score, `"${dim.name}"不能大于${dim.max_score}`);
    });

    // 文本字段验证
    textFields.forEach((field) => {
      let schema: any;
      
      if (field.required) {
        schema = z.string().min(1, `"${field.name}"为必填项`);
      } else {
        schema = z.string().optional();
      }
      
      if (field.max_length && field.required) {
        schema = schema.max(field.max_length, `"${field.name}"不能超过${field.max_length}个字符`);
      }
      
      textFieldSchemas[field.name] = schema;
    });

    return z.object({
      dimensions: z.object(dimensionSchemas),
      textFields: z.object(textFieldSchemas),
    });
  }, [dimensions, textFields]);

  // 初始化表单默认值
  const defaultValues = useMemo(() => {
    const dimensionDefaults: Record<string, number> = {};
    const textFieldDefaults: Record<string, string> = {};

    if (initialValues) {
      // 使用初始值
      initialValues.dimension_scores.forEach((score) => {
        dimensionDefaults[score.dimension_name] = score.score;
      });
      initialValues.text_feedbacks?.forEach((feedback) => {
        textFieldDefaults[feedback.field_name] = feedback.content;
      });
    } else {
      // 默认值
      dimensions.forEach((dim) => {
        dimensionDefaults[dim.name] = 0;
      });
      textFields.forEach((field) => {
        textFieldDefaults[field.name] = '';
      });
    }

    return {
      dimensions: dimensionDefaults,
      textFields: textFieldDefaults,
    };
  }, [dimensions, textFields, initialValues]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  const defaultValuesSignatureRef = useRef<string>('');

  useEffect(() => {
    const signature = JSON.stringify(defaultValues);
    if (defaultValuesSignatureRef.current === signature) {
      return;
    }

    defaultValuesSignatureRef.current = signature;
    form.reset(defaultValues);
  }, [defaultValues, form]);

  // 监听表单变化
  useEffect(() => {
    if (!onChange) return;

    const subscription = form.watch((value) => {
      const data = convertFormDataToRequest(value as any);
      onChange(data);
    });

    return () => subscription.unsubscribe();
  }, [form, onChange]);

  /**
   * 转换表单数据为请求格式
   */
  const convertFormDataToRequest = (data: z.infer<typeof formSchema>): SaveScoreDraftRequest => {
    return {
      dimension_scores: Object.entries(data.dimensions).map(([name, score]) => ({
        dimension_name: name,
        score: score as number,
      })),
      text_feedbacks: Object.entries(data.textFields)
        .filter(([_, content]) => content && content.trim())
        .map(([name, content]) => ({
          field_name: name,
          content: content as string,
        })),
    };
  };

  /**
   * 计算加权总分
   */
  const calculateTotalScore = (scores: Record<string, number>): number => {
    return dimensions.reduce((total, dim) => {
      const score = scores[dim.name] || 0;
      const weighted = (score / dim.max_score) * dim.weight;
      return total + weighted;
    }, 0);
  };

  const watchedScores = form.watch('dimensions');
  const totalScore = useMemo(
    () => calculateTotalScore(watchedScores),
    [watchedScores, dimensions]
  );

  /**
   * 渲染星级选择器
   */
  const renderStarInput = (value: number, onChange: (value: number) => void, maxScore: number) => {
    const stars = Array.from({ length: maxScore }, (_, i) => i + 1);
    
    return (
      <div className="flex items-center gap-1">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readOnly && onChange(star)}
            disabled={readOnly}
            className="focus:outline-none disabled:cursor-not-allowed"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              } ${!readOnly && 'hover:text-yellow-400 hover:fill-yellow-400'}`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value} / {maxScore}
        </span>
      </div>
    );
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    if (onSubmit) {
      onSubmit(convertFormDataToRequest(data));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 总分显示 */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">加权总分</p>
                <p className="text-3xl font-bold text-primary">{totalScore.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">满分</p>
                <p className="text-2xl font-semibold">100.00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 评分维度 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">评分维度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensions.map((dimension) => (
              <FormField
                key={dimension.name}
                control={form.control}
                name={`dimensions.${dimension.name}`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start justify-between mb-2">
                      <FormLabel className="text-base font-semibold">
                        {dimension.name}
                        <Badge variant="secondary" className="ml-2">
                          权重 {dimension.weight}%
                        </Badge>
                      </FormLabel>
                      <span className="text-sm text-muted-foreground">
                        最高 {dimension.max_score} 分
                      </span>
                    </div>
                    
                    {dimension.description && (
                      <FormDescription className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{dimension.description}</span>
                      </FormDescription>
                    )}

                    <FormControl>
                      {dimension.score_type === ScoreType.STAR ? (
                        // 星级评分
                        renderStarInput(
                          field.value as number,
                          field.onChange,
                          dimension.max_score
                        )
                      ) : dimension.score_type === ScoreType.DECIMAL ? (
                        // 小数评分
                        <div className="space-y-2">
                          <Slider
                            value={[field.value as number]}
                            onValueChange={(values) => field.onChange(values[0])}
                            max={dimension.max_score}
                            step={0.1}
                            disabled={readOnly}
                            className="w-full"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={field.value}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) field.onChange(val);
                              }}
                              min={0}
                              max={dimension.max_score}
                              step={0.1}
                              disabled={readOnly}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">分</span>
                          </div>
                        </div>
                      ) : (
                        // 整数评分
                        <div className="space-y-2">
                          <Slider
                            value={[field.value as number]}
                            onValueChange={(values) => field.onChange(values[0])}
                            max={dimension.max_score}
                            step={1}
                            disabled={readOnly}
                            className="w-full"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={field.value}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) field.onChange(val);
                              }}
                              min={0}
                              max={dimension.max_score}
                              step={1}
                              disabled={readOnly}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">分</span>
                          </div>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        {/* 文本评语 */}
        {textFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">文本评语</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {textFields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={`textFields.${field.name}`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>
                        {field.name}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={field.placeholder || `请输入${field.name}`}
                          maxLength={field.max_length}
                          disabled={readOnly}
                          rows={4}
                          {...formField}
                        />
                      </FormControl>
                      {field.max_length && (
                        <FormDescription className="text-right">
                          {(formField.value as string)?.length || 0} / {field.max_length}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
};

export default DynamicScoreForm;
