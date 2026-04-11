import { NextResponse } from "next/server"

import { getServerAccessToken } from "@/lib/auth/server"
import { API_BASE_URL } from "@/lib/constants"
import { markSessionReady } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  void request

  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { sessionId } = await params
    const session = await markSessionReady(user, sessionId)

    const idToken = await getServerAccessToken()
    if (idToken) {
      const analyzeResponse = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null)

      if (!analyzeResponse?.ok) {
        const body = await analyzeResponse?.json().catch(() => ({ detail: "Analysis request failed or timed out" }))
        const detail = body?.detail || "Analysis request failed or timed out"
        console.error("[complete] Backend analysis failed:", detail)
        return NextResponse.json({ ...session, _warning: detail })
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    return handleRouteError(error)
  }
}
