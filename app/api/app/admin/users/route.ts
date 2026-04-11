import { NextResponse } from "next/server"

import { listOrgUsers } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET() {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const users = await listOrgUsers(user)
    return NextResponse.json(users)
  } catch (error) {
    return handleRouteError(error)
  }
}
