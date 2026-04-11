import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { toApiError } from "@/lib/api/errors"
import { firebaseAdminAuth, firestore } from "@/lib/firebase/admin"
import { hasMinRole } from "@/lib/guards"
import { AUTH_COOKIE_NAMES, ROLE_HOME, ROUTES } from "@/lib/constants"
import type { User, UserRole } from "@/lib/types"

type UserDoc = {
  email?: string
  full_name?: string
  role?: UserRole
  organization_id?: string | null
  organization_name?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export async function getServerAccessToken() {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value ?? null
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getServerAccessToken()
  if (!token) {
    return null
  }

  try {
    const decoded = await firebaseAdminAuth.verifyIdToken(token)
    const snapshot = await firestore.collection("users").doc(decoded.uid).get()
    const data = (snapshot.data() || {}) as UserDoc
    const role = (decoded.admin ? "admin" : data.role) as UserRole | undefined

    if (!role) {
      return null
    }

    return {
      id: decoded.uid,
      email: data.email || decoded.email || "",
      full_name: data.full_name || (decoded.name as string) || decoded.email || "User",
      role,
      organization_id: data.organization_id ?? null,
      organization_name: data.organization_name ?? null,
      is_active: data.is_active ?? true,
      created_at: data.created_at || new Date(0).toISOString(),
      updated_at: data.updated_at || new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  if (!user.is_active) {
    redirect(ROUTES.LOGIN)
  }

  return user
}

export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireUser()

  if (!hasMinRole(user.role, role)) {
    redirect(ROLE_HOME[user.role] || ROUTES.LOGIN)
  }

  return user
}

export async function requireExactRole(role: UserRole): Promise<User> {
  const user = await requireUser()

  if (user.role !== role) {
    redirect(ROLE_HOME[user.role] || ROUTES.LOGIN)
  }

  return user
}

export { toApiError }
