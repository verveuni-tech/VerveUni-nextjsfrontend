import { BarChart3, CheckCircle2, Target, Users } from "lucide-react"

import { StatCard } from "@/components/shared/stat-card"
import type { BatchMetrics } from "@/lib/types"

export function BatchSummaryCards({ metrics }: { metrics: BatchMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Students" value={metrics.total_students} icon={Users} />
      <StatCard title="Sessions" value={metrics.total_sessions} icon={BarChart3} />
      <StatCard title="Average Score" value={`${Math.round(metrics.avg_score)}%`} icon={Target} />
      <StatCard
        title="Completion Rate"
        value={`${Math.round(metrics.completion_rate)}%`}
        icon={CheckCircle2}
      />
    </div>
  )
}
