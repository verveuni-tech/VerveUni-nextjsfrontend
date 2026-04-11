import { api } from "./client"
import { appApi } from "./app-client"
import type { ApiRequestOptions, SessionAnswer, UploadUrlResponse } from "@/lib/types"

export async function getUploadUrl(
  data: { session_id: string; question_id: string },
  options?: ApiRequestOptions
): Promise<UploadUrlResponse> {
  return api.post<UploadUrlResponse>(
    "/api/v1/uploads/cloudinary-signature",
    {
      session_id: data.session_id,
      question_id: data.question_id,
      resource_type: "video",
    },
    options
  )
}

export async function submitAnswer(
  data: {
    session_id: string
    question_id: string
    audio_path: string
    duration_seconds?: number | null
    cloudinary: {
      public_id: string
      asset_id?: string | null
      resource_type: string
      secure_url: string
      format?: string | null
      bytes?: number | null
      duration_seconds?: number | null
    }
  },
  options?: ApiRequestOptions
): Promise<SessionAnswer> {
  return appApi.post<SessionAnswer>(`/api/app/sessions/${data.session_id}/answers`, data, options)
}
