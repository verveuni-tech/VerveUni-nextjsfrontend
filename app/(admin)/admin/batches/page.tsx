import Link from "next/link"
import { FolderOpen, Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { listBatches, listBatchMembers } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function AdminBatchesPage() {
  const user = await requireUser()
  const batches = await listBatches(user).catch(() => [])
  const batchEntries = await Promise.all(
    batches.map(async (batch) => ({
      batch,
      members: await listBatchMembers(user, batch.id).catch(() => []),
    }))
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Create and manage organizational interview practice batches."
        action={
          <Button asChild>
            <Link href={ROUTES.ADMIN_BATCH_NEW}>
              <Plus className="mr-2 size-4" />
              New Batch
            </Link>
          </Button>
        }
      />

      {batchEntries.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No batches yet"
          description="Create your first batch to start organizing students and instructors."
          action={
            <Button asChild>
              <Link href={ROUTES.ADMIN_BATCH_NEW}>Create Batch</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {batchEntries.map(({ batch, members }) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={ROUTES.ADMIN_BATCH(batch.id)} className="hover:underline">
                    {batch.name}
                  </Link>
                </CardTitle>
                <CardDescription>{batch.description || "Interview practice batch"}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span className="capitalize">Status: {batch.status}</span>
                  <span>{members.length} members</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.ADMIN_BATCH(batch.id)}>View Batch</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
