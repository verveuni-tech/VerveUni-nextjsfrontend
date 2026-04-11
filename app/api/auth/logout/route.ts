import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAMES } from "@/lib/constants"

export async function POST() {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(AUTH_COOKIE_NAMES.ACCESS_TOKEN, "", {
    expires: new Date(0),
    path: "/",
  })

  return response
}
