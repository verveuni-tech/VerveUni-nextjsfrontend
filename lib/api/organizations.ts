import { appApi } from "./app-client"
import type { ApiRequestOptions, User } from "@/lib/types"

export async function createOrganization(
  data: { name: string },
  options?: ApiRequestOptions
): Promise<{ inviteCode: string; organizationId: string; organizationName: string }> {
  return appApi.post("/api/app/organizations", data, options)
}

export async function joinOrganization(
  data: { invite_code: string },
  options?: ApiRequestOptions
): Promise<User> {
  return appApi.post("/api/app/organizations/join", data, options)
}

export async function joinBatch(
  data: { invite_code: string },
  options?: ApiRequestOptions
): Promise<User> {
  return appApi.post("/api/app/batches/join", data, options)
}
