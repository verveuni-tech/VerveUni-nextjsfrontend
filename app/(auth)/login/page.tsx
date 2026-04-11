"use client"

import { useState } from "react"
import { GraduationCap } from "lucide-react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { useAppNavigation } from "@/hooks/use-app-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMe } from "@/lib/api/auth"
import { toApiError } from "@/lib/api/errors"
import { firebaseAuth } from "@/lib/firebase/client"
import { ROLE_HOME } from "@/lib/constants"
import { loginSchema, signUpSchema, type LoginFormValues, type SignUpFormValues } from "@/lib/schemas"

type SignUpRole = "instructor" | "student"

async function syncFirebaseSession() {
  const user = firebaseAuth.currentUser
  if (!user) {
    throw new Error("Authentication state was not established")
  }

  const idToken = await user.getIdToken()
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  })

  if (!response.ok) {
    throw new Error("Failed to sync session")
  }
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<SignUpRole>("instructor")
  const router = useAppNavigation()

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", full_name: "" },
  })

  async function handleRoleRedirect() {
    const user = await getMe()
    const redirect = new URLSearchParams(window.location.search).get("redirect")
    router.replace(redirect || ROLE_HOME[user.role] || "/student/dashboard")
  }

  async function onLogin(values: LoginFormValues) {
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(firebaseAuth, values.email, values.password)
      await syncFirebaseSession()
      toast.success("Signed in successfully")
      await handleRoleRedirect()
    } catch (error) {
      const apiError = toApiError(error, "Failed to sign in")
      toast.error(apiError.detail)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignUp(values: SignUpFormValues) {
    setIsLoading(true)
    try {
      await createUserWithEmailAndPassword(firebaseAuth, values.email, values.password)
      await syncFirebaseSession()

      const response = await fetch("/api/app/onboarding/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: values.full_name, role }),
      })

      const payload = (await response.json().catch(() => ({}))) as { detail?: string }
      if (!response.ok) {
        throw new Error(payload.detail || "Failed to complete setup")
      }

      toast.success("Account created successfully")
      await handleRoleRedirect()
    } catch (error) {
      const apiError = toApiError(error, "Failed to create account")
      toast.error(apiError.detail)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">VerveUni</CardTitle>
          <CardDescription>Interview practice platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email ? (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" {...loginForm.register("password")} />
                  {loginForm.formState.errors.password ? (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <Tabs value={role} onValueChange={(v) => setRole(v as SignUpRole)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="instructor">Instructor</TabsTrigger>
                      <TabsTrigger value="student">Student</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input id="signup-name" placeholder="John Doe" {...signUpForm.register("full_name")} />
                  {signUpForm.formState.errors.full_name ? (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.full_name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    {...signUpForm.register("email")}
                  />
                  {signUpForm.formState.errors.email ? (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" {...signUpForm.register("password")} />
                  {signUpForm.formState.errors.password ? (
                    <p className="text-xs text-destructive">{signUpForm.formState.errors.password.message}</p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
