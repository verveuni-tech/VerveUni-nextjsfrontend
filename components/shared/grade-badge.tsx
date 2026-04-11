import { GRADE_COLORS } from "@/lib/constants"

interface GradeBadgeProps {
  grade: string
  score?: number
  size?: "sm" | "md" | "lg"
}

export function GradeBadge({ grade, score, size = "md" }: GradeBadgeProps) {
  const sizeClasses = {
    sm: "text-lg font-bold",
    md: "text-3xl font-bold",
    lg: "text-5xl font-bold",
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`${sizeClasses[size]} ${GRADE_COLORS[grade] || ""}`}>
        {grade}
      </span>
      {score !== undefined && (
        <span className="text-sm text-muted-foreground">
          {Math.round(score)}%
        </span>
      )}
    </div>
  )
}
