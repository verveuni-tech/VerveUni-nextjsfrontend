import { AppShell } from "@/components/layout/app-shell"
import { requireRole } from "@/lib/auth/server"

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole("instructor")

  return <AppShell user={user}>{children}</AppShell>
}
