import { AssignTrainerDialog } from "@/components/admin/assign-trainer-dialog"
import { BatchMembersTable } from "@/components/admin/batch-members-table"
import { PageHeader } from "@/components/layout/page-header"
import { requireUser } from "@/lib/auth/server"
import { getBatch, listBatchMembers } from "@/lib/server/app-data"

export default async function AdminBatchMembersPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await requireUser()
  const [batch, members] = await Promise.all([
    getBatch(user, batchId),
    listBatchMembers(user, batchId).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${batch.name} Members`}
        description="Add students, remove members, and assign instructors."
        action={<AssignTrainerDialog batchId={batchId} />}
      />
      <BatchMembersTable batchId={batchId} members={members} />
    </div>
  )
}
