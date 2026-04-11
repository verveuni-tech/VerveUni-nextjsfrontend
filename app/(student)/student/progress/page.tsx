import Link from "next/link"
import { BarChart3, Calendar, Target, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { GradeBadge } from "@/components/shared/grade-badge"
import { StatCard } from "@/components/shared/stat-card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getProgressSummary, getCompletedSessionSnapshots } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function ProgressPage() {
  const user = await requireUser()
  const [progress, history] = await Promise.all([
    getProgressSummary(user).catch(() => null),
    getCompletedSessionSnapshots(user).catch(() => []),
  ])

  if (!progress || progress.total_sessions === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Progress" />
        <EmptyState
          icon={BarChart3}
          title="No progress data yet"
          description="Complete your first practice session to start tracking progress."
        />
      </div>
    )
  }

  const trendData = progress.trend_data || []
  const latestScore = trendData[0]?.final_score ?? progress.avg_score
  const baselineWindow = trendData.slice(1, 4)
  const baselineScore =
    baselineWindow.length > 0
      ? baselineWindow.reduce((sum, item) => sum + item.final_score, 0) / baselineWindow.length
      : progress.avg_score
  const latestDelta = Math.round(latestScore - baselineScore)
  const trendLabel =
    progress.trend_direction === "improving" ? "Improving" : progress.trend_direction === "stable" ? "Stable" : "In progress"

  return (
    <div className="space-y-6">
      <PageHeader title="My Progress" description="Track your interview practice improvement" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sessions" value={progress.total_sessions} icon={Calendar} />
        <StatCard title="Average Score" value={`${Math.round(progress.avg_score)}%`} icon={TrendingUp} />
        <StatCard title="Delivery Avg" value={`${Math.round(progress.avg_delivery)}%`} icon={BarChart3} />
        <StatCard title="Content Avg" value={`${Math.round(progress.avg_content)}%`} icon={Target} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Standing</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <GradeBadge grade={progress.current_grade} score={progress.avg_score} size="lg" />
          </CardContent>
        </Card>

        {progress.focus_area ? (
          <Card>
            <CardHeader>
              <CardTitle>Focus Area</CardTitle>
              <CardDescription>What to work on next</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{progress.focus_area}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Trajectory</CardTitle>
            <CardDescription>Direction matters more than one isolated score.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{trendLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on your latest completed sessions.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest vs Previous 3</CardTitle>
            <CardDescription>How your most recent result compares with your recent baseline.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{latestDelta >= 0 ? "+" : ""}{latestDelta} pts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest {Math.round(latestScore)}% against a baseline of {Math.round(baselineScore)}%.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Keep Working On</CardTitle>
            <CardDescription>Your current coaching thread.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{progress.focus_area || "Build consistency across answers."}</p>
          </CardContent>
        </Card>
      </div>

      {progress.recent_sessions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest analyzed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.recent_sessions.map((session) => (
                <Link
                  key={session.id}
                  href={session.status === "completed" ? ROUTES.STUDENT_RESULTS(session.id) : ROUTES.STUDENT_SESSION(session.id)}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{session.question_set?.title || "Practice Session"}</p>
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

      {history.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Completed Sessions</CardTitle>
            <CardDescription>Every finished practice session in this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Session {snapshot.session_number || "?"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {snapshot.completed_at ? new Date(snapshot.completed_at).toLocaleDateString() : "Not completed"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{snapshot.summary_text || "Awaiting summary"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
