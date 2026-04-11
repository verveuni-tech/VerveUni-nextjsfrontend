import { NextResponse } from "next/server"

import { createSession, listSessions } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { searchParams } = new URL(request.url)
    const sessions = await listSessions(user, {
      batch_id: searchParams.get("batch_id") || undefined,
      user_id: searchParams.get("user_id") || undefined,
    })

    return NextResponse.json(sessions)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const body = (await request.json()) as { batch_id: string; question_set_id: string }
    const session = await createSession(user, body)
    return NextResponse.json(session)
  } catch (error) {
    return handleRouteError(error)
  }
}
