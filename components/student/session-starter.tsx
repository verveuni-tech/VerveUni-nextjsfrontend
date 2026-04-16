"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FolderOpen, Loader2, Play, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { createSession } from "@/lib/api/sessions"
import { toApiError } from "@/lib/api/errors"
import { ROUTES, SESSION_ROOM_IMAGE_URL } from "@/lib/constants"
import type { Batch, QuestionSet } from "@/lib/types"

function StarterEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="border-y border-border py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-muted">
        <FolderOpen className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function SessionStarter({
  batches,
  questionSetsByBatch,
  preferredBatch,
  preferredQuestionSet,
  shouldAutostart,
}: {
  batches: Batch[]
  questionSetsByBatch: Record<string, QuestionSet[]>
  preferredBatch?: string | null
  preferredQuestionSet?: string | null
  shouldAutostart?: boolean
}) {
  const router = useAppNavigation()
  const autostartAttemptedRef = useRef(false)
  const startingRequestRef = useRef(false)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(() =>
    preferredBatch && batches.some((batch) => batch.id === preferredBatch)
      ? preferredBatch
      : (batches[0]?.id ?? null)
  )
  const [startingId, setStartingId] = useState<string | null>(null)

  const questionSets = useMemo(() => {
    if (!selectedBatch) {
      return []
    }

    return questionSetsByBatch[selectedBatch] || []
  }, [questionSetsByBatch, selectedBatch])

  const selectedBatchName =
    batches.find((batch) => batch.id === selectedBatch)?.name ||
    "Assigned batch"
  const totalQuestions = questionSets.reduce(
    (sum, questionSet) =>
      sum + (questionSet.questions?.length || questionSet.question_count || 0),
    0
  )

  const startSession = useCallback(
    async (questionSetId: string, batchId = selectedBatch) => {
      if (!batchId || startingRequestRef.current) {
        return
      }

      startingRequestRef.current = true
      setStartingId(questionSetId)
      let didNavigate = false
      try {
        const session = await createSession({
          batch_id: batchId,
          question_set_id: questionSetId,
        })
        router.push(ROUTES.STUDENT_SESSION(session.id))
        didNavigate = true
      } catch (error) {
        toast.error(toApiError(error, "Failed to start session").detail)
      } finally {
        if (!didNavigate) {
          startingRequestRef.current = false
          setStartingId(null)
        }
      }
    },
    [router, selectedBatch]
  )

  useEffect(() => {
    if (
      !shouldAutostart ||
      autostartAttemptedRef.current ||
      !preferredBatch ||
      !preferredQuestionSet ||
      selectedBatch !== preferredBatch
    ) {
      return
    }

    const hasQuestionSet = (questionSetsByBatch[preferredBatch] || []).some(
      (set) => set.id === preferredQuestionSet
    )
    autostartAttemptedRef.current = true

    if (hasQuestionSet) {
      void startSession(preferredQuestionSet, preferredBatch)
    }
  }, [
    preferredBatch,
    preferredQuestionSet,
    questionSetsByBatch,
    selectedBatch,
    shouldAutostart,
    startSession,
  ])

  if (batches.length === 0) {
    return (
      <StarterEmptyState
        title="No batches available"
        description="You have not been assigned to a batch yet. Contact your instructor or organization admin."
      />
    )
  }

  return (
    <div className="space-y-10">
      <section className="overflow-hidden border border-border bg-[#ebe9e2]">
        <div className="grid min-h-[440px] lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="flex flex-col justify-between px-6 py-8 sm:px-8 sm:py-10">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                VerveUni Interview Suite
              </p>
              <h1 className="max-w-2xl text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
                Step into a more credible interview setting
              </h1>
              <p className="max-w-xl text-sm leading-7 text-foreground/68 sm:text-base">
                Structured prompts, fixed answer windows, and continuous capture
                designed to feel closer to a real room than a generic practice
                screen.
              </p>
            </div>

            <div className="grid gap-6 border-t border-black/10 pt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-semibold text-foreground">
                    {questionSets.length}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                    Live Sets
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-foreground">
                    {totalQuestions}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                    Questions
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-foreground">60s</p>
                  <p className="mt-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
                    Answer Window
                  </p>
                </div>
              </div>

              <div className="text-sm text-foreground/58">
                Selected batch
                <div className="mt-1 font-medium text-foreground">
                  {selectedBatchName}
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[280px] border-t border-black/10 lg:min-h-full lg:border-t-0 lg:border-l">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${SESSION_ROOM_IMAGE_URL})` }}
            />
            <div className="absolute inset-0 bg-black/28" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <p className="text-xs tracking-[0.18em] text-white/70 uppercase">
                Interview Room
              </p>
              <p className="mt-3 max-w-sm text-2xl leading-tight font-semibold">
                A calmer, more convincing setting before the first answer
                starts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {batches.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {batches.map((batch) => {
            const selected = selectedBatch === batch.id
            return (
              <button
                key={batch.id}
                onClick={() => setSelectedBatch(batch.id)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {batch.name}
              </button>
            )
          })}
        </div>
      ) : null}

      {questionSets.length === 0 ? (
        <StarterEmptyState
          title="No question sets"
          description={`No question sets are available for ${selectedBatchName} yet.`}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Available Runs
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Choose a question set
              </h2>
            </div>
            <p className="max-w-sm text-right text-sm leading-6 text-muted-foreground">
              Prompts continue without a manual pause inside the session. Pick
              the run you want and go straight in.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {questionSets.map((questionSet, index) => {
              const questionCount =
                questionSet.questions?.length ||
                questionSet.question_count ||
                "?"
              const starting = startingId === questionSet.id
              const isStartingAnySession = startingId !== null
              const recommended = preferredQuestionSet === questionSet.id

              return (
                <div
                  key={questionSet.id}
                  className="grid gap-4 py-5 sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="font-mono text-sm text-muted-foreground">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-medium">
                        {questionSet.title}
                      </h2>
                      {recommended ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                          <Sparkles className="size-3" />
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {questionSet.description ||
                        `${questionSet.family} questions`}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {questionCount} question{questionCount === 1 ? "" : "s"}{" "}
                      in one continuous run
                    </p>
                  </div>
                  <button
                    onClick={() => startSession(questionSet.id)}
                    disabled={isStartingAnySession}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {starting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    {starting ? "Starting" : "Start run"}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
