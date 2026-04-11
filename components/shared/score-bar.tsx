import { Progress } from "@/components/ui/progress"

interface ScoreBarProps {
  label: string
  value: number
  max?: number
}

export function ScoreBar({ label, value, max = 100 }: ScoreBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value)}%
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
