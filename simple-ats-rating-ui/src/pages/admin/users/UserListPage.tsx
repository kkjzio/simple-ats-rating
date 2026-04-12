/**
 * 用户列表页面
 * 提供用户列表展示、搜索、筛选、分页等功能
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserResponse, UserQueryParams } from '@/types/user';
import { UserStatus } from '@/types/user';
import userService from '@/services/user.service';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserTable, UserFilters } from '@/components/admin/users';
import { Loading } from '@/components/common/Loading';

export function UserListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // 查询参数状态
  const [queryParams, setQueryParams] = useState<UserQueryParams>({
    page: 1,
    page_size: 10,
  });

  // 删除确认对话框状态
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);

  // 重置密码对话框状态
  const [resetPasswordUser, setResetPasswordUser] = useState<UserResponse | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 获取用户列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: () => userService.getUsers(queryParams),
    refetchInterval: false, // 禁用自动轮询
    refetchOnMount: true, // 仅在组件挂载时获取
    refetchOnWindowFocus: false, // 禁用窗口聚焦时重新获取
    refetchOnReconnect: false, // 禁用重新连接时重新获取
  });

  // 删除用户mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      toast.success('用户已成功删除', '删除成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '删除用户时发生错误',
        '删除失败'
      );
    },
  });

  // 切换用户状态mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) =>
      userService.updateUser(userId, { status }),
    onSuccess: () => {
      toast.success('用户状态已更新', '状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '更新用户状态时发生错误',
        '状态更新失败'
      );
    },
  });

  // 重置密码mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (data: { user_id: string; new_password: string }) =>
      userService.resetPassword(data),
    onSuccess: (data) => {
      toast.success(
        `用户 "${data.username}" 的密码已成功重置`,
        '重置密码成功'
      );
      setResetPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || '重置密码时发生错误',
        '重置密码失败'
      );
    },
  });

  // 处理筛选变化
  const handleFilterChange = useCallback((filters: {
    keyword?: string;
    role?: string;
    status?: string;
  }) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      keyword: filters.keyword,
      role: filters.role,
      status: filters.status,
    }));
  }, []);

  // 处理页码变化
  const handlePageChange = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  // 处理每页数量变化
  const handlePageSizeChange = useCallback((pageSize: string) => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      page_size: parseInt(pageSize),
    }));
  }, []);

  // 处理编辑
  const handleEdit = useCallback((user: UserResponse) => {
    navigate(`/admin/users/${user.id}/edit`);
  }, [navigate]);

  // 处理删除
  const handleDelete = useCallback((user: UserResponse) => {
    setDeleteUser(user);
  }, []);

  // 确认删除
  const confirmDelete = useCallback(() => {
    if (deleteUser) {
      deleteMutation.mutate(deleteUser.id);
    }
  }, [deleteUser, deleteMutation]);

  // 处理状态切换
  const handleToggleStatus = useCallback((user: UserResponse, enabled: boolean) => {
    const status = enabled ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    toggleStatusMutation.mutate({ userId: user.id, status });
  }, [toggleStatusMutation]);

  // 处理重置密码
  const handleResetPassword = useCallback((user: UserResponse) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }, []);

  // 确认重置密码
  const confirmResetPassword = useCallback(() => {
    if (!resetPasswordUser) return;

    // 验证密码
    if (!newPassword) {
      setPasswordError('请输入新密码');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
      setPasswordError('密码长度必须在8-20位之间');
      return;
    }

    // 验证密码强度：必须包含大小写字母、数字和特殊字符
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setPasswordError('密码必须包含大小写字母、数字和特殊字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    // 调用重置密码接口
    resetPasswordMutation.mutate({
      user_id: resetPasswordUser.id,
      new_password: newPassword,
    });
  }, [resetPasswordUser, newPassword, confirmPassword, resetPasswordMutation]);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">加载失败</p>
          <p className="text-sm text-muted-foreground">
            {(error as any).response?.data?.message || '获取用户列表时发生错误'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户账号</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/users/import')}
          >
            <Upload className="mr-2 h-4 w-4" />
            批量导入评委
          </Button>
          <Button onClick={() => navigate('/admin/users/create')}>
            <Plus className="mr-2 h-4 w-4" />
            创建用户
          </Button>
        </div>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <UserFilters onFilterChange={handleFilterChange} />
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            用户列表
            {data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                共 {data.total} 条记录
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading />
          ) : data && data.items.length > 0 ? (
            <>
              <UserTable
                data={data.items}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onResetPassword={handleResetPassword}
              />

              {/* 分页控制 */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页显示</span>
                  <Select
                    value={queryParams.page_size?.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 条</SelectItem>
                      <SelectItem value="20">20 条</SelectItem>
                      <SelectItem value="50">50 条</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 {data.page} / {data.total_pages} 页
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page - 1)}
                      disabled={data.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.page + 1)}
                      disabled={data.page >= data.total_pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium">暂无用户</p>
                <p className="text-sm text-muted-foreground">
                  点击"创建用户"按钮添加新用户
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 "{deleteUser?.username}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码对话框 */}
      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => {
          if (!open) {
            setResetPasswordUser(null);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 "{resetPasswordUser?.username}" 设置新密码
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
              />
              <p className="text-xs text-muted-foreground">
                密码长度8-20位，必须包含大小写字母、数字和特殊字符
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
              />
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordUser(null);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
            >
              取消
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? '重置中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
