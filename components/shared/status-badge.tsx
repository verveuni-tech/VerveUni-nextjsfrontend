import { Badge } from "@/components/ui/badge"
import { SESSION_STATUS_LABELS, SESSION_STATUS_COLORS } from "@/lib/constants"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={SESSION_STATUS_COLORS[status] || ""}
    >
      {SESSION_STATUS_LABELS[status] || status}
    </Badge>
  )
}
