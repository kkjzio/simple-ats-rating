/**
 * 页面头部组件
 */

import { Menu, User, Settings, LogOut, KeyRound } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore, useUIStore } from "@/stores"
import { useNavigate } from "react-router-dom"
import { UserRole } from "@/types"

/**
 * 获取角色显示文本
 */
const getRoleText = (role: UserRole): string => {
  const roleMap: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: '超级管理员',
    [UserRole.INTERVIEWER]: '评委',
    [UserRole.CANDIDATE]: '候选人',
  }
  return roleMap[role] || role
}

/**
 * 获取角色徽章颜色
 */
const getRoleBadgeVariant = (role: UserRole) => {
  const variantMap: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'destructive',
    [UserRole.INTERVIEWER]: 'default',
    [UserRole.CANDIDATE]: 'secondary',
  }
  return variantMap[role] || 'default'
}

/**
 * 页面头部组件
 */
export const Header = () => {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const handleChangePassword = () => {
    navigate('/change-password')
  }

  // 获取用户名首字母作为头像fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* 侧边栏切换按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">切换菜单</span>
        </Button>

        {/* 系统标题 */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ATS简历评分系统
          </h1>
        </div>

        {/* 占位符，将用户信息推到右侧 */}
        <div className="flex-1" />

        {/* 用户信息 */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile.avatar || undefined} alt={user.username} />
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-sm">
                  <span className="font-medium">{user.username}</span>
                  <Badge
                    variant={getRoleBadgeVariant(user.role) as any}
                    className="text-xs h-4 px-1"
                  >
                    {getRoleText(user.role)}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.profile.email || user.profile.phone}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>个人信息</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleChangePassword}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>修改密码</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

export default Header
