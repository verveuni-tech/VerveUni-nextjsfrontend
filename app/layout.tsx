import "./globals.css"
import { AuthSessionProvider } from "@/components/auth/auth-session-provider"
import { NavigationFeedbackProvider } from "@/components/navigation/navigation-feedback-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export const metadata = {
  title: "VerveUni - Interview Practice Platform",
  description: "B2B interview practice platform for institutes",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="antialiased font-sans">
      <body>
        <AuthSessionProvider>
          <ThemeProvider>
            <TooltipProvider>
              <NavigationFeedbackProvider>{children}</NavigationFeedbackProvider>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
