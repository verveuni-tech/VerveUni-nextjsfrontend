import { NextResponse } from "next/server"

import { getSession } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { sessionId } = await params
    const session = await getSession(user, sessionId)
    return NextResponse.json(session)
  } catch (error) {
    return handleRouteError(error)
  }
}
