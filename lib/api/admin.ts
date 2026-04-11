import { appApi } from "./app-client"
import type { ApiRequestOptions, User, UserRole } from "@/lib/types"

export async function listOrgUsers(role?: string, options?: ApiRequestOptions): Promise<User[]> {
  const params = role ? { role } : undefined
  return appApi.get<User[]>("/api/app/admin/users", params, options)
}

export async function changeUserRole(userId: string, role: UserRole, options?: ApiRequestOptions): Promise<User> {
  return appApi.patch<User>(`/api/app/admin/users/${userId}/role`, { role }, options)
}

export async function deactivateUser(userId: string, options?: ApiRequestOptions): Promise<User> {
  return appApi.patch<User>(`/api/app/admin/users/${userId}/deactivate`, undefined, options)
}

export async function activateUser(userId: string, options?: ApiRequestOptions): Promise<User> {
  return appApi.patch<User>(`/api/app/admin/users/${userId}/activate`, undefined, options)
}
