import { NextResponse } from "next/server"

import { onboardStudent } from "@/lib/server/app-data"
import { handleRouteError, requireRouteIdentity } from "@/lib/server/route-helpers"

export async function POST(request: Request) {
  try {
    const identity = await requireRouteIdentity()
    if (identity instanceof NextResponse) {
      return identity
    }

    const body = (await request.json()) as {
      full_name?: string
      invite_code?: string
    }

    const profile = await onboardStudent({
      userId: identity.uid,
      email: identity.email || "",
      fullName: body.full_name || (identity.name as string) || identity.email || "Student",
      inviteCode: body.invite_code || "",
    })

    return NextResponse.json(profile)
  } catch (error) {
    return handleRouteError(error)
  }
}
