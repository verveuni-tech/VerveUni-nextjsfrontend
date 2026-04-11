"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertCircle,
  AudioLines,
  Check,
  Clock3,
  Loader2,
  Lock,
  Mic,
  ShieldAlert,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { useAnswerUploadQueue } from "@/hooks/use-answer-upload-queue"
import { useAppNavigation } from "@/hooks/use-app-navigation"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { useSelfCamera } from "@/hooks/use-self-camera"
import { useSessionPolling } from "@/hooks/use-session-polling"
import { toApiError } from "@/lib/api/errors"
import { completeSession } from "@/lib/api/sessions"
import { ROUTES, SESSION_ROOM_IMAGE_URL } from "@/lib/constants"
import type { Question, Session, SessionAnswer } from "@/lib/types"

const ANSWER_LIMIT_SECONDS = 60
const PREP_COUNTDOWN_SECONDS = 5
const CONNECTING_DURATION_MS = 1400
const TRANSITION_DELAY_MS = 1200
const PROMPT_AUDIO_LOAD_TIMEOUT_MS = 5500
const TEXT_ONLY_PROMPT_MIN_MS = 3200
const TEXT_ONLY_PROMPT_MAX_MS = 11000
const URGENCY_THRESHOLD_SECONDS = 15

type SessionStage =
  | "intro"
  | "prompt"
  | "prep"
  | "recording"
  | "uploading"
  | "transition"
  | "finishing"
  | "processing"
  | "error"

type InterviewerStatus = "idle" | "speaking" | "thinking" | "listening"
type PromptDelivery = "audio" | "voice" | "text"

function getAnsweredQuestionIds(session: Session) {
  return new Set(
    (session.answers || [])
      .filter((answer) => answer.status !== "pending_upload")
      .map((answer) => answer.question_id)
  )
}

function getInitialQuestionIndex(session: Session, questions: Question[]) {
  const answered = getAnsweredQuestionIds(session)
  const index = questions.findIndex((question) => !answered.has(question.id))
  return index >= 0 ? index : 0
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`
}

function estimatePromptDurationMs(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const estimated = Math.round((words / 145) * 60_000) + 900
  return Math.min(
    TEXT_ONLY_PROMPT_MAX_MS,
    Math.max(TEXT_ONLY_PROMPT_MIN_MS, estimated)
  )
}

function stageLabel(stage: SessionStage) {
  switch (stage) {
    case "prompt":
      return "Prompt"
    case "prep":
      return "Answer window"
    case "recording":
      return "Recording"
    case "uploading":
      return "Saving"
    case "transition":
      return "Next question"
    case "finishing":
      return "Finalizing"
    case "processing":
      return "Analysis"
    case "error":
      return "Attention"
    default:
      return "In session"
  }
}

function AnimatedDots() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const id = setInterval(() => setCount((current) => (current % 3) + 1), 420)
    return () => clearInterval(id)
  }, [])

  return <span className="inline-block w-4 text-left">{".".repeat(count)}</span>
}

function SignalBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {[18, 30, 42, 26, 36].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className={`w-2 rounded-md bg-[#9aa478] transition-opacity duration-300 ${
            active ? "opacity-95" : "opacity-30"
          }`}
          style={{
            height,
            animationName: active ? "session-bar" : "none",
            animationDuration: "900ms",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${index * 90}ms`,
          }}
        />
      ))}
    </div>
  )
}

