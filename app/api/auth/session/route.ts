import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth/server"
import { AUTH_COOKIE_NAMES } from "@/lib/constants"

const COOKIE_OPTIONS = {
  // The browser API client reads this token to attach Authorization headers
  // when calling the backend directly from client-side hooks.
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ user })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { idToken?: string } | null
  if (!body?.idToken) {
    return NextResponse.json({ detail: "Missing idToken" }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, body.idToken, COOKIE_OPTIONS)

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, "", {
    ...COOKIE_OPTIONS,
    expires: new Date(0),
  })

  return NextResponse.json({ ok: true })
}
