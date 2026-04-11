"use client"

import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"

export default function TrainerError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Trainer Area Error"
      description="We couldn't load this instructor screen. Please try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  )
}
