import { NextResponse } from "next/server"
import crypto from "crypto"

import { handleRouteError, requireRouteUser } from "@/lib/server/route-helpers"

export async function POST(request: Request) {
  try {
    const user = await requireRouteUser()
    if (user instanceof NextResponse) return user

    const body = (await request.json()) as { question_set_id: string }
    if (!body.question_set_id) {
      return NextResponse.json({ detail: "question_set_id is required" }, { status: 400 })
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ detail: "Cloudinary not configured" }, { status: 500 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `verveuni/question-audio/${body.question_set_id}`
    const publicId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(toSign).digest("hex")

    return NextResponse.json({
      cloud_name: cloudName,
      api_key: apiKey,
      timestamp,
      signature,
      folder,
      public_id: publicId,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
