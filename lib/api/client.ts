import { API_BASE_URL } from "@/lib/constants"
import { getClientAccessToken } from "@/lib/auth/tokens"
import type { ApiError, ApiRequestOptions } from "@/lib/types"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private createNetworkError(): ApiError {
    return {
      detail: `Unable to reach the backend API at ${this.baseUrl}. Make sure the backend server is running.`,
      status: 503,
    }
  }

  private async resolveAccessToken(accessToken?: string | null) {
    if (accessToken !== undefined) {
      return accessToken
    }

    return getClientAccessToken()
  }

  private async getHeaders(options: ApiRequestOptions = {}, includeJsonContentType = true) {
    const token = await this.resolveAccessToken(options.accessToken)
    const headers = new Headers(options.headers)

    if (includeJsonContentType && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return headers
  }

  private buildUrl(path: string, params?: QueryParams) {
    const url = new URL(`${this.baseUrl}${path}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: "Unknown error" }))
      const error: ApiError = {
        detail: body.detail || `HTTP ${response.status}`,
        status: response.status,
      }
      throw error
    }

    if (response.status === 204) {
      return null as T
    }

    return response.json()
  }

  private async request(input: RequestInfo | URL, init: RequestInit) {
    try {
      return await fetch(input, init)
    } catch (error) {
      if (error instanceof TypeError) {
        throw this.createNetworkError()
      }

      throw error
    }
  }

  async get<T>(path: string, params?: QueryParams, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.getHeaders(options, false)
    const response = await this.request(this.buildUrl(path, params).toString(), {
      method: "GET",
      headers,
      cache: options?.cache ?? "no-store",
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.getHeaders(options)
    const response = await this.request(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.cache ?? "no-store",
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.getHeaders(options)
    const response = await this.request(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.cache ?? "no-store",
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.getHeaders(options)
    const response = await this.request(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: options?.cache ?? "no-store",
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    const headers = await this.getHeaders(options, false)
    const response = await this.request(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers,
      cache: options?.cache ?? "no-store",
    })
    return this.handleResponse<T>(response)
  }

  async upload(url: string, file: Blob, contentType: string): Promise<void> {
    const response = await this.request(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    })

    if (!response.ok) {
      throw { detail: "Upload failed", status: response.status } as ApiError
    }
  }

  async download(path: string, options?: ApiRequestOptions): Promise<Response> {
    const headers = await this.getHeaders(options, false)
    const response = await this.request(`${this.baseUrl}${path}`, {
      method: "GET",
      headers,
      cache: options?.cache ?? "no-store",
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw {
        detail: body.detail || `HTTP ${response.status}`,
        status: response.status,
      } as ApiError
    }

    return response
  }
}

export const api = new ApiClient(API_BASE_URL)
