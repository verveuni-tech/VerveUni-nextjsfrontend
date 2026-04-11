import { NextResponse } from "next/server"

import { addBatchMember } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { batchId } = await params
    const body = (await request.json()) as { trainer_user_id?: string; email?: string }
    const member = await addBatchMember(user, batchId, {
      user_id: body.trainer_user_id,
      email: body.email,
      role: "instructor",
    })

    return NextResponse.json(member)
  } catch (error) {
    return handleRouteError(error)
  }
}
