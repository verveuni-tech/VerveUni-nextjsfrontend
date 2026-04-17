export type UserRole = "admin" | "org_admin" | "instructor" | "student"
export type BatchRole = "instructor" | "student"

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  organization_id: string | null
  organization_name?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  invite_code?: string
  created_at: string
}

export interface OrganizationSummary extends Organization {
  member_count: number
  active_member_count: number
  org_admin_count: number
  batch_count: number
}

export interface Batch {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: "draft" | "active" | "archived"
  join_code: string
  question_set_id?: string | null
  created_at: string
  updated_at: string
}

export interface BatchMembership {
  id: string
  user_id: string
  batch_id: string
  role: BatchRole
  user?: User
  joined_at: string
}

export interface BatchMetrics {
  total_students: number
  total_sessions: number
  avg_score: number
  completion_rate: number
}

export interface BatchExportResponse {
  filename: string
  mime_type: string
  content: Blob
}

export interface QuestionSet {
  id: string
  organization_id: string
  batch_id: string
  name: string
  title: string
  family: string
  description: string | null
  question_count: number
  questions?: Question[]
  created_at: string
}

export interface Question {
  id: string
  question_set_id: string
  body: string
  position: number
  order: number
  family: string
  audio_url?: string | null
  audio_cloudinary?: CloudinaryAsset | null
}

export type SessionStatus =
  | "draft"
  | "recording"
  | "ready_for_analysis"
  | "processing"
  | "completed"
  | "failed"

export interface Session {
  id: string
  student_id: string
  user_id: string
  batch_id: string
  question_set_id: string
  status: SessionStatus
  started_at: string
  completed_at: string | null
  created_at: string
  answers_uploaded?: number
  answers_analyzed?: number
  question_set?: QuestionSet
  answers?: SessionAnswer[]
  analysis?: SessionAnalysis | null
}

export type AnswerStatus =
  | "pending_upload"
  | "uploaded"
  | "processing"
  | "analyzed"
  | "failed"

export interface CloudinaryAsset {
  public_id: string
  asset_id?: string | null
  resource_type: string
  secure_url: string
  format?: string | null
  bytes?: number | null
  duration_seconds?: number | null
}

export interface SessionAnswer {
  id: string
  session_id: string
  question_id: string
  question_body?: string
  audio_path: string | null
  duration_seconds?: number | null
  transcript: string | null
  transcript_raw?: string | null
  transcript_clean?: string | null
  status: AnswerStatus
  cloudinary?: CloudinaryAsset | null
  question?: Question
  analysis?: AnswerAnalysis
  created_at?: string
  updated_at?: string
}

export interface ScoreDimension {
  level: string
  score?: number
  value?: number
  threshold?: string
  evidence?: string[] | string
}

export type DeliveryScores = Record<string, ScoreDimension>
export type ContentScores = Record<string, ScoreDimension>

export interface FeedbackDetail {
  strengths: string[]
  slowdowns: string[]
  next_focus: string
}

export interface AnswerAnalysis {
  id: string
  answer_id: string
  delivery_scores: DeliveryScores
  content_scores: ContentScores
  overall_score: number
  grade: string
  feedback: FeedbackDetail
  overall_delivery_level?: string | null
  overall_content_level?: string | null
  created_at?: string
}

export interface SessionFeedback {
  id: string
  session_id: string
  summary: {
    delivery_avg: number
    content_avg: number
    top_strength: string
    top_improvement: string
  }
  overall_score: number
  grade: string
}

export type CoachingDataQuality = "insufficient" | "usable" | "strong"

export type CoachingPrimaryBlocker =
  | "no_response"
  | "too_short"
  | "long_pauses"
  | "missing_structure"
  | "weak_examples"
  | "unclear_content"
  | "good_progress"

export interface CoachingSummary {
  data_quality: CoachingDataQuality
  primary_blocker: CoachingPrimaryBlocker
  next_practice_goal: {
    title: string
    explanation: string
    success_target: string
  }
  last_session_observation: {
    summary: string
    evidence: string[]
  }
  skill_to_build: {
    name: string
    why_it_matters: string
  }
  practice_drill: {
    instruction: string
    example_pattern: string
  }
  progress_signal: {
    label: string
    message: string
  }
}

export interface SessionAnalysis {
  id: string
  session_id: string
  final_score: number
  strengths: string[]
  slowdowns: string[]
  next_focus: string[]
  summary_text: string | null
  progress_snapshot?: Record<string, unknown> | null
  coaching_summary?: CoachingSummary | null
  overall_delivery_level?: string | null
  overall_content_level?: string | null
}

export interface ProgressSnapshot {
  id: string
  session_number: number
  batch_id: string
  completed_at: string | null
  overall_delivery_level: string | null
  overall_content_level: string | null
  final_score: number | null
  summary_text: string | null
}

export interface ProgressSummary {
  user_id: string
  batch_id?: string | null
  sessions_completed: number
  avg_delivery_level: string | null
  avg_content_level: string | null
  trend_direction: string | null
  metrics_summary: {
    avg_final_score: number
    latest_strengths: string[]
    latest_slowdowns: string[]
    latest_next_focus: string[]
  } | null
  coaching_summary?: CoachingSummary | null
  trend_data: Array<{
    session_id: string
    delivery_level: string
    content_level: string
    final_score: number
  }> | null
  total_sessions: number
  avg_score: number
  avg_delivery: number
  avg_content: number
  current_grade: string
  focus_area: string | null
  recent_sessions: Session[]
}

export interface LeaderboardEntry {
  user_id: string
  full_name: string
  avg_score: number
  sessions_completed: number
  grade: string
  rank: number
}

export interface UploadUrlResponse {
  timestamp: number
  folder: string
  public_id: string
  api_key: string
  signature: string
  cloud_name: string
}

export interface ApiError {
  detail: string
  status: number
}

export interface ApiRequestOptions {
  accessToken?: string | null
  cache?: RequestCache
  headers?: HeadersInit
}
