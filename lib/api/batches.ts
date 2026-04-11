import { appApi } from "./app-client"
import type { ApiRequestOptions, Batch, BatchMembership } from "@/lib/types"

export async function listBatches(params?: { status?: string }, options?: ApiRequestOptions): Promise<Batch[]> {
  return appApi.get<Batch[]>("/api/app/batches", params, options)
}

export async function getBatch(batchId: string, options?: ApiRequestOptions): Promise<Batch> {
  return appApi.get<Batch>(`/api/app/batches/${batchId}`, undefined, options)
}

export async function createBatch(
  data: { name: string; description?: string },
  options?: ApiRequestOptions
): Promise<Batch> {
  return appApi.post<Batch>("/api/app/batches", data, options)
}

export async function listBatchMembers(batchId: string, options?: ApiRequestOptions): Promise<BatchMembership[]> {
  return appApi.get<BatchMembership[]>(`/api/app/batches/${batchId}/members`, undefined, options)
}

export async function addBatchMember(
  batchId: string,
  data: { user_id?: string; email?: string; role: "student" | "instructor" },
  options?: ApiRequestOptions
): Promise<BatchMembership> {
  return appApi.post<BatchMembership>(`/api/app/batches/${batchId}/members`, data, options)
}

export async function removeBatchMember(batchId: string, memberId: string, options?: ApiRequestOptions) {
  return appApi.delete<null>(`/api/app/batches/${batchId}/members/${memberId}`, options)
}

export async function assignBatchTrainer(
  batchId: string,
  data: { trainer_user_id?: string; email?: string },
  options?: ApiRequestOptions
) {
  return appApi.post<BatchMembership>(`/api/app/batches/${batchId}/assign-instructor`, data, options)
}

export async function exportBatch(batchId: string, options?: ApiRequestOptions) {
  const baseUrl = typeof window === "undefined" ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" : ""
  return fetch(`${baseUrl}/api/app/batches/${batchId}/export`, {
    headers:
      options?.accessToken && typeof window === "undefined"
        ? {
            Cookie: `verve_id_token=${encodeURIComponent(options.accessToken)}`,
          }
        : undefined,
  })
}
