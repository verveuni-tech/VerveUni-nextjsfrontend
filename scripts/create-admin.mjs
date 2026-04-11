import process from "node:process"
import { config } from "dotenv"

// Load .env.local (Next.js convention)
config({ path: ".env.local" })

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  })

const auth = getAuth(app)
const firestore = getFirestore(app)

const arg = process.argv[2]

if (!arg) {
  console.error(
    "Usage:\n" +
    "  npm run create:admin -- <uid>              Promote existing user by UID\n" +
    "  npm run create:admin -- <email>            Promote existing user by email\n" +
    "  npm run create:admin -- --new <email> <password> [name]  Create new user"
  )
  process.exit(1)
}

let user

if (arg === "--new") {
  // Mode 1: Create a brand new user
  const [, email, password, fullName = "Platform Admin"] = process.argv.slice(2)
  if (!email || !password) {
    console.error("Usage: npm run create:admin -- --new <email> <password> [name]")
    process.exit(1)
  }
  user = await auth.createUser({
    email,
    password,
    displayName: fullName,
    emailVerified: true,
  })
  console.log(`Created new Firebase user: ${email} (${user.uid})`)
} else {
  // Mode 2: Promote existing user by UID or email
  try {
    if (arg.includes("@")) {
      user = await auth.getUserByEmail(arg)
    } else {
      user = await auth.getUser(arg)
    }
    console.log(`Found existing user: ${user.email} (${user.uid})`)
  } catch (err) {
    console.error(`User not found: ${arg}`)
    console.error(err.message)
    process.exit(1)
  }
}

// Set admin custom claims
await auth.setCustomUserClaims(user.uid, {
  admin: true,
  role: "admin",
})

// Upsert Firestore user doc
const timestamp = new Date().toISOString()
await firestore.collection("users").doc(user.uid).set(
  {
    email: user.email,
    full_name: user.displayName || user.email || "Platform Admin",
    role: "admin",
    organization_id: null,
    organization_name: null,
    is_active: true,
    updated_at: timestamp,
  },
  { merge: true }
)

console.log(`Admin privileges granted to ${user.email} (${user.uid})`)
console.log("User must sign out and back in for claims to take effect.")
