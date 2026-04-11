"use client"

import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      title="Admin Area Error"
      description="We couldn't load this admin screen. Please try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  )
}
