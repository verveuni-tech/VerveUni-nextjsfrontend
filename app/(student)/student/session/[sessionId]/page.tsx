import { redirect } from "next/navigation"

import { SessionRunner } from "@/components/student/session-runner"
import { requireUser } from "@/lib/auth/server"
import { getQuestionSet, getSession } from "@/lib/server/app-data"
import { ROUTES } from "@/lib/constants"

export default async function SessionRunnerPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const user = await requireUser()

  const session = await getSession(user, sessionId)

  if (session.status === "completed") {
    redirect(ROUTES.STUDENT_RESULTS(sessionId))
  }

  const questionSet = await getQuestionSet(user, session.question_set_id)

  return (
    <SessionRunner
      initialSession={{
        ...session,
        question_set: session.question_set || questionSet,
      }}
      questions={questionSet.questions || []}
      questionSetTitle={questionSet.title}
    />
  )
}
