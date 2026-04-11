"use client"

import { hasMinRole } from "@/lib/guards"
import type { UserRole } from "@/lib/types"

export function useRole(role: UserRole | null | undefined) {
  return {
    role: role ?? null,
    isStudent: role === "student",
    isTrainer: role ? hasMinRole(role, "instructor") : false,
    isAdmin: role ? hasMinRole(role, "org_admin") : false,
  }
}
