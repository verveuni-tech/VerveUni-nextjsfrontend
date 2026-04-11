import Link from "next/link"

import { PageHeader } from "@/components/layout/page-header"
import { InviteCodeCard } from "@/components/shared/invite-code-card"
import { QuestionSetManager } from "@/components/trainer/question-set-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getBatch, listBatchMembers, listQuestionSets } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await requireUser()
  const [batch, members, questionSets] = await Promise.all([
    getBatch(user, batchId),
    listBatchMembers(user, batchId).catch(() => []),
    listQuestionSets(user, batchId).catch(() => []),
  ])

  const trainers = members.filter((member) => member.role === "instructor")
  const students = members.filter((member) => member.role === "student")

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.name}
        description={batch.description || "Batch details"}
        action={
          <Button asChild>
            <Link href={ROUTES.ADMIN_BATCH_MEMBERS(batchId)}>Manage Members</Link>
          </Button>
        }
      />

      {batch.join_code ? (
        <InviteCodeCard
          code={batch.join_code}
          label="Student Invite Code"
          description="Share this code with students to let them join this batch."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="capitalize">{batch.status}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>{students.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trainers</CardTitle>
          </CardHeader>
          <CardContent>{trainers.length}</CardContent>
        </Card>
      </div>

      <QuestionSetManager batchId={batchId} initialQuestionSets={questionSets} />

      <Card>
        <CardHeader>
          <CardTitle>Assigned Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trainers.length > 0 ? (
              trainers.map((trainer) => (
                <div key={trainer.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{trainer.user?.full_name || "Unknown instructor"}</p>
                  <p className="text-xs text-muted-foreground">{trainer.user?.email || "-"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No instructors assigned yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
