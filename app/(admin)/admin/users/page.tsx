import { Users } from "lucide-react"

import { UserManagementTable, type OrgUser } from "@/components/admin/user-management-table"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getServerAccessToken } from "@/lib/auth/server"
import { listOrgUsers } from "@/lib/api/admin"

export default async function AdminUsersPage() {
  const accessToken = await getServerAccessToken()
  const users = await listOrgUsers(undefined, { accessToken }).catch(() => []) as OrgUser[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="View and manage users in your organization."
      />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="There are no users in your organization yet."
        />
      ) : (
        <UserManagementTable users={users} />
      )}
    </div>
  )
}
