import Link from "next/link"
import { FolderOpen } from "lucide-react"

import { BatchSummaryCards } from "@/components/trainer/batch-summary-cards"
import { OrgSetupPrompt } from "@/components/trainer/org-setup-prompt"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getProgressSummary, listBatches, listBatchMembers } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"
import type { BatchMetrics, BatchMembership } from "@/lib/types"

function buildMetrics(members: BatchMembership[], progressEntries: Array<Awaited<ReturnType<typeof getProgressSummary>> | null>): BatchMetrics {
  const studentMembers = members.filter((member) => member.role === "student")
  const validProgressEntries = progressEntries.filter(Boolean)
  const totalStudents = studentMembers.length
  const totalSessions = validProgressEntries.reduce((sum, progress) => sum + (progress?.total_sessions || 0), 0)
  const avgScore =
    validProgressEntries.length > 0
      ? validProgressEntries.reduce((sum, progress) => sum + (progress?.avg_score || 0), 0) / validProgressEntries.length
      : 0
  const completionRate =
    totalStudents > 0
      ? (validProgressEntries.filter((progress) => (progress?.total_sessions || 0) > 0).length / totalStudents) * 100
      : 0

  return {
    total_students: totalStudents,
    total_sessions: totalSessions,
    avg_score: avgScore,
    completion_rate: completionRate,
  }
}

export default async function TrainerBatchesPage() {
  const user = await requireUser()

  if (!user.organization_id) {
    return (
      <div className="space-y-6">
        <PageHeader title="Instructor Batches" description="Set up your organization to get started." />
        <OrgSetupPrompt />
      </div>
    )
  }

  const batches = await listBatches(user).catch(() => [])
  const batchEntries = await Promise.all(
    batches.map(async (batch) => {
      const members = await listBatchMembers(user, batch.id).catch(() => [])
      const studentMembers = members.filter((member) => member.role === "student")
      const progressEntries = await Promise.all(
        studentMembers.map((member) =>
          getProgressSummary(user, member.user_id, batch.id).catch(() => null)
        )
      )

      return {
        batch,
        metrics: buildMetrics(members, progressEntries),
      }
    })
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Instructor Batches" description="Monitor assigned batches and student completion." />

      {batchEntries.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No batches assigned"
          description="You do not have any instructor batches yet."
        />
      ) : (
        <div className="grid gap-4">
          {batchEntries.map(({ batch, metrics }) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={ROUTES.TRAINER_BATCH(batch.id)} className="hover:underline">
                    {batch.name}
                  </Link>
                </CardTitle>
                <CardDescription>{batch.description || "Interview practice batch"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BatchSummaryCards metrics={metrics} />
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.TRAINER_BATCH(batch.id)}>View Batch</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
