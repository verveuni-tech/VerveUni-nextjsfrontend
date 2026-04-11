import { NextResponse } from "next/server"

import { changeUserRole } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { userId } = await params
    const body = (await request.json()) as { role: "admin" | "org_admin" | "instructor" | "student" }
    const updated = await changeUserRole(user, userId, body.role)
    return NextResponse.json(updated)
  } catch (error) {
    return handleRouteError(error)
  }
}
