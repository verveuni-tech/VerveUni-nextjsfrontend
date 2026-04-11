import { NextResponse } from "next/server"

import { createUserProfile } from "@/lib/server/app-data"
import { handleRouteError, requireRouteIdentity } from "@/lib/server/route-helpers"

export async function POST(request: Request) {
  try {
    const identity = await requireRouteIdentity()
    if (identity instanceof NextResponse) {
      return identity
    }

    const body = (await request.json()) as {
      full_name?: string
      role?: "instructor" | "student"
    }

    const role = body.role === "instructor" ? "instructor" : "student"
    const profile = await createUserProfile({
      userId: identity.uid,
      email: identity.email || "",
      fullName: body.full_name || (identity.name as string) || identity.email || "User",
      role,
    })

    return NextResponse.json(profile)
  } catch (error) {
    return handleRouteError(error)
  }
}
