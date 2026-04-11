import { PageHeader } from "@/components/layout/page-header"
import { CreateBatchForm } from "@/components/admin/create-batch-form"

export default function TrainerCreateBatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Batch" description="Set up a new practice batch with questions." />
      <CreateBatchForm />
    </div>
  )
}
