import { NextResponse } from "next/server"

import { createBatch, listBatches } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const batches = await listBatches(user, status)
    return NextResponse.json(batches)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const body = (await request.json()) as {
      name: string
      description?: string
    }

    const batch = await createBatch(user, body)
    return NextResponse.json(batch)
  } catch (error) {
    return handleRouteError(error)
  }
}
