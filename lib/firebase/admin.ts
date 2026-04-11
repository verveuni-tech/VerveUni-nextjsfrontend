import type { App } from "firebase-admin/app"
import type { Auth } from "firebase-admin/auth"
import type { Firestore } from "firebase-admin/firestore"

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

function getPrivateKey() {
  return (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n")
}

function getAdminCredentials() {
  const credentialEntries = [
    ["FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID],
    ["FIREBASE_CLIENT_EMAIL", process.env.FIREBASE_CLIENT_EMAIL],
    ["FIREBASE_PRIVATE_KEY", getPrivateKey()],
  ] as const

  const missing = credentialEntries
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase Admin environment variables: ${missing.join(", ")}. ` +
        "Add them in your local env and in Vercel Project Settings before using authenticated server features."
    )
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: getPrivateKey(),
  }
}

let adminApp: App | undefined

function getAdminApp() {
  if (adminApp) {
    return adminApp
  }

  adminApp = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert(getAdminCredentials()),
      })

  return adminApp
}

function createLazyService<T extends object>(factory: () => T) {
  let cached: T | undefined

  function getService() {
    if (!cached) {
      cached = factory()
    }

    return cached
  }

  return new Proxy({} as T, {
    get(_target, property) {
      const service = getService()
      const value = Reflect.get(service as object, property, service as object)
      return typeof value === "function" ? value.bind(service) : value
    },
    has(_target, property) {
      return property in getService()
    },
    ownKeys() {
      return Reflect.ownKeys(getService() as object)
    },
    getOwnPropertyDescriptor(_target, property) {
      return Object.getOwnPropertyDescriptor(getService() as object, property)
    },
  })
}

export const firebaseAdminAuth = createLazyService<Auth>(() => getAuth(getAdminApp()))
export const firestore = createLazyService<Firestore>(() => getFirestore(getAdminApp()))