function PromptMeter({
  progress,
  delivery,
  hasAudio,
  tone = "light",
}: {
  progress: number
  delivery: PromptDelivery
  hasAudio: boolean
  tone?: "light" | "dark"
}) {
  const label =
    delivery === "audio" && hasAudio
      ? "Interviewer audio"
      : delivery === "voice"
        ? "System voice"
        : "Prompt window"
  const metaClasses =
    tone === "dark" ? "text-white/58" : "text-foreground/55"
  const trackClasses = tone === "dark" ? "bg-white/12" : "bg-black/[0.08]"

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between text-xs ${metaClasses}`}>
        <span>{label}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className={`h-2 overflow-hidden rounded-md ${trackClasses}`}>
        <div
          className="h-full rounded-md bg-[#9aa478] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function ConnectingOverlay() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[#ece8df] px-6 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SESSION_ROOM_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-black/38" />

      <div className="relative w-full max-w-5xl space-y-8 border-l border-white/28 pl-6 sm:pl-8">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-md border border-white/20 bg-white/12 backdrop-blur-sm">
            <Mic className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-white/68 uppercase">
              VerveUni Interview Suite
            </p>
            <h1 className="text-3xl font-semibold">
              Preparing your interview room
            </h1>
          </div>
        </div>

        <div className="h-2 max-w-md overflow-hidden rounded-md bg-white/18">
          <div className="h-full w-2/3 animate-pulse rounded-md bg-[#9aa478]" />
        </div>

        <p className="max-w-lg text-sm leading-7 text-white/72">
          Loading question audio, camera presence, and response capture
          <AnimatedDots />
        </p>
      </div>
    </div>
  )
}

function ReadyOverlay({
  title,
  questionCount,
  onJoin,
  isLoading,
  error,
}: {
  title: string
  questionCount: number
  onJoin: () => void
  isLoading: boolean
  error: string | null
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#ece8df] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SESSION_ROOM_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-black/42" />

      <div className="relative mx-auto grid min-h-full w-full max-w-7xl gap-8 px-5 py-6 sm:px-8 sm:py-8">
        <section className="flex min-h-[68vh] flex-col justify-between">
          <div className="max-w-3xl space-y-6 border-l border-white/24 pl-5 sm:pl-8">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/18 bg-white/10 px-3 py-2 text-xs font-medium tracking-[0.18em] text-white/78 uppercase backdrop-blur-sm">
              <Lock className="h-4 w-4" />
              Structured Interview
            </div>
            <div className="space-y-4">
              <p className="text-sm text-white/62">Ready room</p>
              <h1 className="text-4xl leading-tight font-semibold text-white sm:text-6xl">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/72">
                A controlled practice environment built to feel closer to a real
                interview table than a generic meeting screen.
              </p>
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/18 pt-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="flex flex-wrap gap-8 text-white">
              <div>
                <p className="text-3xl font-semibold">{questionCount}</p>
                <p className="mt-1 text-xs tracking-[0.16em] text-white/60 uppercase">
                  Questions
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold">
                  {ANSWER_LIMIT_SECONDS}s
                </p>
                <p className="mt-1 text-xs tracking-[0.16em] text-white/60 uppercase">
                  Answer Window
                </p>
              </div>
              <div>
                <p className="text-3xl font-semibold">Continuous</p>
                <p className="mt-1 text-xs tracking-[0.16em] text-white/60 uppercase">
                  Session Flow
                </p>
              </div>
            </div>

            <div className="space-y-5 border border-white/16 bg-black/28 p-5 backdrop-blur-sm">
              <div className="space-y-3">
                {[
                  "Prompt audio leads each question",
                  "Responses save while the session continues",
                  "Final submission happens after the last answer",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm leading-6 text-white/72"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#dbe2c2]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={onJoin}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f2efe7] px-4 text-sm font-semibold text-[#1a1916] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isLoading ? "Preparing devices" : "Begin session"}
              </button>

              <p className="text-xs leading-5 text-white/48">
                Microphone access is required. Camera presence is used when
                available.
              </p>

              {error ? (
                <div className="flex items-start gap-3 rounded-md border border-[#ff4a5c]/28 bg-[#3b151b]/60 p-3 text-sm text-[#ffd7dc]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ProcessingOverlay({ sessionId }: { sessionId: string }) {
  const { session, startPolling } = useSessionPolling(sessionId)
  const router = useAppNavigation()

  useEffect(() => {
    startPolling()
  }, [startPolling])

  useEffect(() => {
    if (session?.status === "completed") {
      router.replace(ROUTES.STUDENT_RESULTS(sessionId))
    }
  }, [router, session, sessionId])

  const failed = session?.status === "failed"
  const totalAnswers = session?.answers?.length || 0
  const uploadedAnswers =
    session?.answers?.filter((answer) => answer.status !== "pending_upload")
      .length || 0
  const analyzedAnswers =
    session?.answers?.filter((answer) => answer.status === "analyzed").length ||
    0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#ece8df] px-5 text-[#15130f]">
      <div
        className="absolute inset-x-0 top-0 h-[36vh] bg-cover bg-center opacity-22"
        style={{ backgroundImage: `url(${SESSION_ROOM_IMAGE_URL})` }}
      />
      <div className="absolute inset-0 bg-[#ece8df]/92" />
      <div className="relative mx-auto w-full max-w-xl space-y-8 pt-24">
        <div className="relative flex items-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-md border border-black/10 bg-[#f4f1ea]">
            {failed ? (
              <ShieldAlert className="h-8 w-8 text-[#ff4a5c]" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-[#7f8860]" />
            )}
          </div>
          <div>
            <p className="text-sm text-foreground/48">
              {failed ? "Analysis failed" : "Interview sealed"}
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              {failed ? "Analysis could not finish" : "Preparing your feedback"}
            </h1>
          </div>
        </div>

        <p className="relative max-w-lg text-sm leading-6 text-foreground/62">
          {failed
            ? "Your responses were submitted, but the scoring pipeline did not complete."
            : "Your answers are being transcribed and scored. Keep this tab open while the report is prepared."}
        </p>

        {!failed ? (
          <div className="relative grid gap-3 border border-black/10 bg-white/72 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/58">Uploads locked</span>
              <span className="font-mono tabular-nums">
                {uploadedAnswers}/{totalAnswers || uploadedAnswers}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/58">Answers analyzed</span>
              <span className="font-mono tabular-nums">
                {analyzedAnswers}/{totalAnswers || analyzedAnswers}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function InterviewerTile({
  status,
  statusText,
  promptProgress,
  hasAudio,
  promptDelivery,
  stage,
}: {
  status: InterviewerStatus
  statusText: string
  promptProgress: number
  hasAudio: boolean
  promptDelivery: PromptDelivery
  stage: SessionStage
}) {
  const isSpeaking = status === "speaking"
  const indicatorClasses =
    stage === "error"
      ? "bg-[#ff7a87]"
      : isSpeaking
        ? "animate-pulse bg-[#9aa478]"
        : status === "thinking"
          ? "bg-[#f2d48b]"
          : "bg-white/28"
  const stateLabel =
    isSpeaking ? "Live" : status === "thinking" ? "Sync" : "Standby"

  return (
    <section className="absolute top-4 right-4 z-20 w-[168px] overflow-hidden rounded-[24px] border border-white/12 bg-[#111315]/78 p-3 text-white shadow-[0_24px_80px_-36px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:top-6 sm:right-6 sm:w-[240px] sm:p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(154,164,120,0.18),_transparent_62%)]" />
      <div className="relative space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-medium tracking-[0.22em] text-white/42 uppercase">
              Interviewer
            </p>
            <p className="mt-1 truncate text-sm font-medium text-white/82">
              {statusText}
            </p>
          </div>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${indicatorClasses}`} />
        </div>

        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] p-3">
          <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]">
            <div className="grid h-12 w-12 place-items-center rounded-[16px] border border-white/12 bg-black/18 sm:h-14 sm:w-14">
              <AudioLines className="h-5 w-5 text-white/82 sm:h-6 sm:w-6" />
            </div>
            <div className="scale-75 sm:scale-100">
              <SignalBars active={isSpeaking} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[0.65rem] font-medium tracking-[0.18em] text-white/38 uppercase">
            <span>{stageLabel(stage)}</span>
            <span>{stateLabel}</span>
          </div>

          {stage === "prompt" ? (
            <PromptMeter
              progress={promptProgress}
              delivery={promptDelivery}
              hasAudio={hasAudio}
              tone="dark"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function QuestionOverlay({
  currentIndex,
  totalQuestions,
  questionBody,
  stage,
  prepCountdown,
  remainingSeconds,
  promptProgress,
  hasAudio,
  promptDelivery,
}: {
  currentIndex: number
  totalQuestions: number
  questionBody: string
  stage: SessionStage
  prepCountdown: number
  remainingSeconds: number
  promptProgress: number
  hasAudio: boolean
  promptDelivery: PromptDelivery
}) {
  const questionNumber = Math.min(currentIndex + 1, totalQuestions)
  const isUrgent =
    stage === "recording" && remainingSeconds <= URGENCY_THRESHOLD_SECONDS
  const detail =
    stage === "prompt"
      ? hasAudio
        ? "Listen to the interviewer before you respond."
        : promptDelivery === "voice"
          ? "The system voice is reading the question now."
          : "Read the question carefully before the recording opens."
      : stage === "prep"
        ? `Recording opens in ${prepCountdown}s. Keep your answer direct and clear.`
      : stage === "recording"
        ? `Your answer window is live. ${formatTime(remainingSeconds)} remaining.`
      : stage === "uploading"
        ? "Saving your response while the next question is prepared."
      : stage === "transition"
        ? "Next question is about to begin."
      : stage === "finishing"
        ? "Wrapping up the interview and sealing your responses."
      : stage === "error"
        ? "The session needs attention before it can continue."
      : "Stay ready."
  const pillLabel =
    stage === "recording"
      ? `${formatTime(remainingSeconds)} left`
      : stage === "prep"
        ? `Starts in ${prepCountdown}s`
        : stageLabel(stage)

  return (
    <section className="absolute right-4 bottom-4 left-4 z-20 sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-[540px]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#111315]/76 p-5 text-white shadow-[0_28px_96px_-40px_rgba(0,0,0,0.92)] backdrop-blur-xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(154,164,120,0.22),_transparent_58%)]" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-medium tracking-[0.22em] text-white/44 uppercase">
                Question {questionNumber}
              </p>
              <p className="mt-2 text-lg leading-snug font-medium text-white sm:text-2xl">
                {questionBody}
              </p>
            </div>

            <div
              className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium backdrop-blur-sm ${
                isUrgent
                  ? "border-[#ff7a87]/35 bg-[#ff7a87]/18 text-[#ffd7dc]"
                  : "border-white/12 bg-white/[0.04] text-white/78"
              }`}
            >
              <div className="flex items-center gap-2">
                {stage === "recording" ? <Clock3 className="h-4 w-4" /> : null}
                <span>{pillLabel}</span>
              </div>
            </div>
          </div>

          <p
            className={`text-sm leading-6 ${
              isUrgent ? "text-[#ffd7dc]" : "text-white/62"
            }`}
          >
            {detail}
          </p>

          {stage === "prompt" ? (
            <PromptMeter
              progress={promptProgress}
              delivery={promptDelivery}
              hasAudio={hasAudio}
              tone="dark"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function UserPanel({
  stream,
  isActive,
  isRecording,
  stage,
  prepCountdown,
}: {
  stream: MediaStream | null
  isActive: boolean
  isRecording: boolean
  stage: SessionStage
  prepCountdown: number
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const element = videoRef.current
    if (element) {
      element.srcObject = stream
    }
  }, [stream])

  const candidateLabel =
    stage === "recording"
      ? "You / Recording"
      : stage === "prompt"
        ? "You / Listening"
        : stage === "uploading"
          ? "You / Saving"
          : "You"

  return (
    <section className="relative h-full min-h-[420px] overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0d0e] text-white shadow-[0_40px_140px_-60px_rgba(0,0,0,0.82)]">
      <div className="absolute inset-0 bg-[#0c0d0e]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 42%)",
        }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url(${SESSION_ROOM_IMAGE_URL})` }}
      />
      {isActive && stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[#1a1814]/84">
          <div className="grid h-24 w-24 place-items-center rounded-md border border-white/12 bg-black/18">
            <Video className="h-10 w-10 text-white/58" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/12 via-transparent to-black/46" />
      <div className="pointer-events-none absolute inset-y-0 left-[14%] w-px bg-white/7" />
      <div className="pointer-events-none absolute inset-y-0 right-[14%] w-px bg-white/7" />

      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/12 bg-black/36 px-3 py-1.5 text-sm font-medium text-white/86 backdrop-blur-sm sm:top-6 sm:left-6">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isRecording ? "animate-pulse bg-[#ff4a5c]" : "bg-white/30"
          }`}
        />
        <span>{candidateLabel}</span>
      </div>

      {stage === "prep" && prepCountdown > 0 ? (
        <div className="absolute inset-0 grid place-items-center bg-black/42 backdrop-blur-[2px]">
          <div className="text-center text-white">
            <p className="font-mono text-[4.5rem] font-semibold leading-none text-[#eef2de] tabular-nums sm:text-[6rem]">
              {prepCountdown}
            </p>
            <p className="mt-4 text-sm tracking-[0.18em] text-white/62 uppercase">
              Answer opens in a moment
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function SessionRunner({
  initialSession,
  questions,
  questionSetTitle,
}: {
  initialSession: Session
  questions: Question[]
  questionSetTitle?: string
}) {
  const recorder = useAudioRecorder()
  const camera = useSelfCamera()

  const [session, setSession] = useState<Session>(initialSession)
  const [currentIndex, setCurrentIndex] = useState(() =>
    getInitialQuestionIndex(initialSession, questions)
  )
  const handleAnswerUploaded = useCallback((answer: SessionAnswer) => {
    setSession((current) => ({
      ...current,
      answers: [
        ...(current.answers || []).filter(
          (item) => item.question_id !== answer.question_id
        ),
        answer,
      ],
    }))
  }, [])
  const { enqueueUpload, waitForIdle } = useAnswerUploadQueue({
    onAnswerUploaded: handleAnswerUploaded,
  })
  const initialStage: SessionStage =
    initialSession.status === "ready_for_analysis" ||
    initialSession.status === "processing"
      ? "processing"
      : "intro"
  const [stage, setStage] = useState<SessionStage>(initialStage)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isPrimingMicrophone, setIsPrimingMicrophone] = useState(false)
  const [showConnecting, setShowConnecting] = useState(initialStage === "intro")
  const [promptProgress, setPromptProgress] = useState(0)
  const [promptDelivery, setPromptDelivery] = useState<PromptDelivery>("audio")
  const [prepCountdown, setPrepCountdown] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const promptRunIdRef = useRef(0)
  const recordingStartedRef = useRef(false)
  const captureAttemptRef = useRef<string | null>(null)
  const completeTriggeredRef = useRef(false)

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const runnerTitle =
    questionSetTitle || session.question_set?.title || "Interview Session"
  const remainingRecordingSeconds = Math.max(
    ANSWER_LIMIT_SECONDS - recorder.duration,
    0
  )

  const interviewerStatus: InterviewerStatus =
    stage === "prompt"
      ? "speaking"
      : stage === "recording"
        ? "listening"
        : stage === "uploading" ||
            stage === "finishing" ||
            stage === "transition"
          ? "thinking"
          : "idle"

  const statusText =
    stage === "prompt"
      ? "Prompt playing"
      : stage === "prep"
        ? "Answer window opening"
        : stage === "recording"
          ? "Listening"
          : stage === "uploading"
            ? "Saving response"
            : stage === "transition"
              ? "Preparing next prompt"
              : stage === "finishing"
                ? "Finalizing session"
                : stage === "error"
                  ? "Needs attention"
                  : "Ready"

  const cancelPromptPlayback = useCallback(() => {
    promptRunIdRef.current += 1
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const resetQuestionTransientState = useCallback(() => {
    cancelPromptPlayback()
    recorder.reset()
    setPromptProgress(0)
    setPromptDelivery("audio")
    setPrepCountdown(0)
    setSessionError(null)
    recordingStartedRef.current = false
    captureAttemptRef.current = null
  }, [cancelPromptPlayback, recorder])

  const goToPrompt = useCallback(() => {
    if (!currentQuestion) return
    resetQuestionTransientState()
    setStage("prompt")
  }, [currentQuestion, resetQuestionTransientState])

  useEffect(() => {
    if (!showConnecting) return
    const timer = setTimeout(
      () => setShowConnecting(false),
      CONNECTING_DURATION_MS
    )
    return () => clearTimeout(timer)
  }, [showConnecting])

  useEffect(() => {
    if (stage !== "prompt" || !currentQuestion) return

    const audio = audioRef.current
    const runId = ++promptRunIdRef.current
    const estimatedFallbackMs = estimatePromptDurationMs(currentQuestion.body)
    let cancelled = false
    let fallbackStarted = false
    let playRequested = false
    let loadTimer: ReturnType<typeof setTimeout> | null = null
    let completionTimer: ReturnType<typeof setTimeout> | null = null

    const clearTimers = () => {
      if (loadTimer) {
        clearTimeout(loadTimer)
        loadTimer = null
      }
      if (completionTimer) {
        clearTimeout(completionTimer)
        completionTimer = null
      }
    }

    const isCurrentRun = () => !cancelled && promptRunIdRef.current === runId

    const finishPrompt = () => {
      if (!isCurrentRun()) return
      clearTimers()
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      setPromptProgress(100)
      setPrepCountdown(PREP_COUNTDOWN_SECONDS)
      setStage("prep")
    }

    const deliverAsText = () => {
      if (!isCurrentRun()) return
      fallbackStarted = true
      setPromptDelivery("text")
      setPromptProgress(0)
      completionTimer = setTimeout(finishPrompt, estimatedFallbackMs)
    }

    const deliverWithSystemVoice = () => {
      if (!isCurrentRun() || fallbackStarted) return
      fallbackStarted = true
      clearTimers()
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }

      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        typeof SpeechSynthesisUtterance === "undefined"
      ) {
        deliverAsText()
        return
      }

      setPromptDelivery("voice")
      setPromptProgress(15)

      const utterance = new SpeechSynthesisUtterance(currentQuestion.body)
      utterance.rate = 0.92
      utterance.pitch = 0.88
      utterance.volume = 1
      utterance.onstart = () => {
        if (isCurrentRun()) setPromptProgress(35)
      }
      utterance.onend = finishPrompt
      utterance.onerror = finishPrompt

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      completionTimer = setTimeout(finishPrompt, estimatedFallbackMs + 2200)
    }

    if (!currentQuestion.audio_url || !audio) {
      deliverWithSystemVoice()
      return () => {
        cancelled = true
        clearTimers()
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel()
        }
      }
    }

    const updateProgress = () => {
      if (!isCurrentRun() || !audio.duration) return
      setPromptProgress((audio.currentTime / audio.duration) * 100)
    }

    const handlePlaying = () => {
      if (!isCurrentRun()) return
      if (loadTimer) {
        clearTimeout(loadTimer)
        loadTimer = null
      }
      setPromptDelivery("audio")
    }

    const handleEnded = () => finishPrompt()
    const handleError = () => deliverWithSystemVoice()

    const tryPlay = async () => {
      if (!isCurrentRun() || playRequested || fallbackStarted) return
      playRequested = true
      try {
        setPromptDelivery("audio")
        await audio.play()
      } catch {
        deliverWithSystemVoice()
      }
    }

    audio.pause()
    audio.currentTime = 0
    audio.src = currentQuestion.audio_url
    audio.load()

    audio.addEventListener("timeupdate", updateProgress)
    audio.addEventListener("playing", handlePlaying)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("stalled", handleError)
    audio.addEventListener("canplay", tryPlay, { once: true })
    audio.addEventListener("loadeddata", tryPlay, { once: true })

    loadTimer = setTimeout(() => {
      if (!fallbackStarted) {
        deliverWithSystemVoice()
      }
    }, PROMPT_AUDIO_LOAD_TIMEOUT_MS)

    if (audio.readyState >= 2) {
      void tryPlay()
    }

    return () => {
      cancelled = true
      clearTimers()
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener("timeupdate", updateProgress)
      audio.removeEventListener("playing", handlePlaying)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("stalled", handleError)
      audio.removeEventListener("canplay", tryPlay)
      audio.removeEventListener("loadeddata", tryPlay)
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [currentQuestion, stage])

  useEffect(() => {
    if (stage !== "prep") return
    const interval = setInterval(() => {
      setPrepCountdown((current) => {
        if (current <= 1) {
          clearInterval(interval)
          setStage("recording")
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [stage])

  useEffect(() => {
    if (stage !== "recording" || recordingStartedRef.current) return
    recordingStartedRef.current = true
    void recorder.startRecording().then((started) => {
      if (!started) {
        setSessionError(
          "Microphone recording could not start. The session cannot continue."
        )
        setStage("error")
      }
    })
  }, [recorder, stage])

  useEffect(() => {
    if (stage !== "recording" || recorder.state !== "recording") return
    if (recorder.duration >= ANSWER_LIMIT_SECONDS) {
      recorder.stopRecording()
    }
  }, [recorder, recorder.duration, recorder.state, stage])

  const advanceToNextStep = useCallback(() => {
    const nextIndex = currentIndex + 1
    setStage(nextIndex < totalQuestions ? "transition" : "finishing")
  }, [currentIndex, totalQuestions])

  useEffect(() => {
    if (stage !== "transition") return
    const timer = setTimeout(() => {
      const nextIndex = currentIndex + 1
      if (nextIndex < totalQuestions) {
        setCurrentIndex(nextIndex)
        resetQuestionTransientState()
        setStage("prompt")
      } else {
        setStage("finishing")
      }
    }, TRANSITION_DELAY_MS)
    return () => clearTimeout(timer)
  }, [currentIndex, resetQuestionTransientState, stage, totalQuestions])

  const captureCurrentAnswer = useCallback(() => {
    if (!currentQuestion || !recorder.audioBlob) return

    const captureKey = `${session.id}:${currentQuestion.id}:${recorder.audioBlob.size}`
    if (captureAttemptRef.current === captureKey) return
    captureAttemptRef.current = captureKey

    enqueueUpload({
      sessionId: session.id,
      questionId: currentQuestion.id,
      audioBlob: recorder.audioBlob,
    })

    recorder.reset()
    advanceToNextStep()
  }, [advanceToNextStep, currentQuestion, enqueueUpload, recorder, session.id])

  useEffect(() => {
    if (
      stage !== "recording" ||
      recorder.state !== "recorded" ||
      !recorder.audioBlob
    )
      return
    const timer = setTimeout(() => captureCurrentAnswer(), 0)
    return () => clearTimeout(timer)
  }, [captureCurrentAnswer, recorder.audioBlob, recorder.state, stage])

  useEffect(() => {
    if (stage !== "finishing" || completeTriggeredRef.current) return
    completeTriggeredRef.current = true

    void (async () => {
      try {
        cancelPromptPlayback()
        recorder.release()
        camera.stop()
        const uploadResult = await waitForIdle()
        if (!uploadResult.ok) {
          setSessionError(
            uploadResult.error ||
              "One answer could not be uploaded. The session cannot be submitted."
          )
          setStage("error")
          completeTriggeredRef.current = false
          return
        }

        const updated = await completeSession(session.id)
        setSession(updated)
        toast.success("Interview complete. Analysis has started.")
        setStage("processing")
      } catch (error) {
        setSessionError(toApiError(error, "Failed to complete session").detail)
        setStage("error")
        completeTriggeredRef.current = false
      }
    })()
  }, [
    camera,
    cancelPromptPlayback,
    recorder,
    session.id,
    stage,
    waitForIdle,
  ])

  async function handleBeginSession() {
    if (!currentQuestion) return

    setIsPrimingMicrophone(true)
    setSessionError(null)
    completeTriggeredRef.current = false

    const micReady = await recorder.prepare()
    if (!micReady) {
      setIsPrimingMicrophone(false)
      setSessionError(
        "Microphone access is required before the interview can start."
      )
      return
    }

    await camera.start()

    setIsPrimingMicrophone(false)
    goToPrompt()
  }

  if (
    session.status === "ready_for_analysis" ||
    session.status === "processing" ||
    stage === "processing"
  ) {
    return <ProcessingOverlay sessionId={session.id} />
  }

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#ece8df] px-5 text-[#15130f]">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-[#ff4a5c]" />
          <p className="mt-4 text-lg font-medium">Session has no questions</p>
          <p className="mt-1 text-sm text-foreground/52">
            This session could not be loaded. Contact your instructor.
          </p>
        </div>
      </div>
    )
  }

  if (stage === "intro") {
    return (
      <div className="fixed inset-0 z-50 bg-[#ece8df]">
        {showConnecting ? (
          <ConnectingOverlay />
        ) : (
          <ReadyOverlay
            title={runnerTitle}
            questionCount={totalQuestions}
            onJoin={handleBeginSession}
            isLoading={isPrimingMicrophone}
            error={sessionError}
          />
        )}
        <audio ref={audioRef} preload="auto" playsInline />
      </div>
    )
  }

  const isRecording = stage === "recording" && recorder.state === "recording"

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#151618] text-[#15130f]">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,255,255,0.1), transparent 38%)",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_#17191b_0%,_#121315_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(154,164,120,0.18),_transparent_34%)]" />

      <div className="relative flex h-full items-center justify-center p-3 sm:p-5">
        <main className="relative h-full w-full max-w-[1480px]">
          <UserPanel
            stream={camera.stream}
            isActive={camera.isActive}
            isRecording={isRecording}
            stage={stage}
            prepCountdown={prepCountdown}
          />

          <InterviewerTile
            status={interviewerStatus}
            statusText={statusText}
            promptProgress={promptProgress}
            hasAudio={!!currentQuestion.audio_url}
            promptDelivery={promptDelivery}
            stage={stage}
          />

          <QuestionOverlay
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            questionBody={currentQuestion.body}
            stage={stage}
            prepCountdown={prepCountdown}
            remainingSeconds={remainingRecordingSeconds}
            promptProgress={promptProgress}
            hasAudio={!!currentQuestion.audio_url}
            promptDelivery={promptDelivery}
          />

          {stage === "error" && sessionError ? (
            <div className="absolute top-4 left-1/2 z-30 w-[min(92vw,32rem)] -translate-x-1/2 sm:top-6">
              <div className="flex items-start gap-3 rounded-2xl border border-[#ff7a87]/30 bg-[#37171d]/78 px-4 py-3 text-sm text-[#ffd7dc] shadow-[0_24px_70px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{sessionError}</p>
              </div>
            </div>
          ) : null}

          <audio ref={audioRef} preload="auto" playsInline />
        </main>
      </div>
    </div>
  )
}
