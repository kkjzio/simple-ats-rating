/**
 * 候选人筛选组件
 * 提供搜索和筛选功能
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

interface CandidateFiltersProps {
  /** 搜索关键词 */
  keyword?: string;
  /** 性别筛选 */
  gender?: string;
  /** 教育背景筛选 */
  education?: string;
  /** 状态筛选 */
  status?: string;
  /** 搜索变化回调 */
  onKeywordChange?: (keyword: string) => void;
  /** 性别变化回调 */
  onGenderChange?: (gender: string) => void;
  /** 教育背景变化回调 */
  onEducationChange?: (education: string) => void;
  /** 状态变化回调 */
  onStatusChange?: (status: string) => void;
  /** 重置回调 */
  onReset?: () => void;
}

/**
 * 候选人筛选组件
 */
export const CandidateFilters: React.FC<CandidateFiltersProps> = ({
  keyword = '',
  gender = '',
  education = '',
  status = '',
  onKeywordChange,
  onGenderChange,
  onEducationChange,
  onStatusChange,
  onReset,
}) => {
  const [searchValue, setSearchValue] = React.useState(keyword);

  // 同步外部关键词
  React.useEffect(() => {
    setSearchValue(keyword);
  }, [keyword]);

  // 处理搜索
  const handleSearch = () => {
    if (onKeywordChange) {
      onKeywordChange(searchValue);
    }
  };

  // 处理回车搜索
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理重置
  const handleReset = () => {
    setSearchValue('');
    if (onReset) {
      onReset();
    }
  };

  // 检查是否有激活的筛选
  const hasActiveFilters = keyword || gender || education || status;

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、邮箱、手机..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>搜索</Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            重置
          </Button>
        )}
      </div>

      {/* 筛选条件 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 性别筛选 */}
        <div>
          <Select
            value={gender || "all"}
            onValueChange={(value) => onGenderChange?.(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="性别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部性别</SelectItem>
              <SelectItem value="男">男</SelectItem>
              <SelectItem value="女">女</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 教育背景筛选 */}
        <div>
          <Select
            value={education || "all"}
            onValueChange={(value) => onEducationChange?.(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="教育背景" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学历</SelectItem>
              <SelectItem value="高中">高中</SelectItem>
              <SelectItem value="专科">专科</SelectItem>
              <SelectItem value="本科">本科</SelectItem>
              <SelectItem value="硕士">硕士</SelectItem>
              <SelectItem value="博士">博士</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 状态筛选 */}
        <div>
          <Select
            value={status || "all"}
            onValueChange={(value) => onStatusChange?.(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待面试</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CandidateFilters;
