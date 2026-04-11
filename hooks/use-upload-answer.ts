"use client"

import { useCallback, useState } from "react"

import { getUploadUrl, submitAnswer } from "@/lib/api/answers"
import { toApiError } from "@/lib/api/errors"
import type { SessionAnswer } from "@/lib/types"

export type UploadState =
  | "idle"
  | "getting-url"
  | "uploading"
  | "submitting"
  | "done"
  | "failed"

type UploadProgressState = Exclude<UploadState, "idle" | "done" | "failed">

export async function uploadAnswerAudio(
  sessionId: string,
  questionId: string,
  audioBlob: Blob,
  onProgress?: (state: UploadProgressState) => void
): Promise<SessionAnswer> {
  if (audioBlob.size === 0) {
    throw new Error("No audio was captured before the answer clock ended.")
  }

  onProgress?.("getting-url")
  const signature = await getUploadUrl({
    session_id: sessionId,
    question_id: questionId,
  })

  onProgress?.("uploading")
  const uploadFile = new File([audioBlob], `${sessionId}-${questionId}.webm`, {
    type: audioBlob.type || "audio/webm",
  })
  const formData = new FormData()
  formData.set("file", uploadFile)
  formData.set("api_key", signature.api_key)
  formData.set("timestamp", String(signature.timestamp))
  formData.set("signature", signature.signature)
  formData.set("folder", signature.folder)
  formData.set("public_id", signature.public_id)

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  )

  if (!uploadResponse.ok) {
    const rawBody = await uploadResponse.text().catch(() => "")
    let parsedBody: { error?: { message?: string } } | null = null
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as { error?: { message?: string } }
      } catch {
        parsedBody = null
      }
    }

    throw new Error(
      parsedBody?.error?.message || rawBody || "Cloudinary upload failed"
    )
  }

  const uploaded = (await uploadResponse.json()) as {
    asset_id?: string
    public_id: string
    resource_type: string
    secure_url: string
    format?: string
    bytes?: number
    duration?: number
  }

  onProgress?.("submitting")
  return submitAnswer({
    session_id: sessionId,
    question_id: questionId,
    audio_path: uploaded.secure_url,
    duration_seconds: uploaded.duration ?? null,
    cloudinary: {
      public_id: uploaded.public_id,
      asset_id: uploaded.asset_id ?? null,
      resource_type: uploaded.resource_type,
      secure_url: uploaded.secure_url,
      format: uploaded.format ?? null,
      bytes: uploaded.bytes ?? null,
      duration_seconds: uploaded.duration ?? null,
    },
  })
}

export function useUploadAnswer() {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (
      sessionId: string,
      questionId: string,
      audioBlob: Blob
    ): Promise<SessionAnswer | null> => {
      setError(null)
      try {
        const answer = await uploadAnswerAudio(
          sessionId,
          questionId,
          audioBlob,
          setUploadState
        )
        setUploadState("done")
        return answer
      } catch (uploadError) {
        setError(toApiError(uploadError, "Upload failed").detail)
        setUploadState("failed")
        return null
      }
    },
    []
  )

  const resetUpload = useCallback(() => {
    setUploadState("idle")
    setError(null)
  }, [])

  return { uploadState, error, upload, resetUpload }
}
