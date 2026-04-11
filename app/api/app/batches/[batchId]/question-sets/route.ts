import { NextResponse } from "next/server"

import { createQuestionSet, listQuestionSets } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { batchId } = await params
    const sets = await listQuestionSets(user, batchId)
    return NextResponse.json(sets)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { batchId } = await params
    const body = (await request.json()) as { name: string; description?: string }
    const set = await createQuestionSet(user, batchId, body)
    return NextResponse.json(set)
  } catch (error) {
    return handleRouteError(error)
  }
}
