"use client"

import { useCallback, useState } from "react"

import { appApi } from "@/lib/api/app-client"
import { toApiError } from "@/lib/api/errors"
import type { Question } from "@/lib/types"

export type AudioUploadState = "idle" | "signing" | "uploading" | "saving" | "done" | "failed"

interface SignatureResponse {
  cloud_name: string
  api_key: string
  timestamp: number
  signature: string
  folder: string
  public_id: string
}

export function useUploadQuestionAudio() {
  const [state, setState] = useState<AudioUploadState>("idle")
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (questionSetId: string, questionId: string, file: File): Promise<Question | null> => {
      setError(null)
      try {
        setState("signing")
        const sig = await appApi.post<SignatureResponse>(
          "/api/app/uploads/question-audio-signature",
          { question_set_id: questionSetId }
        )

        setState("uploading")
        const formData = new FormData()
        formData.set("file", file)
        formData.set("api_key", sig.api_key)
        formData.set("timestamp", String(sig.timestamp))
        formData.set("signature", sig.signature)
        formData.set("folder", sig.folder)
        formData.set("public_id", sig.public_id)

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`,
          { method: "POST", body: formData }
        )

        if (!uploadResponse.ok) {
          throw new Error("Cloudinary upload failed")
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

        setState("saving")
        const question = await appApi.patch<Question>(`/api/app/questions/${questionId}`, {
          audio_url: uploaded.secure_url,
          audio_cloudinary: {
            public_id: uploaded.public_id,
            asset_id: uploaded.asset_id ?? null,
            resource_type: uploaded.resource_type,
            secure_url: uploaded.secure_url,
            format: uploaded.format ?? null,
            bytes: uploaded.bytes ?? null,
            duration_seconds: uploaded.duration ?? null,
          },
        })

        setState("done")
        return question
      } catch (err) {
        setError(toApiError(err, "Audio upload failed").detail)
        setState("failed")
        return null
      }
    },
    []
  )

  const reset = useCallback(() => {
    setState("idle")
    setError(null)
  }, [])

  return { state, error, upload, reset }
}
