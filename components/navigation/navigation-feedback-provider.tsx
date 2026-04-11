"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { NavigationLoadingScreen } from "@/components/shared/navigation-loading-screen"

const MIN_FEEDBACK_MS = 280
const FAILSAFE_TIMEOUT_MS = 12000

type NavigationKind = "route" | "refresh"

type NavigationState = {
  kind: NavigationKind
  startedAt: number
  sourceKey: string
  targetHref?: string | null
}

type NavigationFeedbackContextValue = {
  isNavigating: boolean
  push: (href: string, options?: { scroll?: boolean }) => void
  replace: (href: string, options?: { scroll?: boolean }) => void
  refresh: () => void
  back: () => void
  prefetch: (href: string) => void
}

const NavigationFeedbackContext =
  createContext<NavigationFeedbackContextValue | null>(null)

function buildLocationKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname
}

function normalizeHref(href: string, currentOrigin: string) {
  const url = new URL(href, currentOrigin)
  return `${url.pathname}${url.search}${url.hash}`
}

function NavigationFeedbackOverlay({
  navigation,
}: {
  navigation: NavigationState | null
}) {
  if (!navigation) {
    return null
  }

  const title =
    navigation.kind === "refresh"
      ? "Refreshing this view"
      : "Opening next screen"
  const description =
    navigation.kind === "refresh"
      ? "Updating the latest server-rendered state so the interface does not feel stalled."
      : "Moving to the next page and keeping the transition visible while it renders."

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[120] cursor-progress"
    >
      <div className="absolute inset-0 bg-background/62 backdrop-blur-[4px]" />
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
        <div className="h-full w-56 animate-pulse rounded-full bg-primary/75" />
      </div>
      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl">
          <NavigationLoadingScreen
            title={title}
            description={description}
          />
        </div>
      </div>
    </div>
  )
}

export function NavigationFeedbackProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const locationKey = buildLocationKey(pathname, search)
  const [isTransitionPending, startNavigationTransition] = useTransition()

  const [navigation, setNavigation] = useState<NavigationState | null>(null)
  const navigationRef = useRef<NavigationState | null>(null)
  const previousLocationKeyRef = useRef(locationKey)
  const refreshTransitionSeenRef = useRef(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failSafeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (failSafeTimerRef.current) {
      clearTimeout(failSafeTimerRef.current)
      failSafeTimerRef.current = null
    }
  }, [])

  const settleNavigation = useCallback(() => {
    setNavigation((current) => {
      if (!current) {
        return current
      }

      const elapsed = Date.now() - current.startedAt
      const remaining = Math.max(0, MIN_FEEDBACK_MS - elapsed)
      clearTimers()

      if (remaining === 0) {
        navigationRef.current = null
        return null
      }

      hideTimerRef.current = setTimeout(() => {
        navigationRef.current = null
        setNavigation(null)
      }, remaining)

      return current
    })
  }, [clearTimers])

  const beginNavigation = useCallback(
    (kind: NavigationKind, targetHref?: string | null) => {
      clearTimers()

      const next: NavigationState = {
        kind,
        startedAt: Date.now(),
        sourceKey: locationKey,
        targetHref,
      }

      navigationRef.current = next
      setNavigation(next)
    },
    [clearTimers, locationKey]
  )

  useEffect(() => {
    navigationRef.current = navigation
  }, [navigation])

  useEffect(() => {
    const previousLocationKey = previousLocationKeyRef.current
    previousLocationKeyRef.current = locationKey

    if (
      navigationRef.current?.kind === "route" &&
      previousLocationKey !== locationKey
    ) {
      settleNavigation()
    }
  }, [locationKey, settleNavigation])

  useEffect(() => {
    if (navigationRef.current?.kind !== "refresh") {
      refreshTransitionSeenRef.current = false
      return
    }

    if (isTransitionPending) {
      refreshTransitionSeenRef.current = true
      return
    }

    const timer = setTimeout(() => {
      if (
        navigationRef.current?.kind === "refresh" &&
        (!isTransitionPending || refreshTransitionSeenRef.current)
      ) {
        refreshTransitionSeenRef.current = false
        settleNavigation()
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [isTransitionPending, settleNavigation])

  useEffect(() => {
    if (!navigation) {
      return
    }

    if (failSafeTimerRef.current) {
      clearTimeout(failSafeTimerRef.current)
    }
    failSafeTimerRef.current = setTimeout(() => {
      navigationRef.current = null
      setNavigation(null)
    }, FAILSAFE_TIMEOUT_MS)

    return () => {
      if (failSafeTimerRef.current) {
        clearTimeout(failSafeTimerRef.current)
        failSafeTimerRef.current = null
      }
    }
  }, [navigation])

  useEffect(() => clearTimers, [clearTimers])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) {
        return
      }

      if (
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      ) {
        return
      }

      const href = anchor.getAttribute("href")
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      if (nextUrl.origin !== window.location.origin) {
        return
      }

      const nextKey = buildLocationKey(
        nextUrl.pathname,
        nextUrl.searchParams.toString()
      )
      if (nextKey === locationKey) {
        return
      }

      beginNavigation(
        "route",
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      )
    }

    document.addEventListener("click", handleDocumentClick, true)
    return () => {
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [beginNavigation, locationKey])

  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      const normalizedHref =
        typeof window === "undefined"
          ? href
          : normalizeHref(href, window.location.origin)

      beginNavigation("route", normalizedHref)
      startNavigationTransition(() => {
        router.push(href, options)
      })
    },
    [beginNavigation, router, startNavigationTransition]
  )

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      const normalizedHref =
        typeof window === "undefined"
          ? href
          : normalizeHref(href, window.location.origin)

      beginNavigation("route", normalizedHref)
      startNavigationTransition(() => {
        router.replace(href, options)
      })
    },
    [beginNavigation, router, startNavigationTransition]
  )

  const refresh = useCallback(() => {
    beginNavigation("refresh")
    startNavigationTransition(() => {
      router.refresh()
    })
  }, [beginNavigation, router, startNavigationTransition])

  const back = useCallback(() => {
    beginNavigation("route")
    startNavigationTransition(() => {
      router.back()
    })
  }, [beginNavigation, router, startNavigationTransition])

  const prefetch = useCallback(
    (href: string) => {
      void router.prefetch(href)
    },
    [router]
  )

  const value = useMemo<NavigationFeedbackContextValue>(
    () => ({
      isNavigating: navigation !== null,
      push,
      replace,
      refresh,
      back,
      prefetch,
    }),
    [back, navigation, prefetch, push, refresh, replace]
  )

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
      <NavigationFeedbackOverlay navigation={navigation} />
    </NavigationFeedbackContext.Provider>
  )
}

export function useNavigationFeedback() {
  const context = useContext(NavigationFeedbackContext)

  if (!context) {
    throw new Error(
      "useNavigationFeedback must be used within NavigationFeedbackProvider"
    )
  }

  return context
}
