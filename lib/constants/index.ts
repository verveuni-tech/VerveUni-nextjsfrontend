export const ROUTES = {
  LOGIN: "/login",
  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_SESSION_NEW: "/student/session/new",
  STUDENT_SESSION: (id: string) => `/student/session/${id}`,
  STUDENT_RESULTS: (id: string) => `/student/results/${id}`,
  STUDENT_PROGRESS: "/student/progress",
  TRAINER_BATCHES: "/trainer/batches",
  TRAINER_BATCH_NEW: "/trainer/batches/new",
  TRAINER_BATCH: (id: string) => `/trainer/batches/${id}`,
  TRAINER_STUDENT: (id: string) => `/trainer/students/${id}`,
  PLATFORM_ORGANIZATIONS: "/platform/organizations",
  PLATFORM_USERS: "/platform/users",
  ADMIN_BATCHES: "/admin/batches",
  ADMIN_BATCH_NEW: "/admin/batches/new",
  ADMIN_BATCH: (id: string) => `/admin/batches/${id}`,
  ADMIN_BATCH_MEMBERS: (id: string) => `/admin/batches/${id}/members`,
  ADMIN_USERS: "/admin/users",
} as const

export const ROLE_LABELS: Record<string, string> = {
  admin: "Platform Admin",
  org_admin: "Organization Admin",
  instructor: "Instructor",
  student: "Student",
}

export const ROLE_HOME: Record<string, string> = {
  admin: ROUTES.PLATFORM_ORGANIZATIONS,
  org_admin: ROUTES.ADMIN_BATCHES,
  instructor: ROUTES.TRAINER_BATCHES,
  student: ROUTES.STUDENT_DASHBOARD,
}

export const SESSION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  recording: "Recording",
  ready_for_analysis: "Ready",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
}

export const SESSION_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  recording: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ready_for_analysis:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  processing:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export const GRADE_COLORS: Record<string, string> = {
  A: "text-green-600 dark:text-green-400",
  B: "text-blue-600 dark:text-blue-400",
  C: "text-yellow-600 dark:text-yellow-400",
  D: "text-orange-600 dark:text-orange-400",
  F: "text-red-600 dark:text-red-400",
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const FIREBASE_PUBLIC_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""

export const SESSION_ROOM_IMAGE_URL =
  "https://images.unsplash.com/photo-1753774021090-653a0e336c67?auto=format&fit=crop&w=2400&q=80"

export const AUTH_COOKIE_NAMES = {
  ACCESS_TOKEN: "verve_id_token",
} as const
