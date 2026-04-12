/**
 * 用户表单组件
 * 支持创建和编辑模式，使用 React Hook Form + Zod 进行表单验证
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserResponse } from '@/types/user';
import { UserRole, UserStatus } from '@/types/user';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 创建用户表单验证模式
const createUserSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(20, '用户名最多20个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符'),
  role: z.nativeEnum(UserRole, { message: '请选择角色' }),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  department: z.string().max(100, '部门名称最多100个字符').optional(),
});

// 编辑用户表单验证模式（不包含用户名和密码）
const editUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符'),
  role: z.nativeEnum(UserRole, { message: '请选择角色' }),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  department: z.string().max(100, '部门名称最多100个字符').optional(),
  status: z.nativeEnum(UserStatus, { message: '请选择状态' }),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserFormProps {
  mode: 'create' | 'edit';
  user?: UserResponse;
  onSubmit: (data: CreateUserFormValues | EditUserFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// 角色选项
const roleOptions = [
  { value: UserRole.SUPER_ADMIN, label: '超级管理员' },
  { value: UserRole.INTERVIEWER, label: '评委' },
  { value: UserRole.CANDIDATE, label: '候选人' },
];

// 状态选项
const statusOptions = [
  { value: UserStatus.ACTIVE, label: '启用' },
  { value: UserStatus.INACTIVE, label: '禁用' },
];

export function UserForm({ mode, user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const isEditMode = mode === 'edit';
  const schema = isEditMode ? editUserSchema : createUserSchema;

  const form = useForm<CreateUserFormValues | EditUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEditMode && user
      ? {
          name: user.profile.name,
          role: user.role,
          email: user.profile.email || '',
          phone: user.profile.phone,
          department: user.profile.department || '',
          status: user.status,
        }
      : {
          username: '',
          password: '',
          name: '',
          role: UserRole.CANDIDATE,
          email: '',
          phone: '',
          department: '',
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!isEditMode && (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户名" {...field} />
                  </FormControl>
                  <FormDescription>
                    用户名用于登录，只能包含字母、数字和下划线
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码 *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormDescription>密码至少6个字符</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名 *</FormLabel>
              <FormControl>
                <Input placeholder="请输入姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>角色 *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input type="email" placeholder="请输入邮箱" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>手机号 *</FormLabel>
              <FormControl>
                <Input placeholder="请输入手机号" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部门</FormLabel>
              <FormControl>
                <Input placeholder="请输入部门" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditMode && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>状态 *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '提交中...' : isEditMode ? '保存' : '创建'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
