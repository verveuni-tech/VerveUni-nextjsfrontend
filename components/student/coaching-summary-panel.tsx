import {
  CheckCircle2,
  Lightbulb,
  MessageSquareQuote,
  Target,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CoachingSummary } from "@/lib/types"

type CoachingFallback = {
  title: string
  explanation: string
  successTarget?: string
  observation?: string
  evidence?: string[]
  skillName?: string
  skillWhy?: string
  drillInstruction?: string
  drillPattern?: string
  progressLabel?: string
  progressMessage?: string
}

const toneByQuality = {
  insufficient: {
    label: "Build the first clear attempt",
    shell: "border-amber-200 bg-amber-50/80",
    accent: "bg-amber-500",
    text: "text-amber-950",
    muted: "text-amber-900/75",
    badge: "border-amber-300 bg-amber-100 text-amber-950",
    inset: "border-amber-200 bg-white/65",
  },
  usable: {
    label: "Ready for the next attempt",
    shell: "border-sky-200 bg-sky-50/80",
    accent: "bg-sky-500",
    text: "text-sky-950",
    muted: "text-sky-900/75",
    badge: "border-sky-300 bg-sky-100 text-sky-950",
    inset: "border-sky-200 bg-white/65",
  },
  strong: {
    label: "Clear next step",
    shell: "border-emerald-200 bg-emerald-50/80",
    accent: "bg-emerald-500",
    text: "text-emerald-950",
    muted: "text-emerald-900/75",
    badge: "border-emerald-300 bg-emerald-100 text-emerald-950",
    inset: "border-emerald-200 bg-white/65",
  },
} satisfies Record<CoachingSummary["data_quality"], Record<string, string>>

function buildFallbackSummary(fallback: CoachingFallback): CoachingSummary {
  return {
    data_quality: "usable",
    primary_blocker: "good_progress",
    next_practice_goal: {
      title: fallback.title,
      explanation: fallback.explanation,
      success_target:
        fallback.successTarget ||
        "Repeat the next session with this one target in mind.",
    },
    last_session_observation: {
      summary:
        fallback.observation ||
        "This is based on the feedback available for your latest session.",
      evidence: fallback.evidence || [],
    },
    skill_to_build: {
      name: fallback.skillName || "Answer momentum",
      why_it_matters:
        fallback.skillWhy ||
        "A repeatable answer pattern makes it easier to keep speaking under pressure.",
    },
    practice_drill: {
      instruction:
        fallback.drillInstruction ||
        "Answer directly, add one example, then close with the result.",
      example_pattern:
        fallback.drillPattern ||
        "My answer is... For example... The result was...",
    },
    progress_signal: {
      label: fallback.progressLabel || "Next attempt ready",
      message:
        fallback.progressMessage ||
        "Your next completed session will make this coaching more precise.",
    },
  }
}

export function CoachingSummaryPanel({
  coaching,
  fallback,
  className,
}: {
  coaching?: CoachingSummary | null
  fallback: CoachingFallback
  className?: string
}) {
  const summary = coaching || buildFallbackSummary(fallback)
  const tone = toneByQuality[summary.data_quality]
  const evidence = summary.last_session_observation.evidence.slice(0, 4)

  return (
    <section
      className={cn("grid gap-4 lg:grid-cols-[1.15fr_0.85fr]", className)}
    >
      <Card className={cn("relative overflow-hidden", tone.shell)}>
        <div
          className={cn(
            "absolute -top-20 -right-16 size-52 rounded-full opacity-15 blur-3xl",
            tone.accent
          )}
        />
        <CardHeader className="relative">
          <Badge variant="outline" className={cn("w-fit", tone.badge)}>
            {tone.label}
          </Badge>
          <CardTitle className={cn("max-w-2xl text-2xl", tone.text)}>
            {summary.next_practice_goal.title}
          </CardTitle>
          <CardDescription className={cn("max-w-2xl", tone.muted)}>
            {summary.next_practice_goal.explanation}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className={cn("rounded-xl border p-4", tone.inset)}>
            <div className="flex items-start gap-3">
              <Target className={cn("mt-0.5 size-4 shrink-0", tone.text)} />
              <div>
                <p className={cn("text-sm font-medium", tone.text)}>
                  Success target
                </p>
                <p className={cn("mt-1 text-sm", tone.muted)}>
                  {summary.next_practice_goal.success_target}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className={cn("rounded-xl border p-4", tone.inset)}>
              <p className={cn("text-sm font-medium", tone.text)}>
                Skill to build
              </p>
              <p className={cn("mt-1 text-base font-semibold", tone.text)}>
                {summary.skill_to_build.name}
              </p>
              <p className={cn("mt-1 text-sm", tone.muted)}>
                {summary.skill_to_build.why_it_matters}
              </p>
            </div>
            <div className={cn("rounded-xl border p-4", tone.inset)}>
              <p className={cn("text-sm font-medium", tone.text)}>
                Progress signal
              </p>
              <p className={cn("mt-1 text-base font-semibold", tone.text)}>
                {summary.progress_signal.label}
              </p>
              <p className={cn("mt-1 text-sm", tone.muted)}>
                {summary.progress_signal.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareQuote className="size-4" />
              What happened last time
            </CardTitle>
            <CardDescription>
              {summary.last_session_observation.summary}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evidence.length > 0 ? (
              <ul className="space-y-2">
                {evidence.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete one more session to collect clearer evidence.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4" />
              Try this next
            </CardTitle>
            <CardDescription>
              {summary.practice_drill.instruction}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-muted/40 p-4">
              <p className="text-sm font-medium">Simple pattern</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {summary.practice_drill.example_pattern}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
