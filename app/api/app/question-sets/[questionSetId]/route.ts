import { NextResponse } from "next/server"

import { getQuestionSet } from "@/lib/server/app-data"
import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionSetId: string }> }
) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) {
      return user
    }

    const { questionSetId } = await params
    const questionSet = await getQuestionSet(user, questionSetId)
    return NextResponse.json(questionSet)
  } catch (error) {
    return handleRouteError(error)
  }
}
