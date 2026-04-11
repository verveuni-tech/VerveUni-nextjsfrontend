import { NextResponse } from "next/server"

import { getBatch } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { batchId } = await params
    const batch = await getBatch(user, batchId)
    return NextResponse.json(batch)
  } catch (error) {
    return handleRouteError(error)
  }
}
