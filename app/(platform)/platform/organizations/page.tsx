import { Building2 } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireExactRole } from "@/lib/auth/server"
import { listOrganizations } from "@/lib/server/app-data"

export default async function PlatformOrganizationsPage() {
  const user = await requireExactRole("admin")
  const organizations = await listOrganizations(user).catch(() => [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="See every organization on the platform and track member and batch counts."
      />

      {organizations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No organizations found"
          description="Organizations will appear here once institutes start onboarding."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Organization Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Org Admins</TableHead>
                  <TableHead>Batches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell className="font-medium">{organization.name}</TableCell>
                    <TableCell>{organization.slug || "-"}</TableCell>
                    <TableCell>{organization.invite_code || "-"}</TableCell>
                    <TableCell>{organization.member_count}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{organization.active_member_count}</Badge>
                    </TableCell>
                    <TableCell>{organization.org_admin_count}</TableCell>
                    <TableCell>{organization.batch_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
