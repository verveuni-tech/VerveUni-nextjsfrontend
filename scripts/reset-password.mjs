import { config } from "dotenv"
config({ path: ".env.local" })

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  })

const uid = process.argv[2]
const newPassword = process.argv[3]

if (!uid || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <uid> <newPassword>")
  process.exit(1)
}

await getAuth(app).updateUser(uid, { password: newPassword })
console.log(`Password updated for ${uid}`)
