import { NextResponse } from "next/server"

import { setUserActive } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { userId } = await params
    const updated = await setUserActive(user, userId, true)
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
