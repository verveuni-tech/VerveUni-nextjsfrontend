"use client"

import { useRef, useState } from "react"
import { ChevronDown, ChevronRight, Mic, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { appApi } from "@/lib/api/app-client"
import { toApiError } from "@/lib/api/errors"
import { useUploadQuestionAudio } from "@/hooks/use-upload-question-audio"
import type { Question, QuestionSet } from "@/lib/types"

interface QuestionSetManagerProps {
  batchId: string
  initialQuestionSets: QuestionSet[]
}

export function QuestionSetManager({ batchId, initialQuestionSets }: QuestionSetManagerProps) {
  const [questionSets, setQuestionSets] = useState(initialQuestionSets)
  const [expandedSet, setExpandedSet] = useState<string | null>(
    initialQuestionSets[0]?.id ?? null
  )
  const [showNewSetForm, setShowNewSetForm] = useState(false)
  const [newSetName, setNewSetName] = useState("")
  const [newSetDescription, setNewSetDescription] = useState("")
  const [isCreatingSet, setIsCreatingSet] = useState(false)

  async function handleCreateSet() {
    if (!newSetName.trim()) return
    setIsCreatingSet(true)
    try {
      const created = await appApi.post<QuestionSet>(
        `/api/app/batches/${batchId}/question-sets`,
        { name: newSetName.trim(), description: newSetDescription.trim() || undefined }
      )
      setQuestionSets((prev) => [...prev, { ...created, questions: [] }])
      setExpandedSet(created.id)
      setNewSetName("")
      setNewSetDescription("")
      setShowNewSetForm(false)
      toast.success("Question set created")
    } catch (error) {
      toast.error(toApiError(error, "Failed to create question set").detail)
    } finally {
      setIsCreatingSet(false)
    }
  }

  function toggleSet(id: string) {
    setExpandedSet((prev) => (prev === id ? null : id))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Question Sets</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowNewSetForm(true)}>
          <Plus className="mr-1 size-4" />
          Add Set
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showNewSetForm ? (
          <div className="rounded-lg border p-4 space-y-3">
            <div className="space-y-2">
              <Label>Set Name</Label>
              <Input
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                placeholder="Day 1 - Introduction"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newSetDescription}
                onChange={(e) => setNewSetDescription(e.target.value)}
                placeholder="Introductory interview questions"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateSet} disabled={isCreatingSet || !newSetName.trim()}>
                {isCreatingSet ? "Creating..." : "Create"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewSetForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {questionSets.length === 0 && !showNewSetForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No question sets yet. Add one to start building interview questions.
          </p>
        ) : null}

        {questionSets.map((qs) => (
          <QuestionSetAccordion
            key={qs.id}
            questionSet={qs}
            isExpanded={expandedSet === qs.id}
            onToggle={() => toggleSet(qs.id)}
            onUpdate={(updated) => {
              setQuestionSets((prev) =>
                prev.map((s) => (s.id === updated.id ? updated : s))
              )
            }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

const QUESTION_FAMILIES = [
  { value: "general", label: "General" },
  { value: "intro_self", label: "Self Introduction" },
  { value: "strengths", label: "Strengths" },
  { value: "weaknesses", label: "Weaknesses" },
  { value: "challenge", label: "Challenge / Problem" },
  { value: "motivation", label: "Motivation" },
  { value: "team_conflict", label: "Team / Conflict" },
] as const

function QuestionSetAccordion({
  questionSet,
  isExpanded,
  onToggle,
  onUpdate,
}: {
  questionSet: QuestionSet
  isExpanded: boolean
  onToggle: () => void
  onUpdate: (qs: QuestionSet) => void
}) {
  const [newQuestionBody, setNewQuestionBody] = useState("")
  const [newQuestionFamily, setNewQuestionFamily] = useState("general")
  const [isAdding, setIsAdding] = useState(false)

  async function handleAddQuestion() {
    if (!newQuestionBody.trim()) return
    setIsAdding(true)
    try {
      const question = await appApi.post<Question>(
        `/api/app/question-sets/${questionSet.id}/questions`,
        { body: newQuestionBody.trim(), family: newQuestionFamily }
      )
      onUpdate({
        ...questionSet,
        questions: [...(questionSet.questions || []), question],
        question_count: (questionSet.question_count || 0) + 1,
      })
      setNewQuestionBody("")
      toast.success("Question added")
    } catch (error) {
      toast.error(toApiError(error, "Failed to add question").detail)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    try {
      await appApi.delete(`/api/app/questions/${questionId}`)
      onUpdate({
        ...questionSet,
        questions: (questionSet.questions || []).filter((q) => q.id !== questionId),
        question_count: Math.max(0, (questionSet.question_count || 1) - 1),
      })
      toast.success("Question removed")
    } catch (error) {
      toast.error(toApiError(error, "Failed to delete question").detail)
    }
  }

  function handleQuestionUpdated(updated: Question) {
    onUpdate({
      ...questionSet,
      questions: (questionSet.questions || []).map((q) =>
        q.id === updated.id ? updated : q
      ),
    })
  }

  const questions = questionSet.questions || []

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
        onClick={onToggle}
      >
        <div>
          <p className="font-medium">{questionSet.name || questionSet.title}</p>
          <p className="text-xs text-muted-foreground">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {questionSet.description ? ` — ${questionSet.description}` : ""}
          </p>
        </div>
        {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </button>

      {isExpanded ? (
        <div className="border-t px-4 pb-4 space-y-3">
          {questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                index={index}
                questionSetId={questionSet.id}
                onDelete={() => handleDeleteQuestion(question.id)}
                onUpdated={handleQuestionUpdated}
              />
            ))}

          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Textarea
                value={newQuestionBody}
                onChange={(e) => setNewQuestionBody(e.target.value)}
                placeholder="Enter a new interview question..."
                rows={2}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={newQuestionFamily} onValueChange={(v) => { if (v) setNewQuestionFamily(v) }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Question type" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_FAMILIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddQuestion}
                disabled={isAdding || !newQuestionBody.trim()}
              >
                <Plus className="mr-1 size-4" />
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function QuestionRow({
  question,
  index,
  questionSetId,
  onDelete,
  onUpdated,
}: {
  question: Question
  index: number
  questionSetId: string
  onDelete: () => void
  onUpdated: (q: Question) => void
}) {
  const { state: uploadState, error: uploadError, upload } = useUploadQuestionAudio()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const updated = await upload(questionSetId, question.id, file)
    if (updated) {
      onUpdated(updated)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm">
            <span className="font-medium text-muted-foreground mr-2">Q{index + 1}.</span>
            {question.body}
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={onDelete} className="size-8 shrink-0">
          <Trash2 className="size-3.5 text-destructive" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {question.audio_url ? (
          <div className="flex items-center gap-2 flex-1">
            <Mic className="size-4 text-green-600 shrink-0" />
            <audio controls src={question.audio_url} className="h-8 flex-1" preload="none" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground flex-1">No audio attached</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState !== "idle" && uploadState !== "done" && uploadState !== "failed"}
        >
          {uploadState === "uploading" || uploadState === "signing" || uploadState === "saving" ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-1 size-3.5" />
              {question.audio_url ? "Replace" : "Upload Audio"}
            </>
          )}
        </Button>
      </div>

      {uploadError ? (
        <p className="text-xs text-destructive">{uploadError}</p>
      ) : null}
      {uploadState === "done" ? (
        <p className="text-xs text-green-600">Audio uploaded successfully</p>
      ) : null}
    </div>
  )
}
