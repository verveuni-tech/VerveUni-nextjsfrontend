import { AppShell } from "@/components/layout/app-shell"
import { requireExactRole } from "@/lib/auth/server"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireExactRole("student")

  return <AppShell user={user}>{children}</AppShell>
}
