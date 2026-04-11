"use client"

import { useEffect, useRef } from "react"
import { onIdTokenChanged } from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"
import { AUTH_COOKIE_NAMES } from "@/lib/constants"

function readSessionCookie() {
  if (typeof document === "undefined") {
    return null
  }

  const prefix = `${AUTH_COOKIE_NAMES.ACCESS_TOKEN}=`
  const found = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))

  return found ? decodeURIComponent(found.slice(prefix.length)) : null
}

async function syncToken(idToken: string | null) {
  const method = idToken ? "POST" : "DELETE"
  const response = await fetch("/api/auth/session", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: idToken ? JSON.stringify({ idToken }) : undefined,
  }).catch(() => null)

  return Boolean(response?.ok)
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const lastSyncedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    lastSyncedTokenRef.current = readSessionCookie()

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (user: { getIdToken(): Promise<string> } | null) => {
      const token = user ? await user.getIdToken() : null
      const cookieToken = readSessionCookie()

      if (!token && !cookieToken) {
        lastSyncedTokenRef.current = null
        return
      }

      if (token && (token === lastSyncedTokenRef.current || token === cookieToken)) {
        lastSyncedTokenRef.current = token
        return
      }

      if (!token && !lastSyncedTokenRef.current) {
        return
      }

      const synced = await syncToken(token)
      if (synced) {
        lastSyncedTokenRef.current = token
      }
    })

    return unsubscribe
  }, [])

  return children
}
