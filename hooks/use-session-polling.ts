"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getSession } from "@/lib/api/sessions"
import type { Session, SessionStatus } from "@/lib/types"

const TERMINAL_STATUSES: SessionStatus[] = ["completed", "failed"]

export function useSessionPolling(
  sessionId: string,
  initialSession?: Session,
  interval = 3000
) {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [isPolling, setIsPolling] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const requestInFlightRef = useRef(false)
  const isPollingRef = useRef(false)

  const clearScheduledPoll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const getNextDelay = useCallback(() => {
    const backoffDelay = Math.min(interval + attemptRef.current * 1200, 10000)
    if (typeof document !== "undefined" && document.hidden) {
      return Math.max(backoffDelay, 10000)
    }

    return backoffDelay
  }, [interval])

  const stopPolling = useCallback(() => {
    isPollingRef.current = false
    setIsPolling(false)
    clearScheduledPoll()
  }, [clearScheduledPoll])

  const fetchSession = useCallback(async (): Promise<Session | null> => {
    if (requestInFlightRef.current) {
      return null
    }

    requestInFlightRef.current = true
    try {
      const data = await getSession(sessionId)
      setSession(data)
      attemptRef.current = 0
      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling()
      }
      return data
    } catch {
      attemptRef.current += 1
      return null
    } finally {
      requestInFlightRef.current = false
    }
  }, [sessionId, stopPolling])

  const scheduleNextPoll = useCallback(() => {
    clearScheduledPoll()
    timeoutRef.current = setTimeout(async () => {
      const data = await fetchSession()
      if (
        isPollingRef.current &&
        (!data || !TERMINAL_STATUSES.includes(data.status))
      ) {
        scheduleNextPoll()
      }
    }, getNextDelay())
  }, [clearScheduledPoll, fetchSession, getNextDelay])

  const startPolling = useCallback(() => {
    if (isPollingRef.current || timeoutRef.current) {
      return
    }

    isPollingRef.current = true
    setIsPolling(true)
    void fetchSession().then((data) => {
      if (
        isPollingRef.current &&
        (!data || !TERMINAL_STATUSES.includes(data.status))
      ) {
        scheduleNextPoll()
      }
    })
  }, [fetchSession, scheduleNextPoll])

  useEffect(() => {
    function handleVisibilityChange() {
      if (!isPolling) {
        return
      }

      scheduleNextPoll()
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
      clearScheduledPoll()
    }
  }, [clearScheduledPoll, isPolling, scheduleNextPoll])

  return {
    session,
    isPolling,
    startPolling,
    stopPolling,
    refetch: fetchSession,
  }
}
