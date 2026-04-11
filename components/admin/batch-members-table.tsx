"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { addBatchMember, removeBatchMember } from "@/lib/api/batches"
import { toApiError } from "@/lib/api/errors"
import type { BatchMembership } from "@/lib/types"

export function BatchMembersTable({
  batchId,
  members,
}: {
  batchId: string
  members: BatchMembership[]
}) {
  const router = useAppNavigation()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"student" | "instructor">("student")
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        return (left.user?.full_name || "").localeCompare(right.user?.full_name || "")
      }),
    [members]
  )

  async function handleAddMember() {
    setSubmitting(true)
    try {
      await addBatchMember(batchId, { email, role })
      toast.success("Member added")
      setEmail("")
      router.refresh()
    } catch (error) {
      toast.error(toApiError(error, "Failed to add member").detail)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId)
    try {
      await removeBatchMember(batchId, memberId)
      toast.success("Member removed")
      router.refresh()
    } catch (error) {
      toast.error(toApiError(error, "Failed to remove member").detail)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
          <div className="space-y-2">
            <Label htmlFor="member-email">Member Email</Label>
            <Input
              id="member-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as "student" | "instructor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddMember} disabled={submitting || !email}>
              {submitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user?.full_name || "Unknown user"}</TableCell>
                  <TableCell>{member.user?.email || "-"}</TableCell>
                  <TableCell className="capitalize">{member.role.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingId === member.id}
                    >
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
