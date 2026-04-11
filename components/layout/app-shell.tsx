"use client"

import { signOut } from "firebase/auth"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { firebaseAuth } from "@/lib/firebase/client"
import type { User } from "@/lib/types"

export function AppShell({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const router = useAppNavigation()

  async function handleSignOut() {
    await signOut(firebaseAuth).catch(() => null)
    await fetch("/api/auth/logout", {
      method: "POST",
    })

    router.replace("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} onSignOut={handleSignOut} />
      <SidebarInset>
        <AppTopbar user={user} />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
