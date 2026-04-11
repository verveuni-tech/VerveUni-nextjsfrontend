import { NextResponse } from "next/server"

import { listQuestionSets } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batch_id") || undefined
    const questionSets = await listQuestionSets(user, batchId)
    return NextResponse.json(questionSets)
  } catch (error) {
    return handleRouteError(error)
  }
}
