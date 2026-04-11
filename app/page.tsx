import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/server"
import { ROLE_HOME, ROUTES } from "@/lib/constants"

export default async function Home() {
  const user = await getCurrentUser()

  redirect(user ? ROLE_HOME[user.role] || ROUTES.LOGIN : ROUTES.LOGIN)
}
