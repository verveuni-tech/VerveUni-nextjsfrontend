import { appApi } from "./app-client"
import type { ApiRequestOptions, QuestionSet } from "@/lib/types"

export async function listQuestionSets(
  params?: { batch_id?: string },
  options?: ApiRequestOptions
): Promise<QuestionSet[]> {
  return appApi.get<QuestionSet[]>("/api/app/question-sets", params, options)
}

export async function getQuestionSet(setId: string, options?: ApiRequestOptions): Promise<QuestionSet> {
  return appApi.get<QuestionSet>(`/api/app/question-sets/${setId}`, undefined, options)
}
