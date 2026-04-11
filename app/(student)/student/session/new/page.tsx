import { PageHeader } from "@/components/layout/page-header"
import { SessionStarter } from "@/components/student/session-starter"
import { requireUser } from "@/lib/auth/server"
import { listBatches, listQuestionSets } from "@/lib/server/app-data"

type NewSessionPageProps = {
  searchParams: Promise<{
    batch?: string | string[]
    questionSet?: string | string[]
    autostart?: string | string[]
  }>
}

function getSingleParam(value?: string | string[]) {
  return typeof value === "string" ? value : null
}

export default async function NewSessionPage({
  searchParams,
}: NewSessionPageProps) {
  const user = await requireUser()
  const params = await searchParams
  const batches = await listBatches(user, "active").catch(() => [])
  const questionSetsEntries = await Promise.all(
    batches.map(async (batch) => [
      batch.id,
      await listQuestionSets(user, batch.id).catch(() => []),
    ] as const)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Start Practice Session"
        description="Choose a question set to begin your next mock interview."
      />
      <SessionStarter
        batches={batches}
        questionSetsByBatch={Object.fromEntries(questionSetsEntries)}
        preferredBatch={getSingleParam(params.batch)}
        preferredQuestionSet={getSingleParam(params.questionSet)}
        shouldAutostart={getSingleParam(params.autostart) === "1"}
      />
    </div>
  )
}
