"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { exportBatch } from "@/lib/api/batches"
import { toApiError } from "@/lib/api/errors"

export function ExportButton({ batchId }: { batchId: string }) {
  async function handleExport() {
    try {
      const response = await exportBatch(batchId)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download =
        response.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        `batch-${batchId}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(toApiError(error, "Failed to export batch").detail)
    }
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 size-4" />
      Export
    </Button>
  )
}
