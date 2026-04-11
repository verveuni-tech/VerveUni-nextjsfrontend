"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assignBatchTrainer } from "@/lib/api/batches"
import { toApiError } from "@/lib/api/errors"

export function AssignTrainerDialog({
  batchId,
  onAssigned,
}: {
  batchId: string
  onAssigned?: () => void
}) {
  const [email, setEmail] = useState("")
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleAssign() {
    setSubmitting(true)
    try {
      await assignBatchTrainer(batchId, { email })
      toast.success("Instructor assigned")
      setOpen(false)
      setEmail("")
      onAssigned?.()
    } catch (error) {
      toast.error(toApiError(error, "Failed to assign instructor").detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Assign Instructor</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Instructor</DialogTitle>
          <DialogDescription>
            Enter an instructor email from your organization to connect them to this batch.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="instructor-email">Instructor Email</Label>
          <Input
            id="instructor-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleAssign} disabled={submitting || !email}>
            {submitting ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
