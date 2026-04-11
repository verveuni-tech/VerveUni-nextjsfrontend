import { NextResponse } from "next/server"

import { removeBatchMember } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ batchId: string; memberId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { batchId, memberId } = await params
    await removeBatchMember(user, batchId, memberId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleRouteError(error)
  }
}
