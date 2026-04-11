"use client"

import { useNavigationFeedback } from "@/components/navigation/navigation-feedback-provider"

export function useAppNavigation() {
  return useNavigationFeedback()
}
