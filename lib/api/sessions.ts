import { appApi } from "./app-client"
import type { ApiRequestOptions, Session } from "@/lib/types"

export async function listSessions(
  params?: { batch_id?: string; user_id?: string },
  options?: ApiRequestOptions
): Promise<Session[]> {
  return appApi.get<Session[]>("/api/app/sessions", params, options)
}

export async function getSession(sessionId: string, options?: ApiRequestOptions): Promise<Session> {
  return appApi.get<Session>(`/api/app/sessions/${sessionId}`, undefined, options)
}

export async function createSession(
  data: { batch_id: string; question_set_id: string },
  options?: ApiRequestOptions
): Promise<Session> {
  return appApi.post<Session>("/api/app/sessions", data, options)
}

export async function completeSession(sessionId: string, options?: ApiRequestOptions): Promise<Session> {
  return appApi.post<Session>(`/api/app/sessions/${sessionId}/complete`, undefined, options)
}
