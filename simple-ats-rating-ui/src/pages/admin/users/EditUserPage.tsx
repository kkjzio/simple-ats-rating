/**
 * 编辑用户页面
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import type { UpdateUserRequest } from '@/types/user';
import userService from '@/services/user.service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/admin/users';
import { Loading } from '@/components/common/Loading';

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // 获取用户详情
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id!),
    enabled: !!id,
  });

  // 更新用户mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => userService.updateUser(id!, data),
    onSuccess: () => {
      toast.success('用户更新成功', '成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      navigate('/admin/users');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '更新用户时发生错误',
        '更新失败'
      );
    },
  });

  const handleSubmit = (data: any) => {
    const updateData: UpdateUserRequest = {
      profile: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        department: data.department || null,
      },
      status: data.status,
    };
    updateMutation.mutate(updateData);
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">加载失败</p>
          <p className="text-sm text-muted-foreground">
            {(error as any).response?.data?.message || '获取用户信息时发生错误'}
          </p>
          <Button className="mt-4" onClick={() => navigate('/admin/users')}>
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑用户</h1>
          <p className="text-muted-foreground">
            {user ? `编辑用户: ${user.username}` : '加载中...'}
          </p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : user ? (
            <UserForm
              mode="edit"
              user={user}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={updateMutation.isPending}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
