"use client"

import { useState } from "react"
import { Building2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InviteCodeCard } from "@/components/shared/invite-code-card"
import { createOrganization, joinOrganization } from "@/lib/api/organizations"
import { toApiError } from "@/lib/api/errors"

export function OrgSetupPrompt() {
  const router = useAppNavigation()
  const [mode, setMode] = useState<"choose" | "create" | "join" | "success">("choose")
  const [orgName, setOrgName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [createdInviteCode, setCreatedInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleCreate() {
    if (!orgName.trim()) return
    setIsLoading(true)
    try {
      const result = await createOrganization({ name: orgName.trim() })
      setCreatedInviteCode(result.inviteCode)
      setMode("success")
      toast.success("Organization created!")
    } catch (error) {
      toast.error(toApiError(error, "Failed to create organization").detail)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setIsLoading(true)
    try {
      await joinOrganization({ invite_code: inviteCode.trim() })
      toast.success("Joined organization!")
      router.refresh()
    } catch (error) {
      toast.error(toApiError(error, "Failed to join organization").detail)
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === "success") {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Organization Created</CardTitle>
            <CardDescription>Share this invite code with other instructors to join your organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteCodeCard
              code={createdInviteCode}
              label="Organization Invite Code"
              description="Share this code with instructors who should join your organization."
            />
            <Button className="mt-4 w-full" onClick={() => router.refresh()}>
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "create") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>Set up your organization to manage batches and students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Institute"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("choose")} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !orgName.trim()}>
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (mode === "join") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>Enter the invite code shared by your organization admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-invite">Invite Code</Label>
            <Input
              id="org-invite"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="ORG-XXXXXXXX"
              className="font-mono uppercase"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("choose")} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleJoin} disabled={isLoading || !inviteCode.trim()}>
              {isLoading ? "Joining..." : "Join Organization"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to VerveUni</CardTitle>
        <CardDescription>Get started by creating or joining an organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setMode("create")}
          >
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <Building2 className="size-8 text-primary" />
              <p className="font-medium">Create Organization</p>
              <p className="text-center text-xs text-muted-foreground">
                Start a new organization and invite instructors
              </p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => setMode("join")}
          >
            <CardContent className="flex flex-col items-center gap-2 pt-6">
              <UserPlus className="size-8 text-primary" />
              <p className="font-medium">Join Organization</p>
              <p className="text-center text-xs text-muted-foreground">
                Enter an invite code from your admin
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
