/**
 * 模板列表页面
 * 包含搜索、筛选、分页功能
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import templateService from '../../../services/template.service';
import { useUIStore } from '../../../stores';
import type { TemplateQueryParams } from '../../../types';
import { ToastType } from '../../../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { TemplateTable } from '../../../components/admin/templates';
import { EmptyState } from '../../../components/common/EmptyState';
import { Loading } from '../../../components/common/Loading';

/**
 * 模板列表页面
 */
export default function TemplateListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useUIStore();

  // 查询参数状态
  const [params, setParams] = useState<TemplateQueryParams>({
    page: 1,
    page_size: 10,
    keyword: '',
  });

  // 搜索关键词（用于输入框）
  const [searchKeyword, setSearchKeyword] = useState('');

  // 获取模板列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', params],
    queryFn: () => templateService.getTemplates(params),
  });

  // 删除模板
  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.deleteTemplate(id),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '模板删除成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '删除模板失败');
    },
  });

  // 设置默认模板
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => templateService.setDefaultTemplate(id),
    onSuccess: () => {
      showToast(ToastType.SUCCESS, '默认模板设置成功');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error: any) => {
      showToast(ToastType.ERROR, error.message || '设置默认模板失败');
    },
  });

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    setParams((prev) => ({
      ...prev,
      keyword: searchKeyword,
      page: 1,
    }));
  };

  /**
   * 处理搜索框回车
   */
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 处理页码变化
   */
  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  /**
   * 处理每页数量变化
   */
  const handlePageSizeChange = (pageSize: string) => {
    setParams((prev) => ({
      ...prev,
      page_size: parseInt(pageSize),
      page: 1,
    }));
  };

  /**
   * 处理删除模板
   */
  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  /**
   * 处理设置默认模板
   */
  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={(error as any).message || '无法加载模板列表'}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">评分模板管理</h1>
          <p className="text-muted-foreground mt-2">
            管理评分模板，设置评分维度和文本评语字段
          </p>
        </div>
        <Button onClick={() => navigate('/admin/templates/create')}>
          <Plus className="h-4 w-4 mr-2" />
          创建模板
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索模板</CardTitle>
          <CardDescription>根据模板名称搜索</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Input
                placeholder="输入模板名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模板列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>模板列表</CardTitle>
              <CardDescription>
                共 {data?.total || 0} 个模板
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">每页显示</span>
              <Select
                value={params.page_size?.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : data && data.items.length > 0 ? (
            <>
              <TemplateTable
                templates={data.items}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />

              {/* 分页控制 */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    第 {data.page} 页，共 {data.total_pages} 页
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page - 1)}
                      disabled={data.page <= 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page + 1)}
                      disabled={data.page >= data.total_pages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="暂无模板"
              description="还没有创建任何模板，点击上方按钮创建第一个模板"
              actionText="创建模板"
              onAction={() => navigate('/admin/templates/create')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
