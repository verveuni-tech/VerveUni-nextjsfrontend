import { after, before, describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing"
import { doc, getDoc, setDoc } from "firebase/firestore"

let testEnv

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "verveuni-rules-test",
    firestore: {
      rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    },
  })

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, "sessions/session_1"), {
      organization_id: "org_1",
      batch_id: "batch_1",
      student_id: "student",
      status: "recording",
    })
  })
})

after(async () => {
  await testEnv.cleanup()
})

describe("firestore rules", () => {
  it("allows students to read their own sessions", async () => {
    const db = testEnv.authenticatedContext("student", { role: "student" }).firestore()
    await assertSucceeds(getDoc(doc(db, "sessions/session_1")))
  })

  it("blocks students from writing analysis documents", async () => {
    const db = testEnv.authenticatedContext("student", { role: "student" }).firestore()
    await assertFails(setDoc(doc(db, "sessionAnalyses/session_1"), { final_score: 90 }))
  })

  it("keeps the environment available", async () => {
    assert.ok(testEnv)
  })
})
