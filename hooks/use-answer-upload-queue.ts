"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { toApiError } from "@/lib/api/errors"
import type { SessionAnswer } from "@/lib/types"
import { uploadAnswerAudio } from "@/hooks/use-upload-answer"

const MAX_UPLOAD_ATTEMPTS = 3
const RETRY_DELAY_MS = 1200

export type AnswerUploadQueueStatus =
  | "queued"
  | "uploading"
  | "uploaded"
  | "failed"

export interface AnswerUploadQueueItem {
  id: string
  questionId: string
  status: AnswerUploadQueueStatus
  attempts: number
  error: string | null
}

interface AnswerUploadJob extends AnswerUploadQueueItem {
  sessionId: string
  audioBlob: Blob | null
}

interface UploadQueueResult {
  ok: boolean
  error?: string
}

interface UseAnswerUploadQueueOptions {
  onAnswerUploaded?: (answer: SessionAnswer) => void
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toQueueItem(job: AnswerUploadJob): AnswerUploadQueueItem {
  return {
    id: job.id,
    questionId: job.questionId,
    status: job.status,
    attempts: job.attempts,
    error: job.error,
  }
}

export function useAnswerUploadQueue({
  onAnswerUploaded,
}: UseAnswerUploadQueueOptions = {}) {
  const [items, setItems] = useState<AnswerUploadQueueItem[]>([])
  const jobsRef = useRef<AnswerUploadJob[]>([])
  const processingRef = useRef(false)
  const waitersRef = useRef<Array<(result: UploadQueueResult) => void>>([])
  const onAnswerUploadedRef = useRef(onAnswerUploaded)

  useEffect(() => {
    onAnswerUploadedRef.current = onAnswerUploaded
  }, [onAnswerUploaded])

  const publish = useCallback(() => {
    setItems(jobsRef.current.map(toQueueItem))
  }, [])

  const getQueueResult = useCallback((): UploadQueueResult => {
    const failed = jobsRef.current.find((job) => job.status === "failed")
    if (failed) {
      return {
        ok: false,
        error: failed.error || "One answer could not be uploaded.",
      }
    }
    return { ok: true }
  }, [])

  const hasActiveJobs = useCallback(
    () =>
      jobsRef.current.some(
        (job) => job.status === "queued" || job.status === "uploading"
      ),
    []
  )

  const notifyWaitersIfIdle = useCallback(() => {
    if (hasActiveJobs()) return

    const waiters = waitersRef.current
    waitersRef.current = []
    const result = getQueueResult()
    waiters.forEach((resolve) => resolve(result))
  }, [getQueueResult, hasActiveJobs])

  const updateJob = useCallback(
    (id: string, updates: Partial<AnswerUploadJob>) => {
      jobsRef.current = jobsRef.current.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      )
      publish()
    },
    [publish]
  )

  const processQueue = useCallback(async () => {
    if (processingRef.current) return
    processingRef.current = true

    try {
      while (true) {
        const job = jobsRef.current.find((item) => item.status === "queued")
        if (!job || !job.audioBlob) break

        const attempts = job.attempts + 1
        updateJob(job.id, { attempts, status: "uploading", error: null })

        try {
          const answer = await uploadAnswerAudio(
            job.sessionId,
            job.questionId,
            job.audioBlob
          )
          updateJob(job.id, {
            audioBlob: null,
            error: null,
            status: "uploaded",
          })
          onAnswerUploadedRef.current?.(answer)
        } catch (error) {
          const detail = toApiError(error, "Upload failed").detail
          if (attempts < MAX_UPLOAD_ATTEMPTS) {
            updateJob(job.id, { error: detail, status: "queued" })
            await wait(RETRY_DELAY_MS * attempts)
          } else {
            updateJob(job.id, {
              audioBlob: null,
              error: detail,
              status: "failed",
            })
          }
        }
      }
    } finally {
      processingRef.current = false
      notifyWaitersIfIdle()

      if (jobsRef.current.some((job) => job.status === "queued")) {
        void processQueue()
      }
    }
  }, [notifyWaitersIfIdle, updateJob])

  const enqueueUpload = useCallback(
    (params: { sessionId: string; questionId: string; audioBlob: Blob }) => {
      const id = `${params.sessionId}:${params.questionId}`
      const existingUploaded = jobsRef.current.some(
        (job) => job.id === id && job.status === "uploaded"
      )

      if (existingUploaded) {
        return
      }

      jobsRef.current = [
        ...jobsRef.current.filter((job) => job.id !== id),
        {
          id,
          sessionId: params.sessionId,
          questionId: params.questionId,
          audioBlob: params.audioBlob,
          status: "queued",
          attempts: 0,
          error: null,
        },
      ]
      publish()
      void processQueue()
    },
    [processQueue, publish]
  )

  const waitForIdle = useCallback((): Promise<UploadQueueResult> => {
    if (!hasActiveJobs()) {
      return Promise.resolve(getQueueResult())
    }

    return new Promise((resolve) => {
      waitersRef.current.push(resolve)
    })
  }, [getQueueResult, hasActiveJobs])

  const pendingCount = useMemo(
    () =>
      items.filter(
        (item) => item.status === "queued" || item.status === "uploading"
      ).length,
    [items]
  )
  const failedCount = useMemo(
    () => items.filter((item) => item.status === "failed").length,
    [items]
  )

  return {
    failedCount,
    items,
    pendingCount,
    enqueueUpload,
    waitForIdle,
  }
}
