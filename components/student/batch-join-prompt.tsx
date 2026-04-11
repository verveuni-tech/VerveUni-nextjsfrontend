"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { joinBatch } from "@/lib/api/organizations"
import { toApiError } from "@/lib/api/errors"

export function BatchJoinPrompt() {
  const router = useAppNavigation()
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleJoin() {
    if (!inviteCode.trim()) return
    setIsLoading(true)
    try {
      await joinBatch({ invite_code: inviteCode.trim() })
      toast.success("Joined batch successfully!")
      router.refresh()
    } catch (error) {
      toast.error(toApiError(error, "Failed to join batch").detail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <Users className="size-6 text-primary" />
        </div>
        <CardTitle>Join a Batch</CardTitle>
        <CardDescription>Enter the invite code shared by your instructor to join a practice batch.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="batch-code">Batch Invite Code</Label>
          <Input
            id="batch-code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="BAT-XXXXXXXX"
            className="font-mono uppercase"
          />
        </div>
        <Button onClick={handleJoin} className="w-full" disabled={isLoading || !inviteCode.trim()}>
          {isLoading ? "Joining..." : "Join Batch"}
        </Button>
      </CardContent>
    </Card>
  )
}
