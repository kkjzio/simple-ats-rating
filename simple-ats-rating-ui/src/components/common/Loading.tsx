/**
 * 加载指示器组件
 */

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  /** 是否全屏显示 */
  fullscreen?: boolean
  /** 加载文本 */
  text?: string
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 自定义类名 */
  className?: string
}

/**
 * 加载指示器组件
 * 用于显示加载状态
 */
export const Loading = ({ 
  fullscreen = false, 
  text, 
  size = 'md',
  className 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2",
      className
    )}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

/**
 * 全局加载组件
 * 从UI store获取加载状态
 */
export const GlobalLoading = () => {
  const { globalLoading } = useUIStore()

  if (!globalLoading) {
    return null
  }

  return <Loading fullscreen text="加载中..." />
}

// 导入useUIStore
import { useUIStore } from "@/stores"

export default Loading
