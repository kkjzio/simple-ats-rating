/**
 * 空状态组件
 */

import { FileQuestion } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  /** 图标 */
  icon?: LucideIcon
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 操作按钮文本 */
  actionText?: string
  /** 操作按钮点击事件 */
  onAction?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * 空状态组件
 * 用于显示无数据或空列表的状态
 */
export const EmptyState = ({
  icon: Icon = FileQuestion,
  title = "暂无数据",
  description,
  actionText,
  onAction,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <Button onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
