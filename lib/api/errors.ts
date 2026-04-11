import type { ApiError } from "@/lib/types"

export function toApiError(error: unknown, fallback = "Something went wrong"): ApiError {
  if (
    error &&
    typeof error === "object" &&
    "detail" in error &&
    typeof (error as { detail: unknown }).detail === "string" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return error as ApiError
  }

  if (error instanceof Error) {
    return {
      detail: error.message,
      status: 500,
    }
  }

  return {
    detail: fallback,
    status: 500,
  }
}
