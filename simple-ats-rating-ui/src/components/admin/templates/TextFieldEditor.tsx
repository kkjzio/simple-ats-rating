/**
 * 文本评语字段编辑器组件
 * 支持拖拽排序、动态添加/删除字段
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
import { Switch } from '../../ui/switch';

interface TextFieldEditorProps {
  /** 字段名称前缀 */
  name?: string;
}

/**
 * 单个文本字段项组件
 */
function TextFieldItem({ id, index }: { id: string; index: number }) {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const textFieldsErrors = errors.text_fields as any;
  const textFieldErrors = textFieldsErrors?.[index];
  const isRequired = watch(`text_fields.${index}.required`) || false;

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

      {/* 字段表单 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 字段名称 */}
        <div className="space-y-2">
          <Label htmlFor={`text_fields.${index}.name`}>
            字段名称 <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`text_fields.${index}.name`}
            {...register(`text_fields.${index}.name`)}
            placeholder="例如：综合评价"
          />
          {textFieldErrors?.name && (
            <p className="text-sm text-destructive">{textFieldErrors.name.message}</p>
          )}
        </div>

        {/* 是否必填 */}
        <div className="space-y-2">
          <Label htmlFor={`text_fields.${index}.required`}>是否必填</Label>
          <div className="flex items-center gap-2 h-10">
            <Switch
              id={`text_fields.${index}.required`}
              checked={isRequired}
              onCheckedChange={(checked) => setValue(`text_fields.${index}.required`, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {isRequired ? '必填' : '可选'}
            </span>
          </div>
        </div>

        {/* 最大字符数 */}
        <div className="space-y-2">
          <Label htmlFor={`text_fields.${index}.max_length`}>最大字符数</Label>
          <Input
            id={`text_fields.${index}.max_length`}
            type="number"
            min="1"
            step="1"
            {...register(`text_fields.${index}.max_length`, { valueAsNumber: true })}
            placeholder="例如：500"
          />
          {textFieldErrors?.max_length && (
            <p className="text-sm text-destructive">{textFieldErrors.max_length.message}</p>
          )}
        </div>

        {/* 输入提示 */}
        <div className="space-y-2">
          <Label htmlFor={`text_fields.${index}.placeholder`}>输入提示</Label>
          <Input
            id={`text_fields.${index}.placeholder`}
            {...register(`text_fields.${index}.placeholder`)}
            placeholder="例如：请输入综合评价..."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * 文本字段编辑器组件
 */
export function TextFieldEditor({ name = 'text_fields' }: TextFieldEditorProps) {
  const { control } = useFormContext();
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
   * 添加新字段
   */
  const handleAddField = () => {
    append({
      name: '',
      required: false,
      max_length: 500,
      placeholder: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* 字段列表 */}
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
                  <TextFieldItem id={field.id} index={index} />
                  {/* 删除按钮 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 text-destructive hover:text-destructive"
                    title="删除字段"
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
          暂无文本评语字段，可选择添加
        </div>
      )}

      {/* 添加字段按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddField}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加文本评语字段
      </Button>
    </div>
  );
}
