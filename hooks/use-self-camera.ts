"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useSelfCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const stoppingRef = useRef(false)

  const start = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
      })

      if (stoppingRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop())
        stoppingRef.current = false
        return false
      }

      setStream(mediaStream)
      setIsActive(true)
      return true
    } catch {
      setIsActive(false)
      return false
    }
  }, [])

  const stop = useCallback(() => {
    stoppingRef.current = true
    setStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((t) => t.stop())
      }
      return null
    })
    setIsActive(false)
    stoppingRef.current = false
  }, [])

  useEffect(() => stop, [stop])

  return { stream, isActive, start, stop }
}
