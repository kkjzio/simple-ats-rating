/**
 * 应用主组件
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { router } from "@/router"
import "./index.css"

/**
 * 创建 QueryClient 实例
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,  // 切换回窗口/标签页时自动重新获取数据
      staleTime: 0,                 // 数据立即视为过期，每次挂载和窗口聚焦都重新拉取
    },
  },
})

/**
 * 应用主组件
 */
export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
