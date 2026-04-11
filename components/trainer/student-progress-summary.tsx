import { Calendar, Target, TrendingUp } from "lucide-react"

import { StatCard } from "@/components/shared/stat-card"
import type { ProgressSummary } from "@/lib/types"

export function StudentProgressSummary({ progress }: { progress: ProgressSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Sessions" value={progress.total_sessions} icon={Calendar} />
      <StatCard title="Average Score" value={`${Math.round(progress.avg_score)}%`} icon={TrendingUp} />
      <StatCard title="Delivery" value={`${Math.round(progress.avg_delivery)}%`} icon={Target} />
      <StatCard title="Content" value={`${Math.round(progress.avg_content)}%`} icon={Target} />
    </div>
  )
}
