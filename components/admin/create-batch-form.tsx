"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InviteCodeCard } from "@/components/shared/invite-code-card"
import { createBatch } from "@/lib/api/batches"
import { toApiError } from "@/lib/api/errors"
import { ROUTES } from "@/lib/constants"
import { createBatchSchema, type CreateBatchFormValues } from "@/lib/schemas"
import type { Batch } from "@/lib/types"

export function CreateBatchForm() {
  const router = useAppNavigation()
  const pathname = usePathname()
  const isTrainer = pathname.startsWith("/trainer")
  const [createdBatch, setCreatedBatch] = useState<Batch | null>(null)
  const form = useForm<CreateBatchFormValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  async function onSubmit(values: CreateBatchFormValues) {
    try {
      const batch = await createBatch({
        name: values.name,
        description: values.description,
      })
      toast.success("Batch created")
      setCreatedBatch(batch)
    } catch (error) {
      toast.error(toApiError(error, "Failed to create batch").detail)
    }
  }

  if (createdBatch) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Batch Created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>{createdBatch.name}</strong> has been created. Share the invite code below with students.
          </p>
          {createdBatch.join_code ? (
            <InviteCodeCard
              code={createdBatch.join_code}
              label="Student Invite Code"
              description="Students use this code to join the batch."
            />
          ) : null}
          <div className="flex gap-2">
            <Button onClick={() => router.push(isTrainer ? ROUTES.TRAINER_BATCH(createdBatch.id) : ROUTES.ADMIN_BATCH(createdBatch.id))}>
              Go to Batch
            </Button>
            <Button variant="outline" onClick={() => { setCreatedBatch(null); form.reset() }}>
              Create Another
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Batch Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Batch"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
