import { NextResponse } from "next/server"

import { addQuestion, getQuestionSet } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionSetId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { questionSetId } = await params
    const qs = await getQuestionSet(user, questionSetId)
    return NextResponse.json(qs?.questions || [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ questionSetId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const { questionSetId } = await params
    const body = (await request.json()) as {
      body: string
      order?: number
      family?: string
      audio_url?: string
      audio_cloudinary?: unknown
    }
    const question = await addQuestion(user, questionSetId, body)
    return NextResponse.json(question)
  } catch (error) {
    return handleRouteError(error)
  }
}
