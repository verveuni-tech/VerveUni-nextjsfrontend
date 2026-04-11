import { NextResponse } from "next/server"

import { joinOrganization } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const body = (await request.json()) as { invite_code?: string }
    if (!body.invite_code?.trim()) {
      return NextResponse.json({ detail: "Invite code is required" }, { status: 400 })
    }

    const profile = await joinOrganization(user, {
      inviteCode: body.invite_code,
    })

    return NextResponse.json(profile)
  } catch (error) {
    return handleRouteError(error)
  }
}
