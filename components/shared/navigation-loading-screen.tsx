import { Loader2 } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

export function NavigationLoadingScreen({
  title = "Loading next screen",
  description = "Preparing the next view so every click feels acknowledged right away.",
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-background/92 p-5 shadow-[0_32px_120px_-64px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(120,140,180,0.08),_transparent_48%)]" />

      <div className="relative space-y-6">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-border/60 bg-muted/70">
            <Loader2 className="size-4 animate-spin text-foreground/70" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden space-y-3 lg:block">
            <Skeleton className="h-9 w-28 rounded-xl" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={`nav-item-${index}`}
                className="h-10 w-full rounded-2xl"
              />
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 rounded-xl" />
              <Skeleton className="h-4 w-[min(100%,28rem)] rounded-xl" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`summary-card-${index}`}
                  className="space-y-3 rounded-[24px] border border-border/60 bg-muted/35 p-4"
                >
                  <Skeleton className="h-4 w-24 rounded-xl" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                  <Skeleton className="h-3 w-28 rounded-xl" />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={`row-${index}`}
                  className="h-12 w-full rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
