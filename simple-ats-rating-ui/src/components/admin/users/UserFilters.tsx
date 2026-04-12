/**
 * 用户筛选组件
 * 提供搜索框、角色筛选、状态筛选功能
 */
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { UserRole, UserStatus } from '@/types/user';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFiltersProps {
  onFilterChange: (filters: {
    keyword?: string;
    role?: string;
    status?: string;
  }) => void;
}

// 角色选项
const roleOptions = [
  { value: 'all', label: '全部角色' },
  { value: UserRole.SUPER_ADMIN, label: '超级管理员' },
  { value: UserRole.INTERVIEWER, label: '评委' },
  { value: UserRole.CANDIDATE, label: '候选人' },
];

// 状态选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: UserStatus.ACTIVE, label: '启用' },
  { value: UserStatus.INACTIVE, label: '禁用' },
];

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  // 防抖处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        keyword: keyword || undefined,
        role: role === 'all' ? undefined : role,
        status: status === 'all' ? undefined : status,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, role, status, onFilterChange]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索用户名、姓名、邮箱..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={role} onValueChange={setRole}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="选择角色" />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="选择状态" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
