import { Users } from "lucide-react"

import { UserManagementTable, type OrgUser } from "@/components/admin/user-management-table"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { getServerAccessToken } from "@/lib/auth/server"
import { listOrgUsers } from "@/lib/api/admin"

export default async function PlatformUsersPage() {
  const accessToken = await getServerAccessToken()
  const users = (await listOrgUsers(undefined, { accessToken }).catch(() => [])) as OrgUser[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Users"
        description="Search and manage users across every organization on the platform."
      />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="There are no users on the platform yet."
        />
      ) : (
        <UserManagementTable users={users} />
      )}
    </div>
  )
}
