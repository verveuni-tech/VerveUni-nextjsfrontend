import { appApi } from "./app-client"
import type { ApiRequestOptions, LeaderboardEntry, ProgressSnapshot, ProgressSummary } from "@/lib/types"

export async function getMyProgress(batchId?: string, options?: ApiRequestOptions): Promise<ProgressSummary> {
  const params = batchId ? { batch_id: batchId } : undefined
  return appApi.get<ProgressSummary>("/api/app/progress", params, options)
}

export async function getMySessions(batchId?: string, options?: ApiRequestOptions): Promise<ProgressSnapshot[]> {
  const params = batchId ? { batch_id: batchId } : undefined
  return appApi.get<ProgressSnapshot[]>("/api/app/progress/sessions", params, options)
}

export async function getSessionFeedback(sessionId: string, options?: ApiRequestOptions) {
  void sessionId
  void options
  return null
}

export async function getUserProgress(
  userId: string,
  batchId: string,
  options?: ApiRequestOptions
): Promise<ProgressSummary> {
  return appApi.get<ProgressSummary>(`/api/app/progress/students/${userId}`, { batch_id: batchId }, options)
}

export async function getBatchLeaderboard(batchId: string, options?: ApiRequestOptions): Promise<LeaderboardEntry[]> {
  void batchId
  void options
  return []
}
