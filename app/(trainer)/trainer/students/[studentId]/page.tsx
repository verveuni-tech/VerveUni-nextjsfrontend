import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { StudentProgressSummary } from "@/components/trainer/student-progress-summary"
import { PageHeader } from "@/components/layout/page-header"
import { GradeBadge } from "@/components/shared/grade-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getProgressSummary, listSessions } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function TrainerStudentDetailPage({
  params,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ batch_id?: string }>
}) {
  const { studentId } = await params
  const { batch_id: batchId } = await searchParamsPromise
  const user = await requireUser()
  const [progress, sessions] = await Promise.all([
    batchId
      ? getProgressSummary(user, studentId, batchId).catch(() => null)
      : Promise.resolve(null),
    listSessions(user, { user_id: studentId }).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Progress"
        description="Review session history, performance trends, and next focus areas."
        action={
          <Button variant="outline" asChild>
            <Link href={ROUTES.TRAINER_BATCHES}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Batches
            </Link>
          </Button>
        }
      />

      {progress ? (
        <>
          <StudentProgressSummary progress={progress} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Current Grade</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-6">
                <GradeBadge grade={progress.current_grade || "N/A"} score={progress.avg_score} size="lg" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Current Focus</CardTitle>
                <CardDescription>Priority area to improve next.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{progress.focus_area || "Keep practicing"}</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No progress data is available for this student yet.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest activity for this student.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{session.question_set?.title || "Practice Session"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.started_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sessions found for this student.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
