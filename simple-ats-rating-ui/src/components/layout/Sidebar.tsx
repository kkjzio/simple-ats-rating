import { NavLink } from "react-router-dom"
import {
  Home,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Download,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAuthStore, useUIStore } from "@/stores"
import { UserRole } from "@/types"

interface MenuItem {
  title: string
  path: string
  icon: LucideIcon
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    title: "管理概览",
    path: "/admin/dashboard",
    icon: Home,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    title: "用户管理",
    path: "/admin/users",
    icon: Users,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    title: "评分模板",
    path: "/admin/templates",
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    title: "场次管理",
    path: "/admin/sessions",
    icon: Calendar,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    title: "统计分析",
    path: "/admin/stats",
    icon: BarChart3,
    roles: [UserRole.SUPER_ADMIN],
  },
  // {
  //   title: "数据导出",
  //   path: "/export",
  //   icon: Download,
  //   roles: [UserRole.SUPER_ADMIN],
  // },
  {
    title: "系统日志",
    path: "/logs",
    icon: FileText,
    roles: [UserRole.SUPER_ADMIN],
  },
  {
    title: "工作台",
    path: "/interviewer/dashboard",
    icon: Home,
    roles: [UserRole.INTERVIEWER],
  },
  {
    title: "我的场次",
    path: "/interviewer/sessions",
    icon: Calendar,
    roles: [UserRole.INTERVIEWER],
  },
  {
    title: "评分历史",
    path: "/interviewer/history",
    icon: FileText,
    roles: [UserRole.INTERVIEWER],
  },
  {
    title: "个人信息",
    path: "/candidate/profile",
    icon: User,
    roles: [UserRole.CANDIDATE],
  },
  {
    title: "面试状态",
    path: "/candidate/status",
    icon: Calendar,
    roles: [UserRole.CANDIDATE],
  },
]

export const Sidebar = () => {
  const { user } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  if (!user) {
    return null
  }

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role))

  return (
    <>
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300",
          sidebarCollapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                    sidebarCollapsed && "md:justify-center md:px-2",
                  )
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="md:block">{item.title}</span>}
              </NavLink>
            ))}
          </nav>

          <Separator />

          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full justify-start gap-3", sidebarCollapsed && "md:justify-center md:px-2")}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? (
                <>
                  <ChevronRight className="h-5 w-5 shrink-0" />
                  <span className="md:hidden">展开</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 shrink-0" />
                  <span className="md:block">收起</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
