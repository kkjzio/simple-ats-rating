/**
 * 场次筛选组件
 * 提供搜索、状态筛选、时间范围筛选功能
 */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SessionStatus } from '@/types';

export interface SessionFiltersValue {
  keyword?: string;
  status?: SessionStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

interface SessionFiltersProps {
  value: SessionFiltersValue;
  onChange: (filters: SessionFiltersValue) => void;
  onReset?: () => void;
}

/**
 * 状态选项
 */
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: SessionStatus.DRAFT, label: '草稿' },
  { value: SessionStatus.ACTIVE, label: '进行中' },
  { value: SessionStatus.COMPLETED, label: '已完成' },
  { value: SessionStatus.ARCHIVED, label: '已归档' },
];

/**
 * 场次筛选组件
 */
export function SessionFilters({ value, onChange, onReset }: SessionFiltersProps) {
  const [keyword, setKeyword] = useState(value.keyword || '');

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    onChange({ ...value, keyword: keyword.trim() || undefined });
  };

  /**
   * 处理搜索框回车
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 处理状态筛选
   */
  const handleStatusChange = (status: string) => {
    onChange({
      ...value,
      status: status === 'all' ? undefined : (status as SessionStatus),
    });
  };

  /**
   * 处理重置
   */
  const handleReset = () => {
    setKeyword('');
    if (onReset) {
      onReset();
    } else {
      onChange({});
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* 搜索框 */}
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="搜索场次名称、岗位..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2">
          <Select
            value={value.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
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

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
        </div>
      </div>

      {/* 时间范围筛选（可选功能，暂时隐藏） */}
      {/* <div className="flex gap-2">
        <Input
          type="date"
          value={value.dateFrom || ''}
          onChange={(e) => onChange({ ...value, dateFrom: e.target.value || undefined })}
          placeholder="开始日期"
        />
        <span className="flex items-center">至</span>
        <Input
          type="date"
          value={value.dateTo || ''}
          onChange={(e) => onChange({ ...value, dateTo: e.target.value || undefined })}
          placeholder="结束日期"
        />
      </div> */}
    </div>
  );
}

export default SessionFilters;
