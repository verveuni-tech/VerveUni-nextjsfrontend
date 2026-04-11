import { NavigationLoadingScreen } from "@/components/shared/navigation-loading-screen"

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/20 p-4 sm:p-6">
      <div className="w-full max-w-5xl">
        <NavigationLoadingScreen />
      </div>
    </div>
  )
}
