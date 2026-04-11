import { NextResponse } from "next/server"

import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/auth/server"
import { AUTH_COOKIE_NAMES } from "@/lib/constants"
import { firebaseAdminAuth } from "@/lib/firebase/admin"

export async function requireRouteUser() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  return user
}

export async function requireRouteIdentity() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAMES.ACCESS_TOKEN)?.value

  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    return await firebaseAdminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }
}

export function handleRouteError(error: unknown) {
  const detail = error instanceof Error ? error.message : "Something went wrong"
  const status = detail === "Forbidden" ? 403 : detail === "Unauthorized" ? 401 : detail.includes("not found") ? 404 : 400
  return NextResponse.json({ detail }, { status })
}
