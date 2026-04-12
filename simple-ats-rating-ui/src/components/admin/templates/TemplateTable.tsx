/**
 * 模板列表表格组件
 */

import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, Star } from 'lucide-react';
import type { TemplateResponse } from '../../../types';
import { formatDate } from '../../../utils/format';
import { useUIStore } from '../../../stores';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface TemplateTableProps {
  /** 模板列表 */
  templates: TemplateResponse[];
  /** 删除模板回调 */
  onDelete: (id: string) => void;
  /** 设置默认模板回调 */
  onSetDefault: (id: string) => void;
  /** 是否正在加载 */
  isLoading?: boolean;
}

/**
 * 模板列表表格组件
 */
export function TemplateTable({
  templates,
  onDelete,
  onSetDefault,
  isLoading = false,
}: TemplateTableProps) {
  const navigate = useNavigate();
  const { showConfirm } = useUIStore();

  /**
   * 打开删除确认对话框
   */
  const handleDeleteClick = (id: string, name: string) => {
    showConfirm(
      {
        title: '删除模板',
        message: `确定要删除模板"${name}"吗？此操作无法撤销。`,
        confirmText: '删除',
        cancelText: '取消',
        confirmType: 'danger',
      },
      () => onDelete(id)
    );
  };

  /**
   * 处理设置默认模板
   */
  const handleSetDefault = (id: string) => {
    onSetDefault(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">暂无模板</p>
        <Button onClick={() => navigate('/admin/templates/create')}>
          创建第一个模板
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模板名称</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="text-center">维度数量</TableHead>
              <TableHead className="text-center">状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {template.name}
                    {template.is_default && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        默认
                      </Badge>
                    )}
                    {template.is_system && (
                      <Badge variant="secondary">系统</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {template.description || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {template.dimensions.length}
                </TableCell>
                <TableCell className="text-center">
                  {template.is_default ? (
                    <Badge variant="default">默认模板</Badge>
                  ) : (
                    <Badge variant="outline">普通模板</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(template.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/templates/${template.id}`)}
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {/* 设置为默认按钮 - 所有非默认模板都可以设置 */}
                    {!template.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(template.id)}
                        title="设置为默认"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* 编辑和删除按钮 - 仅非系统模板可用 */}
                    {!template.is_system && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/templates/${template.id}/edit`)}
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(template.id, template.name)}
                          title="删除"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
