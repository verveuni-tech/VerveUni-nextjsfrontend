import { appApi } from "./app-client"
import type { ApiRequestOptions, User } from "@/lib/types"

export async function getMe(options?: ApiRequestOptions): Promise<User> {
  return appApi.get<User>("/api/app/auth/me", undefined, options)
}
