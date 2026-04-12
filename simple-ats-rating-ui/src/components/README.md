# 组件使用文档

## 目录结构

```
src/components/
├── common/          # 通用组件
│   ├── Toast.tsx
│   ├── ConfirmDialog.tsx
│   ├── Loading.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx
│   └── index.ts
├── layout/          # 布局组件
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── MainLayout.tsx
│   └── index.ts
├── ui/              # shadcn/ui组件
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── avatar.tsx
│   ├── dropdown-menu.tsx
│   ├── alert-dialog.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── badge.tsx
│   └── separator.tsx
└── index.ts         # 统一导出
```

## 通用组件

### Toast - Toast通知组件

Toast组件已集成到MainLayout中，通过`useToast` hook使用。

**使用示例：**

```tsx
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const toast = useToast()

  const handleSuccess = () => {
    toast.success('操作成功！', '成功')
  }

  const handleError = () => {
    toast.error('操作失败！', '错误')
  }

  const handleWarning = () => {
    toast.warning('请注意！', '警告')
  }

  const handleInfo = () => {
    toast.info('提示信息', '信息')
  }

  return (
    <div>
      <button onClick={handleSuccess}>显示成功消息</button>
      <button onClick={handleError}>显示错误消息</button>
    </div>
  )
}
```

### ConfirmDialog - 确认对话框组件

ConfirmDialog组件已集成到MainLayout中，通过`useUIStore`使用。

**使用示例：**

```tsx
import { useUIStore } from '@/stores'

function MyComponent() {
  const { showConfirm } = useUIStore()

  const handleDelete = () => {
    showConfirm(
      {
        title: '确认删除',
        message: '确定要删除这条记录吗？此操作不可撤销。',
        confirmText: '删除',
        cancelText: '取消',
        confirmType: 'danger',
      },
      () => {
        // 确认后的操作
        console.log('已删除')
      },
      () => {
        // 取消后的操作（可选）
        console.log('已取消')
      }
    )
  }

  return <button onClick={handleDelete}>删除</button>
}
```

### Loading - 加载指示器组件

**使用示例：**

```tsx
import { Loading } from '@/components/common/Loading'

// 局部加载
function MyComponent() {
  return (
    <div>
      <Loading size="md" text="加载中..." />
    </div>
  )
}

// 全屏加载
function MyComponent2() {
  return <Loading fullscreen text="正在处理..." />
}

// 使用全局加载状态
import { useUIStore } from '@/stores'

function MyComponent3() {
  const { setGlobalLoading } = useUIStore()

  const handleSubmit = async () => {
    setGlobalLoading(true)
    try {
      await someAsyncOperation()
    } finally {
      setGlobalLoading(false)
    }
  }

  return <button onClick={handleSubmit}>提交</button>
}
```

### EmptyState - 空状态组件

**使用示例：**

```tsx
import { EmptyState } from '@/components/common/EmptyState'
import { FileQuestion } from 'lucide-react'

function MyComponent() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="暂无数据"
      description="当前没有任何记录，请添加新的数据。"
      actionText="添加数据"
      onAction={() => console.log('添加数据')}
    />
  )
}
```

### ErrorBoundary - 错误边界组件

ErrorBoundary已在App.tsx中使用，包裹整个应用。也可以在特定组件中使用。

**使用示例：**

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function MyComponent() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('捕获到错误:', error, errorInfo)
      }}
    >
      <SomeComponentThatMightError />
    </ErrorBoundary>
  )
}

// 自定义错误UI
function MyComponent2() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h1>出错了</h1>
          <p>{error.message}</p>
          <button onClick={reset}>重试</button>
        </div>
      )}
    >
      <SomeComponentThatMightError />
    </ErrorBoundary>
  )
}
```

## 布局组件

### MainLayout - 主布局组件

MainLayout包含Header、Sidebar和主内容区域，已在路由配置中使用。

**特性：**
- 响应式设计，支持移动端
- 侧边栏可折叠
- 集成Toast、ConfirmDialog和GlobalLoading
- 自动根据用户角色显示对应菜单

### Header - 页面头部组件

**特性：**
- 显示系统标题
- 显示当前用户信息（头像、姓名、角色）
- 用户下拉菜单（个人信息、修改密码、退出登录）
- 移动端显示菜单切换按钮

### Sidebar - 侧边栏组件

**特性：**
- 根据用户角色显示不同菜单项
- 支持折叠/展开
- 高亮当前激活的菜单项
- 响应式设计

**菜单配置：**

- **超管菜单**：仪表板、用户管理、评分模板、场次管理、候选人管理、统计分析、数据导出、操作日志
- **评委菜单**：我的场次、待评候选人、评分历史、场次统计
- **候选人菜单**：个人信息、面试状态

## 使用shadcn/ui组件

所有shadcn/ui组件都在`src/components/ui/`目录下，可以直接导入使用：

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function MyForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>表单标题</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">姓名</Label>
            <Input id="name" placeholder="请输入姓名" />
          </div>
          <Button>提交</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

## 样式规范

所有组件使用Tailwind CSS进行样式设计，遵循以下规范：

1. 使用`cn()`工具函数合并类名
2. 使用shadcn/ui的设计系统（颜色、间距等）
3. 支持响应式设计（使用`md:`、`lg:`等前缀）
4. 使用CSS变量实现主题切换

## 注意事项

1. 所有组件都有完整的TypeScript类型定义
2. 使用已有的hooks（`useAuth`、`useToast`、`useUIStore`等）
3. 菜单路径与路由配置保持一致
4. 组件都包含必要的注释和文档