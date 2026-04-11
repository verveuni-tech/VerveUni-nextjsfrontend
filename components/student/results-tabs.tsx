"use client"

import { Separator } from "@/components/ui/separator"
import { GradeBadge } from "@/components/shared/grade-badge"
import { ScoreBar } from "@/components/shared/score-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ScoreDimension, SessionAnswer } from "@/lib/types"

function toDisplayLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function scoreForDimension(dimension: ScoreDimension | undefined) {
  if (!dimension) {
    return 0
  }

  // If an explicit numeric value is provided (e.g. 0 for no-speech), use it
  if (typeof dimension.value === "number" && dimension.value === 0) {
    return 0
  }

  if (typeof dimension.score === "number") {
    return dimension.score * 25
  }

  switch (dimension.level) {
    case "strong":
      return 95
    case "progressing":
      return 75
    case "developing":
      return 55
    case "weak":
      return 20
    default:
      return 0
  }
}

export function ResultsTabs({ answers, defaultIndex = 0 }: { answers: SessionAnswer[]; defaultIndex?: number }) {
  return (
    <Tabs defaultValue={String(defaultIndex)}>
      <TabsList className="mb-4 flex flex-wrap">
        {answers.map((_, index) => (
          <TabsTrigger key={index} value={String(index)} className="text-xs">
            Q{index + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {answers.map((answer, index) => (
        <TabsContent key={answer.id} value={String(index)}>
          <AnswerDetail answer={answer} index={index} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

function AnswerDetail({ answer, index }: { answer: SessionAnswer; index: number }) {
  const analysis = answer.analysis
  const evidence = analysis
    ? [
        ...Object.values(analysis.delivery_scores || {}),
        ...Object.values(analysis.content_scores || {}),
      ]
        .flatMap((dimension) => {
          if (!dimension?.evidence) {
            return []
          }

          return Array.isArray(dimension.evidence) ? dimension.evidence : [dimension.evidence]
        })
        .filter((item): item is string => Boolean(item))
        .slice(0, 4)
    : []

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">
          Q{index + 1}: {answer.question?.body || answer.question_body || "Question"}
        </h4>
        {answer.transcript ? (
          <p className="mt-2 rounded-md bg-muted p-3 text-sm italic text-muted-foreground">
            &ldquo;{answer.transcript}&rdquo;
          </p>
        ) : (
          <p className="mt-2 rounded-md bg-muted p-3 text-sm italic text-muted-foreground">
            No speech detected
          </p>
        )}
      </div>

      {analysis ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium">Score</h5>
              <GradeBadge grade={analysis.grade} score={analysis.overall_score} size="sm" />
            </div>
          </div>
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Delivery</h5>
            {Object.entries(analysis.delivery_scores || {}).map(([dimension, score]) => (
              <ScoreBar key={dimension} label={toDisplayLabel(dimension)} value={scoreForDimension(score)} />
            ))}
          </div>
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Content</h5>
            {Object.entries(analysis.content_scores || {}).map(([dimension, score]) => (
              <ScoreBar key={dimension} label={toDisplayLabel(dimension)} value={scoreForDimension(score)} />
            ))}
          </div>
          {analysis.feedback ? (
            <div className="col-span-full space-y-2">
              <Separator />
              {analysis.feedback.strengths.length > 0 ? (
                <div>
                  <span className="text-xs font-medium text-green-600">Strengths: </span>
                  <span className="text-xs text-muted-foreground">{analysis.feedback.strengths.join(", ")}</span>
                </div>
              ) : null}
              {analysis.feedback.slowdowns.length > 0 ? (
                <div>
                  <span className="text-xs font-medium text-orange-600">Improve: </span>
                  <span className="text-xs text-muted-foreground">{analysis.feedback.slowdowns.join(", ")}</span>
                </div>
              ) : null}
              {analysis.feedback.next_focus ? (
                <div>
                  <span className="text-xs font-medium text-blue-600">Focus: </span>
                  <span className="text-xs text-muted-foreground">{analysis.feedback.next_focus}</span>
                </div>
              ) : null}
              {evidence.length > 0 ? (
                <div>
                  <span className="text-xs font-medium text-slate-700">Evidence: </span>
                  <span className="text-xs text-muted-foreground">{evidence.join(" | ")}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {answer.status === "processing" ? "Still processing..." : "No analysis available"}
        </p>
      )}
    </div>
  )
}
