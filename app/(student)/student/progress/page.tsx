import { BarChart3, Calendar, Target, TrendingUp } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { StatCard } from "@/components/shared/stat-card"
import { CoachingSummaryPanel } from "@/components/student/coaching-summary-panel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { requireUser } from "@/lib/auth/server"
import { getProgressSummary } from "@/lib/server/app-data"

export default async function ProgressPage() {
  const user = await requireUser()
  const progress = await getProgressSummary(user).catch(() => null)

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
      ? baselineWindow.reduce((sum, item) => sum + item.final_score, 0) /
        baselineWindow.length
      : progress.avg_score
  const latestDelta = Math.round(latestScore - baselineScore)
  const trendLabel =
    progress.trend_direction === "improving"
      ? "Improving"
      : progress.trend_direction === "stable"
        ? "Stable"
        : "In progress"
  const coaching = progress.coaching_summary ?? null
  const hasReliableProgress = coaching
    ? coaching.data_quality !== "insufficient"
    : latestScore > 0
  const latestSlowdowns = progress.metrics_summary?.latest_slowdowns || []
  const latestStrengths = progress.metrics_summary?.latest_strengths || []
  const latestFocus = progress.metrics_summary?.latest_next_focus || []
  const fallbackEvidence = [
    ...latestSlowdowns,
    ...latestStrengths,
    ...latestFocus,
  ].slice(0, 4)
  const fallbackProgressLabel = hasReliableProgress
    ? trendLabel
    : "Not enough yet"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practice Progress"
        description="Your next coaching step, not just a score."
      />

      <CoachingSummaryPanel
        coaching={coaching}
        fallback={{
          title:
            progress.focus_area ||
            "Build one clearer answer in your next session",
          explanation:
            "Use the latest feedback as one practical target before looking at scores.",
          successTarget:
            "Complete one more session and apply this target to every answer.",
          observation:
            "Your latest completed session gives us a starting point for the next attempt.",
          evidence: fallbackEvidence,
          skillName: progress.focus_area
            ? "Focused repetition"
            : "Answer momentum",
          skillWhy:
            "Repeated interview pressure works best when each attempt has one clear behavior to improve.",
          drillInstruction:
            "Start with a direct answer, add one example, then finish with the result.",
          drillPattern: "My answer is... For example... The result was...",
          progressLabel: fallbackProgressLabel,
          progressMessage:
            "Complete another spoken attempt to make this direction more precise.",
        }}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Sessions completed"
          value={progress.total_sessions}
          icon={Calendar}
          description="Every attempt builds interview reflexes."
        />
        <StatCard
          title="Latest result"
          value={
            hasReliableProgress
              ? `${Math.round(latestScore)}%`
              : "Still forming"
          }
          icon={TrendingUp}
          description={
            hasReliableProgress
              ? "Use this as context, not the whole story."
              : "Speak more in the next attempt for a fairer read."
          }
        />
        <StatCard
          title="Recent direction"
          value={hasReliableProgress ? trendLabel : "Not enough yet"}
          icon={BarChart3}
          description={
            hasReliableProgress
              ? "Compared with your recent completed sessions."
              : "We need one clearer spoken session first."
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {hasReliableProgress ? "Recent comparison" : "Why no trend yet"}
            </CardTitle>
            <CardDescription>
              {hasReliableProgress
                ? "A small signal from your latest result against your recent baseline."
                : "We avoid showing overconfident progress when the answer data is too thin."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasReliableProgress ? (
              <>
                <p className="text-2xl font-semibold">
                  {latestDelta >= 0 ? "+" : ""}
                  {latestDelta} pts
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest {Math.round(latestScore)}% against a baseline of{" "}
                  {Math.round(baselineScore)}%.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete one session with enough spoken answers and this section
                will start comparing your recent attempts.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What this page is for</CardTitle>
            <CardDescription>
              Practice works best when the next attempt has one job.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Target className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Scores stay in the background here. The main goal is to tell you
                what to change in the very next interview simulation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
