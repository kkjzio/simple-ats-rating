/**
 * 用户表格组件
 * 使用 @tanstack/react-table 实现可排序、可筛选的用户列表
 */
import { useState, useMemo } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2, KeyRound } from 'lucide-react';
import { format } from 'date-fns';
import type { UserResponse } from '@/types/user';
import { UserRole, UserStatus } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserTableProps {
  data: UserResponse[];
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  onToggleStatus: (user: UserResponse, enabled: boolean) => void;
  onResetPassword: (user: UserResponse) => void;
}

// 角色标签映射
const roleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.INTERVIEWER]: '评委',
  [UserRole.CANDIDATE]: '候选人',
};

// 角色颜色映射
const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [UserRole.SUPER_ADMIN]: 'destructive',
  [UserRole.INTERVIEWER]: 'default',
  [UserRole.CANDIDATE]: 'secondary',
};

export function UserTable({ data, onEdit, onDelete, onToggleStatus, onResetPassword }: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<UserResponse>[] = useMemo(() => [
    {
      accessorKey: 'username',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            用户名
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('username')}</div>,
    },
    {
      accessorKey: 'profile.name',
      header: '姓名',
      cell: ({ row }) => row.original.profile.name,
    },
    {
      accessorKey: 'role',
      header: '角色',
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole;
        return (
          <Badge variant={roleColors[role]}>
            {roleLabels[role]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'profile.email',
      header: '邮箱',
      cell: ({ row }) => row.original.profile.email || '-',
    },
    {
      accessorKey: 'profile.phone',
      header: '手机',
      cell: ({ row }) => row.original.profile.phone,
    },
    {
      accessorKey: 'profile.department',
      header: '部门',
      cell: ({ row }) => row.original.profile.department || '-',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const user = row.original;
        const isActive = user.status === UserStatus.ACTIVE;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => onToggleStatus(user, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {isActive ? '启用' : '禁用'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            创建时间
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return format(date, 'yyyy-MM-dd HH:mm');
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onResetPassword(user)}>
                <KeyRound className="mr-2 h-4 w-4" />
                重置密码
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(user)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [onEdit, onDelete, onToggleStatus, onResetPassword]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
