import { NextResponse } from "next/server"

import { updateQuestion, deleteQuestion } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { questionId } = await params
    const body = (await request.json()) as {
      body?: string
      audio_url?: string | null
      audio_cloudinary?: unknown | null
    }
    const question = await updateQuestion(user, questionId, body)
    return NextResponse.json(question)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { questionId } = await params
    await deleteQuestion(user, questionId)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleRouteError(error)
  }
}
