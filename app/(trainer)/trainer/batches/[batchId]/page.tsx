import { notFound } from "next/navigation"

import { BatchStudentsTable, type TrainerStudentRow } from "@/components/trainer/batch-students-table"
import { BatchSummaryCards } from "@/components/trainer/batch-summary-cards"
import { ExportButton } from "@/components/trainer/export-button"
import { PageHeader } from "@/components/layout/page-header"
import { InviteCodeCard } from "@/components/shared/invite-code-card"
import { QuestionSetManager } from "@/components/trainer/question-set-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getBatch, listBatchMembers, getProgressSummary, listSessions, listQuestionSets } from "@/lib/server/app-data"
import { getBatchLeaderboard } from "@/lib/api/progress"
import type { BatchMetrics } from "@/lib/types"

function summarizeRows(rows: TrainerStudentRow[]): BatchMetrics {
  const totalStudents = rows.length
  const totalSessions = rows.reduce((sum, row) => sum + row.totalSessions, 0)
  const avgScore = rows.length > 0 ? rows.reduce((sum, row) => sum + row.avgScore, 0) / rows.length : 0
  const completionRate =
    totalStudents > 0 ? (rows.filter((row) => row.totalSessions > 0).length / totalStudents) * 100 : 0

  return {
    total_students: totalStudents,
    total_sessions: totalSessions,
    avg_score: avgScore,
    completion_rate: completionRate,
  }
}

export default async function TrainerBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await requireUser()
  const batch = await getBatch(user, batchId).catch(() => null)

  if (!batch) {
    notFound()
  }

  const [members, questionSets] = await Promise.all([
    listBatchMembers(user, batchId).catch(() => []),
    listQuestionSets(user, batchId).catch(() => []),
  ])
  const studentMembers = members.filter((member) => member.role === "student")
  const rows = await Promise.all(
    studentMembers.map(async (member) => {
      const [progress, sessions] = await Promise.all([
        getProgressSummary(user, member.user_id, batchId).catch(() => null),
        listSessions(user, { user_id: member.user_id, batch_id: batchId }).catch(() => []),
      ])

      const latestSession = sessions[0]

      return {
        id: member.user_id,
        fullName: member.user?.full_name || "Unknown student",
        email: member.user?.email || "-",
        totalSessions: progress?.total_sessions || 0,
        avgScore: progress?.avg_score || 0,
        grade: progress?.current_grade || "N/A",
        latestStatus: latestSession?.status,
      } satisfies TrainerStudentRow
    })
  )

  const leaderboard = await getBatchLeaderboard(batchId).catch(() => [])
  const metrics = summarizeRows(rows)

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.name}
        description={batch.description || "Batch performance overview"}
        action={<ExportButton batchId={batchId} />}
      />

      {batch.join_code ? (
        <InviteCodeCard
          code={batch.join_code}
          label="Student Invite Code"
          description="Share this code with students to let them join this batch."
        />
      ) : null}

      <BatchSummaryCards metrics={metrics} />

      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Track completion, averages, and latest session state.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchStudentsTable rows={rows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top performers in this batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div key={entry.user_id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{entry.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.sessions_completed} sessions completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{Math.round(entry.avg_score)}%</p>
                    <p className="text-xs text-muted-foreground">Rank #{entry.rank}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Leaderboard data is not available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <QuestionSetManager batchId={batchId} initialQuestionSets={questionSets} />
    </div>
  )
}
