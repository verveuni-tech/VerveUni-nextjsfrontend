import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

import { FIREBASE_PUBLIC_CONFIG } from "@/lib/constants"

const firebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_PUBLIC_CONFIG)

export const firebaseAuth = getAuth(firebaseApp)
export { firebaseApp }
