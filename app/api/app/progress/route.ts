import { NextResponse } from "next/server"

import { getProgressSummary } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batch_id") || undefined
    const summary = await getProgressSummary(user, undefined, batchId)
    return NextResponse.json(summary)
  } catch (error) {
    return handleRouteError(error)
  }
}
