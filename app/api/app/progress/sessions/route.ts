import { NextResponse } from "next/server"

import { getCompletedSessionSnapshots } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batch_id") || undefined
    const sessions = await getCompletedSessionSnapshots(user, batchId)
    return NextResponse.json(sessions)
  } catch (error) {
    return handleRouteError(error)
  }
}
