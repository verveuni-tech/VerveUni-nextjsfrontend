import { AppShell } from "@/components/layout/app-shell"
import { requireExactRole } from "@/lib/auth/server"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireExactRole("admin")

  return <AppShell user={user}>{children}</AppShell>
}
