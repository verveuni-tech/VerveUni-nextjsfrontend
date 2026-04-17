import Link from "next/link"
import { ArrowLeft, Mic } from "lucide-react"
import { redirect } from "next/navigation"

import { FeedbackCards } from "@/components/feedback/feedback-cards"
import { PageHeader } from "@/components/layout/page-header"
import { GradeBadge } from "@/components/shared/grade-badge"
import { CoachingSummaryPanel } from "@/components/student/coaching-summary-panel"
import { ResultsTabs } from "@/components/student/results-tabs"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/server"
import { getSession } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"
import type { ScoreDimension, SessionAnswer } from "@/lib/types"

function getWeakestAnswer(answers: SessionAnswer[]) {
  return (
    [...answers]
      .filter((answer) => answer.analysis)
      .sort(
        (left, right) =>
          (left.analysis?.overall_score || 0) -
          (right.analysis?.overall_score || 0)
      )[0] || null
  )
}

function getEvidence(answer: SessionAnswer | null) {
  if (!answer?.analysis) {
    return []
  }

  const fromDimensions = [
    ...Object.values(answer.analysis.delivery_scores || {}),
    ...Object.values(answer.analysis.content_scores || {}),
  ]
    .flatMap((dimension: ScoreDimension) => {
      if (!dimension?.evidence) {
        return []
      }

      return Array.isArray(dimension.evidence)
        ? dimension.evidence
        : [dimension.evidence]
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 3)

  if (fromDimensions.length > 0) {
    return fromDimensions
  }

  if (answer.transcript) {
    return [
      `Transcript sample: "${answer.transcript.slice(0, 140)}${answer.transcript.length > 140 ? "..." : ""}"`,
    ]
  }

  return ["No speech was detected for this answer."]
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await requireUser()
  const session = await getSession(user, sessionId)

  if (
    session.status === "ready_for_analysis" ||
    session.status === "processing"
  ) {
    redirect(ROUTES.STUDENT_SESSION(sessionId))
  }

  const answers = session.answers || []
  const analyzedAnswers = answers.filter((answer) => answer.analysis)
  const avgScore =
    session.analysis?.final_score ??
    (analyzedAnswers.length > 0
      ? analyzedAnswers.reduce(
          (sum, answer) => sum + (answer.analysis?.overall_score || 0),
          0
        ) / analyzedAnswers.length
      : 0)
  const overallGrade =
    avgScore >= 85
      ? "A"
      : avgScore >= 70
        ? "B"
        : avgScore >= 55
          ? "C"
          : avgScore >= 40
            ? "D"
            : "F"

  const strengths =
    session.analysis?.strengths && session.analysis.strengths.length > 0
      ? session.analysis.strengths.slice(0, 5)
      : Array.from(
          new Set(
            analyzedAnswers.flatMap(
              (answer) => answer.analysis?.feedback.strengths || []
            )
          )
        ).slice(0, 5)
  const slowdowns =
    session.analysis?.slowdowns && session.analysis.slowdowns.length > 0
      ? session.analysis.slowdowns.slice(0, 5)
      : Array.from(
          new Set(
            analyzedAnswers.flatMap(
              (answer) => answer.analysis?.feedback.slowdowns || []
            )
          )
        ).slice(0, 5)
  const nextFocus =
    session.analysis?.next_focus && session.analysis.next_focus.length > 0
      ? session.analysis.next_focus
      : analyzedAnswers
          .map((answer) => answer.analysis?.feedback.next_focus?.trim())
          .filter((value): value is string => Boolean(value))
  const uniqueNextFocus = Array.from(new Set(nextFocus))
    .filter((value) => value.length > 0)
    .slice(0, 3)
  const primaryNextFocus =
    uniqueNextFocus[0] || "Practice a tighter opening with clearer structure."
  const weakestAnswer = getWeakestAnswer(answers)
  const weakestIndex = weakestAnswer
    ? answers.findIndex((answer) => answer.id === weakestAnswer.id)
    : 0
  const weakestEvidence = getEvidence(weakestAnswer)
  const redoHref = `${ROUTES.STUDENT_SESSION_NEW}?batch=${encodeURIComponent(session.batch_id)}&questionSet=${encodeURIComponent(session.question_set_id)}&autostart=1`
  const coaching = session.analysis?.coaching_summary ?? null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Session Results"
        description={session.question_set?.title || "Practice Session"}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={ROUTES.STUDENT_DASHBOARD}>
                <ArrowLeft className="mr-1 size-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild>
              <Link href={redoHref}>
                <Mic className="mr-1 size-4" />
                Redo This Set
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-around">
          <GradeBadge grade={overallGrade} score={avgScore} size="lg" />
          <Separator orientation="vertical" className="hidden h-16 sm:block" />
          <div className="space-y-2 text-center sm:text-left">
            <p className="text-lg font-medium">
              {analyzedAnswers.length}/{answers.length} questions reviewed
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(session.started_at).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <CoachingSummaryPanel
        coaching={coaching}
        fallback={{
          title: primaryNextFocus,
          explanation:
            "Use this as one focused target for your next attempt while the feedback is still fresh.",
          successTarget:
            "Redo this set and apply the same target to every answer.",
          observation: weakestAnswer
            ? `The clearest coaching opportunity came from question ${weakestIndex + 1}.`
            : "Your latest session is ready to turn into one concrete practice target.",
          evidence: weakestEvidence,
          drillInstruction:
            "Answer directly, add one example, then close with the result.",
          drillPattern: "My answer is... For example... The result was...",
          progressMessage:
            "Repeat the set once with this target to make the next result more useful.",
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={redoHref}>
            <Mic className="mr-1 size-4" />
            Redo This Set Now
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="#answer-breakdown">Review Weakest Answer</Link>
        </Button>
      </div>

      <FeedbackCards
        strengths={strengths}
        slowdowns={slowdowns}
        nextFocus={uniqueNextFocus}
      />

      <Card id="answer-breakdown">
        <CardHeader>
          <CardTitle>Answer Breakdown</CardTitle>
          <CardDescription>Your feedback for each answer</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsTabs
            answers={answers}
            defaultIndex={Math.max(0, weakestIndex)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
