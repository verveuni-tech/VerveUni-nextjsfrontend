import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { takeRateLimitToken } from "@/lib/server/rate-limit"

const AUTH_COOKIE = "verve_id_token"

const PUBLIC_PATHS = new Set(["/login", "/signup"])

const PROTECTED_PREFIXES = ["/student", "/trainer", "/admin", "/platform"]

function getClientIdentifier(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")
  const ip = forwardedFor || realIp || "unknown"

  return token ? `auth:${token.slice(-16)}` : `anon:${ip}`
}

function getRateLimitPolicy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method.toUpperCase()

  if (!pathname.startsWith("/api/")) {
    return null
  }

  if (pathname === "/api/auth/session") {
    return { bucket: "auth-session", limit: 20, windowMs: 60_000 }
  }

  if (pathname.endsWith("/complete")) {
    return { bucket: "session-complete", limit: 12, windowMs: 60_000 }
  }

  if (pathname.endsWith("/answers")) {
    return { bucket: "session-answers", limit: 90, windowMs: 60_000 }
  }

  if (pathname.includes("/uploads/")) {
    return { bucket: "uploads", limit: 90, windowMs: 60_000 }
  }

  if (method === "GET") {
    return { bucket: "reads", limit: 240, windowMs: 60_000 }
  }

  return { bucket: "writes", limit: 80, windowMs: 60_000 }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets entirely
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // Rate-limit API routes
  const rateLimitPolicy = getRateLimitPolicy(request)
  if (rateLimitPolicy) {
    const identifier = getClientIdentifier(request)
    const result = takeRateLimitToken({
      key: `${rateLimitPolicy.bucket}:${identifier}`,
      limit: rateLimitPolicy.limit,
      windowMs: rateLimitPolicy.windowMs,
    })

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          detail: "Too many requests. Please wait a moment and try again.",
        },
        { status: 429 }
      )
      response.headers.set("Retry-After", String(result.retryAfterSeconds))
      response.headers.set("X-RateLimit-Limit", String(result.limit))
      response.headers.set("X-RateLimit-Remaining", String(result.remaining))
      response.headers.set("X-RateLimit-Reset", String(result.resetAt))
      return response
    }

    // API routes don't need auth redirection — pass through after rate-limit
    return NextResponse.next()
  }

  // Skip public page paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  // No token on a protected route → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
