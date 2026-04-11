import { NextResponse } from "next/server"

import { addBatchMember, listBatchMembers } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { batchId } = await params
    const members = await listBatchMembers(user, batchId)
    return NextResponse.json(members)
  } catch (error) {
    return handleRouteError(error)
  }
}

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
    const body = (await request.json()) as {
      email?: string
      user_id?: string
      role: "instructor" | "student"
    }

    const member = await addBatchMember(user, batchId, body)
    return NextResponse.json(member)
  } catch (error) {
    return handleRouteError(error)
  }
}
