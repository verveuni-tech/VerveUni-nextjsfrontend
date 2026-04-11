import { NextResponse } from "next/server"

import { saveAnswer } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { sessionId } = await params
    const body = (await request.json()) as {
      question_id: string
      audio_path: string
      duration_seconds?: number | null
      cloudinary: {
        public_id: string
        asset_id?: string | null
        resource_type: string
        secure_url: string
        format?: string | null
        bytes?: number | null
        duration_seconds?: number | null
      }
    }

    const answer = await saveAnswer(user, sessionId, body)
    return NextResponse.json(answer)
  } catch (error) {
    return handleRouteError(error)
  }
}
