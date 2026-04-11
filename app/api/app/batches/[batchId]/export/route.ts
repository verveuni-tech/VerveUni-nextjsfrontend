import { NextResponse } from "next/server"

import { getProgressSummary, listBatchMembers } from "@/lib/server/app-data"
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
    const students = members.filter((member) => member.role === "student")
    const rows = await Promise.all(
      students.map(async (member) => {
        const progress = await getProgressSummary(user, member.user_id, batchId).catch(() => null)
        return {
          name: member.user?.full_name || "Unknown student",
          email: member.user?.email || "",
          sessions: progress?.total_sessions || 0,
          avgScore: progress?.avg_score || 0,
          focusArea: progress?.focus_area || "",
        }
      })
    )

    const csv = [
      "Name,Email,Sessions,Average Score,Focus Area",
      ...rows.map((row) =>
        [row.name, row.email, row.sessions, row.avgScore.toFixed(2), row.focusArea]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n")

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="batch-${batchId}.csv"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
