import { AUTH_COOKIE_NAMES } from "@/lib/constants"
import type { ApiError, ApiRequestOptions } from "@/lib/types"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

function getAppBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

function buildUrl(path: string, params?: QueryParams) {
  const url = new URL(`${getAppBaseUrl()}${path}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return url.toString()
}

function buildHeaders(options?: ApiRequestOptions, includeJson = true) {
  const headers = new Headers(options?.headers)
  if (includeJson && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  if (options?.accessToken && typeof window === "undefined") {
    headers.set("Cookie", `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=${encodeURIComponent(options.accessToken)}`)
  }

  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw {
      detail: body.detail || `HTTP ${response.status}`,
      status: response.status,
    } as ApiError
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

export const appApi = {
  async get<T>(path: string, params?: QueryParams, options?: ApiRequestOptions) {
    const response = await fetch(buildUrl(path, params), {
      method: "GET",
      headers: buildHeaders(options, false),
      cache: options?.cache ?? "no-store",
    })
    return handleResponse<T>(response)
  },
  async post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: buildHeaders(options),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.cache ?? "no-store",
    })
    return handleResponse<T>(response)
  },
  async patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    const response = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: buildHeaders(options),
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.cache ?? "no-store",
    })
    return handleResponse<T>(response)
  },
  async delete<T>(path: string, options?: ApiRequestOptions) {
    const response = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: buildHeaders(options, false),
      cache: options?.cache ?? "no-store",
    })
    return handleResponse<T>(response)
  },
}
