import { AppShell } from "@/components/layout/app-shell"
import { requireExactRole } from "@/lib/auth/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireExactRole("org_admin")

  return <AppShell user={user}>{children}</AppShell>
}
