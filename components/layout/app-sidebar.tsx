"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Mic,
  BarChart3,
  FolderOpen,
  Plus,
  GraduationCap,
  LogOut,
  Users,
  Building2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ROUTES } from "@/lib/constants"
import type { User } from "@/lib/types"

interface AppSidebarProps {
  user: User
  onSignOut: () => void | Promise<void>
}

const studentNav = [
  { title: "Dashboard", href: ROUTES.STUDENT_DASHBOARD, icon: LayoutDashboard },
  { title: "New Session", href: ROUTES.STUDENT_SESSION_NEW, icon: Mic },
  { title: "Progress", href: ROUTES.STUDENT_PROGRESS, icon: BarChart3 },
]

const trainerNav = [
  { title: "Batches", href: ROUTES.TRAINER_BATCHES, icon: FolderOpen },
  { title: "New Batch", href: ROUTES.TRAINER_BATCH_NEW, icon: Plus },
]

const adminNav = [
  { title: "Batches", href: ROUTES.ADMIN_BATCHES, icon: FolderOpen },
  { title: "New Batch", href: ROUTES.ADMIN_BATCH_NEW, icon: Plus },
  { title: "Users", href: ROUTES.ADMIN_USERS, icon: Users },
]

const platformNav = [
  { title: "Organizations", href: ROUTES.PLATFORM_ORGANIZATIONS, icon: Building2 },
  { title: "Users", href: ROUTES.PLATFORM_USERS, icon: Users },
]

export function AppSidebar({ user, onSignOut }: AppSidebarProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    switch (user.role) {
      case "student":
        return [{ label: "Practice", items: studentNav }]
      case "instructor":
        return [{ label: "Training", items: trainerNav }]
      case "org_admin":
        return [{ label: "Administration", items: adminNav }]
      case "admin":
        return [{ label: "Platform", items: platformNav }]
      default:
        return []
    }
  }

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="size-6" />
          <span className="text-lg font-semibold">VerveUni</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {getNavItems().map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      render={<Link href={item.href} />}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="truncate text-sm font-medium">{user.full_name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut}>
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
