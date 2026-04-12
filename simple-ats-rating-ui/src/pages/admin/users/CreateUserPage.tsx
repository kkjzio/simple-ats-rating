/**
 * 创建用户页面
 */
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import type { CreateUserRequest } from '@/types/user';
import userService from '@/services/user.service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserForm } from '@/components/admin/users';

export function CreateUserPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // 创建用户mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userService.createUser(data),
    onSuccess: () => {
      toast.success('用户创建成功', '成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/admin/users');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '创建用户时发生错误',
        '创建失败'
      );
    },
  });

  const handleSubmit = (data: any) => {
    const createData: CreateUserRequest = {
      username: data.username,
      password: data.password,
      role: data.role,
      profile: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        department: data.department || null,
      },
    };
    createMutation.mutate(createData);
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

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
          <h1 className="text-3xl font-bold tracking-tight">创建用户</h1>
          <p className="text-muted-foreground">添加新的系统用户</p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
