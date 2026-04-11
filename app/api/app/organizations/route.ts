import { NextResponse } from "next/server"

import { createOrganization } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const body = (await request.json()) as { name?: string }
    if (!body.name?.trim()) {
      return NextResponse.json({ detail: "Organization name is required" }, { status: 400 })
    }

    const result = await createOrganization(user, {
      organizationName: body.name,
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
