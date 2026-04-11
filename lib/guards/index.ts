import type { UserRole } from "@/lib/types"

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  org_admin: 3,
  instructor: 2,
  student: 1,
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessStudentRoutes(role: UserRole): boolean {
  return role === "student"
}

export function canAccessTrainerRoutes(role: UserRole): boolean {
  return hasMinRole(role, "instructor")
}

export function canAccessAdminRoutes(role: UserRole): boolean {
  return hasMinRole(role, "org_admin")
}
