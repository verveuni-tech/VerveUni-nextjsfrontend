import Link from "next/link"
import { ArrowLeft, Mic } from "lucide-react"
import { redirect } from "next/navigation"

import { FeedbackCards } from "@/components/feedback/feedback-cards"
import { PageHeader } from "@/components/layout/page-header"
import { GradeBadge } from "@/components/shared/grade-badge"
import { ResultsTabs } from "@/components/student/results-tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireUser } from "@/lib/auth/server"
import { getSession } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"
import type { ScoreDimension, SessionAnswer } from "@/lib/types"

function getWeakestAnswer(answers: SessionAnswer[]) {
  return [...answers]
    .filter((answer) => answer.analysis)
    .sort((left, right) => (left.analysis?.overall_score || 0) - (right.analysis?.overall_score || 0))[0] || null
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

      return Array.isArray(dimension.evidence) ? dimension.evidence : [dimension.evidence]
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 3)

  if (fromDimensions.length > 0) {
    return fromDimensions
  }

  if (answer.transcript) {
    return [`Transcript sample: "${answer.transcript.slice(0, 140)}${answer.transcript.length > 140 ? "..." : ""}"`]
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

  if (session.status === "ready_for_analysis" || session.status === "processing") {
    redirect(ROUTES.STUDENT_SESSION(sessionId))
  }

  const answers = session.answers || []
  const analyzedAnswers = answers.filter((answer) => answer.analysis)
  const avgScore =
    analyzedAnswers.length > 0
      ? analyzedAnswers.reduce((sum, answer) => sum + (answer.analysis?.overall_score || 0), 0) /
        analyzedAnswers.length
      : 0
  const overallGrade =
    avgScore >= 85 ? "A" : avgScore >= 70 ? "B" : avgScore >= 55 ? "C" : avgScore >= 40 ? "D" : "F"

  const strengths = Array.from(
    new Set(analyzedAnswers.flatMap((answer) => answer.analysis?.feedback.strengths || []))
  ).slice(0, 5)
  const slowdowns = Array.from(
    new Set(analyzedAnswers.flatMap((answer) => answer.analysis?.feedback.slowdowns || []))
  ).slice(0, 5)
  const nextFocus = analyzedAnswers
    .map((answer) => answer.analysis?.feedback.next_focus?.trim())
    .filter((value): value is string => Boolean(value))
  const uniqueNextFocus = Array.from(new Set(nextFocus))
    .filter((value) => value.length > 0)
    .slice(0, 3)
  const primaryNextFocus = uniqueNextFocus[0] || "Practice a tighter opening with clearer structure."
  const weakestAnswer = getWeakestAnswer(answers)
  const weakestIndex = weakestAnswer ? answers.findIndex((answer) => answer.id === weakestAnswer.id) : 0
  const weakestEvidence = getEvidence(weakestAnswer)
  const redoHref = `${ROUTES.STUDENT_SESSION_NEW}?batch=${encodeURIComponent(session.batch_id)}&questionSet=${encodeURIComponent(session.question_set_id)}&autostart=1`

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
              {analyzedAnswers.length}/{answers.length} questions analyzed
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

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <CardTitle>Practice Next</CardTitle>
            <CardDescription>One concrete move to take into the next attempt.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xl font-semibold text-emerald-950">{primaryNextFocus}</p>
            <p className="text-sm text-emerald-900/80">
              The fastest improvement usually comes from repeating the same set while this feedback is still fresh.
            </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biggest Coaching Opportunity</CardTitle>
            <CardDescription>
              {weakestAnswer ? `Q${weakestIndex + 1}: ${weakestAnswer.question?.body || weakestAnswer.question_body || "Question"}` : "Keep building consistency."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {weakestAnswer?.analysis?.feedback.next_focus || primaryNextFocus}
            </p>
            <ul className="space-y-2">
              {weakestEvidence.map((item, index) => (
                <li key={`${item}-${index}`} className="text-sm text-muted-foreground">
                  - {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <FeedbackCards strengths={strengths} slowdowns={slowdowns} nextFocus={uniqueNextFocus} />

      <Card id="answer-breakdown">
        <CardHeader>
          <CardTitle>Answer Breakdown</CardTitle>
          <CardDescription>Detailed results for each question</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultsTabs answers={answers} defaultIndex={Math.max(0, weakestIndex)} />
        </CardContent>
      </Card>
    </div>
  )
}
