"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ROLE_LABELS } from "@/lib/constants"
import type { User } from "@/lib/types"

interface AppTopbarProps {
  user: User
  title?: string
}

export function AppTopbar({ user, title }: AppTopbarProps) {
  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      {title && <h1 className="text-sm font-medium">{title}</h1>}
      <div className="ml-auto flex items-center gap-2">
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {ROLE_LABELS[user.role] || user.role}
        </span>
      </div>
    </header>
  )
}
