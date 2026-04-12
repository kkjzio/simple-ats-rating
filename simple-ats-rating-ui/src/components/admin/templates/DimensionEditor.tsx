/**
 * 评分维度编辑器组件
 * 支持拖拽排序、动态添加/删除维度、实时权重计算
 */

import { useFieldArray, useFormContext } from 'react-hook-form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Progress } from '../../ui/progress';
import { Card } from '../../ui/card';
import { ScoreType } from '../../../types';

interface DimensionEditorProps {
  /** 字段名称前缀 */
  name?: string;
}

/**
 * 单个维度项组件
 */
function DimensionItem({ id, index }: { id: string; index: number }) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dimensionsErrors = errors.dimensions as any;
  const dimensionErrors = dimensionsErrors?.[index];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border"
    >
      {/* 拖拽手柄 */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-8"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* 维度表单 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 维度名称 */}
        <div className="space-y-2">
          <Label htmlFor={`dimensions.${index}.name`}>
            维度名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`dimensions.${index}.name`}
            {...register(`dimensions.${index}.name`)}
            placeholder="例如：技术能力"
          />
          {dimensionErrors?.name && (
            <p className="text-sm text-destructive">{dimensionErrors.name.message}</p>
          )}
        </div>

        {/* 评分类型 */}
        <div className="space-y-2">
          <Label htmlFor={`dimensions.${index}.score_type`}>评分类型</Label>
          <Select
            value={watch(`dimensions.${index}.score_type`) || ScoreType.INTEGER}
            onValueChange={(value) => setValue(`dimensions.${index}.score_type`, value)}
          >
            <SelectTrigger id={`dimensions.${index}.score_type`}>
              <SelectValue placeholder="选择评分类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ScoreType.INTEGER}>整数</SelectItem>
              <SelectItem value={ScoreType.DECIMAL}>小数</SelectItem>
              <SelectItem value={ScoreType.STAR}>星级</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 最大分值 */}
        <div className="space-y-2">
          <Label htmlFor={`dimensions.${index}.max_score`}>
            最大分值 <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`dimensions.${index}.max_score`}
            type="number"
            min="1"
            step="1"
            {...register(`dimensions.${index}.max_score`, { valueAsNumber: true })}
            placeholder="例如：100"
          />
          {dimensionErrors?.max_score && (
            <p className="text-sm text-destructive">{dimensionErrors.max_score.message}</p>
          )}
        </div>

        {/* 权重 */}
        <div className="space-y-2">
          <Label htmlFor={`dimensions.${index}.weight`}>
            权重 (%) <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`dimensions.${index}.weight`}
            type="number"
            min="0"
            max="100"
            step="1"
            {...register(`dimensions.${index}.weight`, { valueAsNumber: true })}
            placeholder="例如：30"
          />
          {dimensionErrors?.weight && (
            <p className="text-sm text-destructive">{dimensionErrors.weight.message}</p>
          )}
        </div>

        {/* 维度描述 */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`dimensions.${index}.description`}>维度描述</Label>
          <Textarea
            id={`dimensions.${index}.description`}
            {...register(`dimensions.${index}.description`)}
            placeholder="描述该维度的评分标准..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 维度编辑器组件
 */
export function DimensionEditor({ name = 'dimensions' }: DimensionEditorProps) {
  const { control, watch } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  /**
   * 添加新维度
   */
  const handleAddDimension = () => {
    append({
      name: '',
      description: '',
      score_type: ScoreType.INTEGER,
      max_score: 100,
      weight: 0,
    });
  };

  /**
   * 计算权重总和
   */
  const dimensions = watch(name) || [];
  const totalWeight = dimensions.reduce((sum: number, dim: any) => {
    const weight = parseFloat(dim.weight) || 0;
    return sum + weight;
  }, 0);

  const isWeightValid = totalWeight === 100;
  const weightProgress = Math.min(totalWeight, 100);

  return (
    <div className="space-y-4">
      {/* 权重总和显示 */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>权重总和</Label>
            <span
              className={`text-sm font-medium ${
                isWeightValid
                  ? 'text-green-600'
                  : totalWeight > 100
                  ? 'text-destructive'
                  : 'text-yellow-600'
              }`}
            >
              {totalWeight}%
            </span>
          </div>
          <Progress value={weightProgress} className="h-2" />
          {!isWeightValid && (
            <p className="text-sm text-muted-foreground">
              {totalWeight > 100
                ? '权重总和超过100%，请调整'
                : '权重总和必须等于100%'}
            </p>
          )}
        </div>
      </Card>

      {/* 维度列表 */}
      {fields.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="relative">
                  <DimensionItem id={field.id} index={index} />
                  {/* 删除按钮 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-destructive hover:text-destructive"
                    title="删除维度"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          暂无评分维度，请添加
        </div>
      )}

      {/* 添加维度按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddDimension}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加评分维度
      </Button>
    </div>
  );
}
