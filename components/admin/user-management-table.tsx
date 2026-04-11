"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { changeUserRole, deactivateUser, activateUser } from "@/lib/api/admin"
import { toApiError } from "@/lib/api/errors"
import { ROLE_LABELS } from "@/lib/constants"
import type { UserRole } from "@/lib/types"

export interface OrgUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  organization_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const ROLE_BADGE_VARIANTS: Record<string, string> = {
  org_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  instructor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
  { value: "org_admin", label: "Org Admin" },
]

export function UserManagementTable({ users }: { users: OrgUser[] }) {
  const router = useAppNavigation()
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null)

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setChangingRoleId(userId)
    try {
      await changeUserRole(userId, newRole)
      toast.success("Role updated successfully")
      router.refresh()
    } catch (error) {
      toast.error(toApiError(error, "Failed to update role").detail)
    } finally {
      setChangingRoleId(null)
    }
  }

  async function handleToggleStatus(userId: string, isCurrentlyActive: boolean) {
    setTogglingStatusId(userId)
    try {
      if (isCurrentlyActive) {
        await deactivateUser(userId)
        toast.success("User deactivated")
      } else {
        await activateUser(userId)
        toast.success("User activated")
      }
      router.refresh()
    } catch (error) {
      const action = isCurrentlyActive ? "deactivate" : "activate"
      toast.error(toApiError(error, `Failed to ${action} user`).detail)
    } finally {
      setTogglingStatusId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-48">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={ROLE_BADGE_VARIANTS[user.role] || ""}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? "default" : "outline"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={user.role}
                    onValueChange={(value) =>
                      handleRoleChange(user.id, value as UserRole)
                    }
                    disabled={changingRoleId === user.id}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={user.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                    disabled={togglingStatusId === user.id}
                  >
                    {togglingStatusId === user.id
                      ? "..."
                      : user.is_active
                        ? "Deactivate"
                        : "Activate"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
