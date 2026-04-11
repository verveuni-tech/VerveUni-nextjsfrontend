import { AUTH_COOKIE_NAMES } from "@/lib/constants"

export function parseCookieValue(cookieHeader: string, key: string): string | null {
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))

  if (!cookie) {
    return null
  }

  const value = cookie.slice(key.length + 1)
  return value ? decodeURIComponent(value) : null
}

export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") {
    return null
  }

  return parseCookieValue(document.cookie, AUTH_COOKIE_NAMES.ACCESS_TOKEN)
}
