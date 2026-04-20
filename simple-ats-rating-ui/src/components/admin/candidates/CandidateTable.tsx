/**
 * 候选人列表表格组件
 * 支持拖拽排序、查看、评分管理、编辑和删除操作
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, FileText, Pencil, Trash2, GripVertical, ListOrdered } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import type { CandidateResponse } from '../../../types';

interface CandidateTableProps {
  candidates: CandidateResponse[];
  loading?: boolean;
  onReorder?: (candidateIds: string[]) => void;
  onDelete?: (id: string) => void;
  onUpdateOrder?: (candidateId: string, order: number) => void;
}

interface SortableRowProps {
  candidate: CandidateResponse;
  index: number;
  onView: (id: string) => void;
  onManageScores: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateOrder: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: '待面试', variant: 'secondary' },
    completed: { label: '已完成', variant: 'default' },
    cancelled: { label: '已取消', variant: 'destructive' },
  };

  const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
};

const SortableRow: React.FC<SortableRowProps> = ({
  candidate,
  index,
  onView,
  onManageScores,
  onEdit,
  onDelete,
  onUpdateOrder,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate.id,
  });
  const displayTotalScore = candidate.total_score;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-muted/50">
      <TableCell className="w-12">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center justify-center active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{index + 1}</TableCell>
      <TableCell className="font-medium">{candidate.name}</TableCell>
      <TableCell>{candidate.gender || '-'}</TableCell>
      <TableCell>{candidate.email || '-'}</TableCell>
      <TableCell>{candidate.phone}</TableCell>
      <TableCell>{candidate.education || '-'}</TableCell>
      <TableCell>
        {candidate.work_experience !== null && candidate.work_experience !== undefined
          ? `${candidate.work_experience}年`
          : '-'}
      </TableCell>
      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
      <TableCell>
        {displayTotalScore !== null && displayTotalScore !== undefined ? (
          <span className="font-medium">{displayTotalScore.toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground">未评分</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onView(candidate.id)} title="查看详情">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onManageScores(candidate.id)} title="评分管理">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdateOrder(candidate.id)} title="修改顺序">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(candidate.id)} title="编辑">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(candidate.id)}
            title="删除"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  loading = false,
  onReorder,
  onDelete,
  onUpdateOrder,
}) => {
  const navigate = useNavigate();
  const [items, setItems] = React.useState(candidates);
  const [orderDialogOpen, setOrderDialogOpen] = React.useState(false);
  const [targetCandidateId, setTargetCandidateId] = React.useState<string | null>(null);
  const [orderInput, setOrderInput] = React.useState('');

  React.useEffect(() => {
    setItems(candidates);
  }, [candidates]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);

      setItems(newItems);

      if (onReorder) {
        onReorder(newItems.map((item) => item.id));
      }
    }
  };

  const handleView = (id: string) => {
    navigate(`/admin/candidates/${id}`);
  };

  const handleManageScores = (id: string) => {
    navigate(`/admin/candidates/${id}/scores`);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/candidates/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleOpenOrderDialog = (id: string) => {
    const candidate = items.find((c) => c.id === id);
    setTargetCandidateId(id);
    setOrderInput(candidate ? String(candidate.order) : '');
    setOrderDialogOpen(true);
  };

  const handleConfirmUpdateOrder = () => {
    const newOrder = parseInt(orderInput, 10);
    if (!targetCandidateId || isNaN(newOrder) || newOrder < 1) return;
    if (onUpdateOrder) {
      onUpdateOrder(targetCandidateId, newOrder);
    }
    setOrderDialogOpen(false);
    setTargetCandidateId(null);
    setOrderInput('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-2 text-muted-foreground">暂无候选人</p>
        <p className="text-sm text-muted-foreground">点击“创建候选人”或“批量导入”添加候选人</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-16">序号</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>手机</TableHead>
              <TableHead>教育背景</TableHead>
              <TableHead>工作经验</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>加权总分</TableHead>
              <TableHead className="w-48">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {items.map((candidate, index) => (
                <SortableRow
                  key={candidate.id}
                  candidate={candidate}
                  index={index}
                  onView={handleView}
                  onManageScores={handleManageScores}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onUpdateOrder={handleOpenOrderDialog}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>

      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>修改面试顺序</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="order-input">面试顺序（第几位上场）</Label>
            <Input
              id="order-input"
              type="number"
              min={1}
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmUpdateOrder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>取消</Button>
            <Button onClick={handleConfirmUpdateOrder}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
};

export default CandidateTable;
