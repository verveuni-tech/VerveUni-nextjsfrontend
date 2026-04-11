import Link from "next/link"
import { BarChart3, Clock, Mic, Target } from "lucide-react"

import { BatchJoinPrompt } from "@/components/student/batch-join-prompt"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getProgressSummary, listBatches } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function StudentDashboardPage() {
  const user = await requireUser()
  const [progress, batches] = await Promise.all([
    getProgressSummary(user).catch(() => null),
    listBatches(user).catch(() => []),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Track your interview practice progress"
        action={
          <Button asChild>
            <Link href={ROUTES.STUDENT_SESSION_NEW}>
              <Mic className="mr-2 size-4" />
              Start Practice
            </Link>
          </Button>
        }
      />

      {batches.length === 0 ? (
        <BatchJoinPrompt />
      ) : !progress || progress.total_sessions === 0 ? (
        <EmptyState
          icon={Mic}
          title="No sessions yet"
          description="Start your first interview practice session to begin tracking your progress."
          action={
            <Button asChild>
              <Link href={ROUTES.STUDENT_SESSION_NEW}>Start First Session</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Sessions Completed" value={progress.total_sessions} icon={Clock} />
            <StatCard title="Average Score" value={`${Math.round(progress.avg_score)}%`} icon={Target} />
            <StatCard title="Current Grade" value={progress.current_grade || "N/A"} icon={BarChart3} />
            <StatCard title="Focus Area" value={progress.focus_area || "Keep practicing"} icon={Target} />
          </div>

          {progress.recent_sessions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Your latest practice sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {progress.recent_sessions.map((session) => (
                    <Link
                      key={session.id}
                      href={
                        session.status === "completed"
                          ? ROUTES.STUDENT_RESULTS(session.id)
                          : ROUTES.STUDENT_SESSION(session.id)
                      }
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {session.question_set?.title || "Practice Session"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.started_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={session.status} />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
