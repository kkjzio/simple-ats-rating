/**
 * 主布局组件
 */

import type { ReactNode } from "react"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Toast } from "@/components/common/Toast"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { GlobalLoading } from "@/components/common/Loading"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores"

interface MainLayoutProps {
  /** 子组件 */
  children: ReactNode
  /** 自定义类名 */
  className?: string
}

/**
 * 主布局组件
 * 包含Header、Sidebar和主内容区域
 */
export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <Header />

      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarCollapsed ? "md:pl-16" : "md:pl-64",
          className
        )}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* 全局组件 */}
      <Toast />
      <ConfirmDialog />
      <GlobalLoading />
    </div>
  )
}

export default MainLayout
