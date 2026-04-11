"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type RecorderState =
  | "idle"
  | "requesting"
  | "denied"
  | "recording"
  | "recorded"

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const ensureStream = useCallback(async () => {
    const currentStream = streamRef.current
    if (currentStream && currentStream.active) {
      return currentStream
    }

    setState("requesting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setState("idle")
      return stream
    } catch {
      setState("denied")
      throw new Error("Microphone access was denied")
    }
  }, [])

  const prepare = useCallback(async () => {
    try {
      await ensureStream()
      return true
    } catch {
      return false
    }
  }, [ensureStream])

  const startRecording = useCallback(async () => {
    try {
      const stream = await ensureStream()
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })

      chunks.current = []
      mediaRecorder.current = recorder
      setAudioBlob(null)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, {
          type: recorder.mimeType || "audio/webm",
        })
        setAudioBlob(blob)
        setState("recorded")
        stopTimer()
      }

      recorder.start(250) // collect data every 250ms
      startTimeRef.current = Date.now()
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setState("recording")
      return true
    } catch {
      setAudioBlob(null)
      setState("denied")
      stopTimer()
      return false
    }
  }, [ensureStream, stopTimer])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop()
    }
  }, [])

  const release = useCallback(() => {
    stopTimer()
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop()
    }
    mediaRecorder.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setAudioBlob(null)
    setDuration(0)
    setState("idle")
  }, [stopTimer])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setState("idle")
    stopTimer()
  }, [stopTimer])

  useEffect(() => release, [release])

  return {
    state,
    audioBlob,
    duration,
    prepare,
    startRecording,
    stopRecording,
    release,
    reset,
  }
}
