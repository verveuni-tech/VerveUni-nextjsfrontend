import { randomUUID } from "crypto"

import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore"

import { firestore, firebaseAdminAuth } from "@/lib/firebase/admin"
import type {
  Batch,
  BatchMembership,
  BatchRole,
  OrganizationSummary,
  ProgressSummary,
  Question,
  QuestionSet,
  Session,
  SessionAnswer,
  User,
  UserRole,
} from "@/lib/types"

type FirestoreDoc = DocumentData
type Doc = QueryDocumentSnapshot<DocumentData>
type Snap = DocumentSnapshot<DocumentData>

function nowIso() {
  return new Date().toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function createCode(length = 8) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .toUpperCase()
}

function gradeFromScore(score: number) {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
  return "F"
}

function levelToScore(level: string | null | undefined) {
  switch (level) {
    case "strong":
      return 90
    case "progressing":
      return 70
    case "developing":
      return 50
    case "weak":
      return 30
    default:
      return 0
  }
}

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0
}

async function setUserRoleClaim(userId: string, role: UserRole) {
  const user = await firebaseAdminAuth.getUser(userId)
  const currentClaims = user.customClaims || {}
  await firebaseAdminAuth.setCustomUserClaims(userId, {
    ...currentClaims,
    role,
    admin: role === "admin",
  })
}

function mapUser(id: string, data: FirestoreDoc): User {
  return {
    id,
    email: String(data.email || ""),
    full_name: String(data.full_name || "User"),
    role: (data.role as UserRole) || "student",
    organization_id: (data.organization_id as string | null) ?? null,
    organization_name: (data.organization_name as string | null) ?? null,
    is_active: Boolean(data.is_active ?? true),
    created_at: String(data.created_at || nowIso()),
    updated_at: String(data.updated_at || nowIso()),
  }
}

function mapBatch(id: string, data: FirestoreDoc): Batch {
  return {
    id,
    organization_id: String(data.organization_id),
    name: String(data.name),
    description: (data.description as string | null) ?? null,
    status: (data.status as Batch["status"]) || "active",
    join_code: String(data.join_code || ""),
    question_set_id: (data.question_set_id as string | null) ?? null,
    created_at: String(data.created_at || nowIso()),
    updated_at: String(data.updated_at || nowIso()),
  }
}

function mapQuestion(id: string, data: FirestoreDoc): Question {
  const order = Number(data.order ?? data.position ?? 0)
  return {
    id,
    question_set_id: String(data.question_set_id),
    body: String(data.body),
    position: order,
    order,
    family: String(data.family || data.rubric_schema_key || "general"),
    audio_url: (data.audio_url as string | null) ?? null,
    audio_cloudinary:
      (data.audio_cloudinary as import("@/lib/types").CloudinaryAsset | null) ??
      null,
  }
}

function mapQuestionSet(
  id: string,
  data: FirestoreDoc,
  questions?: Question[]
): QuestionSet {
  return {
    id,
    organization_id: String(data.organization_id),
    batch_id: String(data.batch_id),
    name: String(data.name),
    title: String(data.name),
    family: String(data.family || "hr_interview_v1"),
    description: (data.description as string | null) ?? null,
    question_count: Number(data.question_count ?? questions?.length ?? 0),
    questions,
    created_at: String(data.created_at || nowIso()),
  }
}

function mapAnswer(id: string, data: FirestoreDoc): SessionAnswer {
  const transcriptRaw = (data.transcript_raw as string | null) ?? null
  const transcriptClean = (data.transcript_clean as string | null) ?? null

  return {
    id,
    session_id: String(data.session_id),
    question_id: String(data.question_id),
    question_body: (data.question_body as string | undefined) ?? undefined,
    audio_path: (data.audio_path as string | null) ?? null,
    transcript: transcriptClean || transcriptRaw,
    transcript_raw: transcriptRaw,
    transcript_clean: transcriptClean,
    status: (data.status as SessionAnswer["status"]) || "pending_upload",
    cloudinary: (data.cloudinary as SessionAnswer["cloudinary"]) ?? null,
    analysis: (data.analysis as SessionAnswer["analysis"]) ?? undefined,
    created_at: (data.created_at as string | undefined) ?? undefined,
    updated_at: (data.updated_at as string | undefined) ?? undefined,
  }
}

function mapSession(
  id: string,
  data: FirestoreDoc,
  answers: SessionAnswer[] = []
): Session {
  return {
    id,
    student_id: String(data.student_id || data.user_id),
    user_id: String(data.user_id || data.student_id),
    batch_id: String(data.batch_id),
    question_set_id: String(data.question_set_id),
    status: (data.status as Session["status"]) || "draft",
    started_at: String(data.started_at || data.created_at || nowIso()),
    completed_at: (data.completed_at as string | null) ?? null,
    created_at: String(data.created_at || nowIso()),
    answers_uploaded: Number(data.answers_uploaded ?? 0),
    answers_analyzed: Number(data.answers_analyzed ?? 0),
    question_set: data.question_set
      ? ({
          ...(data.question_set as QuestionSet),
          title: String(
            (data.question_set as QuestionSet).title ||
              (data.question_set as QuestionSet).name
          ),
        } as QuestionSet)
      : undefined,
    answers,
  }
}

async function getUserDoc(userId: string) {
  return firestore.collection("users").doc(userId).get()
}

async function findUserByEmail(email: string) {
  const snapshot = await firestore
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get()
  return snapshot.docs[0] || null
}

async function getBatchDoc(batchId: string) {
  return firestore.collection("batches").doc(batchId).get()
}

async function getQuestionSetDoc(questionSetId: string) {
  return firestore.collection("questionSets").doc(questionSetId).get()
}

async function requireBatchAccess(user: User, batchId: string) {
  const batchDoc = await getBatchDoc(batchId)
  if (!batchDoc.exists) {
    throw new Error("Batch not found")
  }

  const batch = mapBatch(batchDoc.id, batchDoc.data() || {})
  if (user.role === "admin") {
    return batch
  }

  if (
    (user.role === "org_admin" || user.role === "instructor") &&
    user.organization_id === batch.organization_id
  ) {
    return batch
  }

  const membership = await firestore
    .collection("batchMembers")
    .where("batch_id", "==", batchId)
    .where("user_id", "==", user.id)
    .limit(1)
    .get()

  if (membership.empty) {
    throw new Error("Forbidden")
  }

  return batch
}

export async function getUserProfile(userId: string) {
  const snapshot = await getUserDoc(userId)
  if (!snapshot.exists) {
    return null
  }

  return mapUser(snapshot.id, snapshot.data() || {})
}

export async function onboardInstructor(params: {
  userId: string
  email: string
  fullName: string
  mode: "create" | "join"
  organizationName?: string
  inviteCode?: string
}) {
  const timestamp = nowIso()

  if (params.mode === "create") {
    const organizationId = randomUUID()
    const organizationName = (params.organizationName || "").trim()
    if (!organizationName) {
      throw new Error("Organization name is required")
    }

    const slug = slugify(organizationName)
    const inviteCode = `ORG-${createCode()}`

    await firestore.collection("organizations").doc(organizationId).set({
      name: organizationName,
      slug,
      invite_code: inviteCode,
      created_by: params.userId,
      created_at: timestamp,
    })

    await firestore.collection("organizationInvites").doc(inviteCode).set({
      organization_id: organizationId,
      code: inviteCode,
      role: "instructor",
      created_by: params.userId,
      created_at: timestamp,
      is_active: true,
    })

    await firestore
      .collection("organizationMembers")
      .doc(`${organizationId}_${params.userId}`)
      .set({
        organization_id: organizationId,
        user_id: params.userId,
        role: "org_admin",
        joined_at: timestamp,
      })

    await firestore.collection("users").doc(params.userId).set(
      {
        email: params.email,
        full_name: params.fullName,
        role: "org_admin",
        organization_id: organizationId,
        organization_name: organizationName,
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      { merge: true }
    )

    await setUserRoleClaim(params.userId, "org_admin")
    return getUserProfile(params.userId)
  }

  const inviteCode = (params.inviteCode || "").trim().toUpperCase()
  if (!inviteCode) {
    throw new Error("Organization invite code is required")
  }

  const inviteSnapshot = await firestore
    .collection("organizationInvites")
    .doc(inviteCode)
    .get()
  if (!inviteSnapshot.exists) {
    throw new Error("Organization invite code not found")
  }

  const invite = inviteSnapshot.data() || {}
  const organizationId = String(invite.organization_id)
  const organizationSnapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .get()
  if (!organizationSnapshot.exists) {
    throw new Error("Organization not found")
  }

  const organization = organizationSnapshot.data() || {}
  await firestore
    .collection("organizationMembers")
    .doc(`${organizationId}_${params.userId}`)
    .set({
      organization_id: organizationId,
      user_id: params.userId,
      role: "instructor",
      joined_at: timestamp,
    })

  await firestore
    .collection("users")
    .doc(params.userId)
    .set(
      {
        email: params.email,
        full_name: params.fullName,
        role: "instructor",
        organization_id: organizationId,
        organization_name: String(organization.name || ""),
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      { merge: true }
    )

  await setUserRoleClaim(params.userId, "instructor")
  return getUserProfile(params.userId)
}

export async function onboardStudent(params: {
  userId: string
  email: string
  fullName: string
  inviteCode: string
}) {
  const inviteCode = params.inviteCode.trim().toUpperCase()
  if (!inviteCode) {
    throw new Error("Batch invite code is required")
  }

  const inviteSnapshot = await firestore
    .collection("batchInvites")
    .doc(inviteCode)
    .get()
  if (!inviteSnapshot.exists) {
    throw new Error("Batch invite code not found")
  }

  const invite = inviteSnapshot.data() || {}
  const batchId = String(invite.batch_id)
  const batchSnapshot = await getBatchDoc(batchId)
  if (!batchSnapshot.exists) {
    throw new Error("Batch not found")
  }

  const batch = batchSnapshot.data() || {}
  const timestamp = nowIso()
  const organizationId = String(batch.organization_id)

  await firestore
    .collection("organizationMembers")
    .doc(`${organizationId}_${params.userId}`)
    .set(
      {
        organization_id: organizationId,
        user_id: params.userId,
        role: "student",
        joined_at: timestamp,
      },
      { merge: true }
    )

  await firestore
    .collection("batchMembers")
    .doc(`${batchId}_${params.userId}`)
    .set({
      batch_id: batchId,
      organization_id: organizationId,
      user_id: params.userId,
      role: "student",
      joined_at: timestamp,
    })

  await firestore
    .collection("users")
    .doc(params.userId)
    .set(
      {
        email: params.email,
        full_name: params.fullName,
        role: "student",
        organization_id: organizationId,
        organization_name: String(batch.organization_name || ""),
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      { merge: true }
    )

  await setUserRoleClaim(params.userId, "student")
  return getUserProfile(params.userId)
}

// ─── Decoupled signup & join functions ───────────────────────────────────────

export async function createUserProfile(params: {
  userId: string
  email: string
  fullName: string
  role: "instructor" | "student"
}) {
  const timestamp = nowIso()
  await firestore.collection("users").doc(params.userId).set(
    {
      email: params.email,
      full_name: params.fullName,
      role: params.role,
      organization_id: null,
      organization_name: null,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    { merge: true }
  )
  await setUserRoleClaim(params.userId, params.role)
  return getUserProfile(params.userId)
}

export async function createOrganization(
  user: User,
  data: { organizationName: string }
) {
  if (
    user.role !== "instructor" &&
    user.role !== "org_admin" &&
    user.role !== "admin"
  ) {
    throw new Error("Only instructors can create organizations")
  }

  const timestamp = nowIso()
  const organizationId = randomUUID()
  const organizationName = data.organizationName.trim()
  if (!organizationName) {
    throw new Error("Organization name is required")
  }

  const slug = slugify(organizationName)
  const inviteCode = `ORG-${createCode()}`

  await firestore.collection("organizations").doc(organizationId).set({
    name: organizationName,
    slug,
    invite_code: inviteCode,
    created_by: user.id,
    created_at: timestamp,
  })

  await firestore.collection("organizationInvites").doc(inviteCode).set({
    organization_id: organizationId,
    code: inviteCode,
    role: "instructor",
    created_by: user.id,
    created_at: timestamp,
    is_active: true,
  })

  await firestore
    .collection("organizationMembers")
    .doc(`${organizationId}_${user.id}`)
    .set({
      organization_id: organizationId,
      user_id: user.id,
      role: "org_admin",
      joined_at: timestamp,
    })

  await firestore.collection("users").doc(user.id).set(
    {
      role: "org_admin",
      organization_id: organizationId,
      organization_name: organizationName,
      updated_at: timestamp,
    },
    { merge: true }
  )

  await setUserRoleClaim(user.id, "org_admin")
  return { inviteCode, organizationId, organizationName }
}

export async function joinOrganization(
  user: User,
  data: { inviteCode: string }
) {
  const inviteCode = data.inviteCode.trim().toUpperCase()
  if (!inviteCode) {
    throw new Error("Organization invite code is required")
  }

  const inviteSnapshot = await firestore
    .collection("organizationInvites")
    .doc(inviteCode)
    .get()
  if (!inviteSnapshot.exists) {
    throw new Error("Organization invite code not found")
  }

  const invite = inviteSnapshot.data() || {}
  if (!invite.is_active) {
    throw new Error("This invite code is no longer active")
  }

  const organizationId = String(invite.organization_id)
  const organizationSnapshot = await firestore
    .collection("organizations")
    .doc(organizationId)
    .get()
  if (!organizationSnapshot.exists) {
    throw new Error("Organization not found")
  }

  const organization = organizationSnapshot.data() || {}
  const timestamp = nowIso()

  await firestore
    .collection("organizationMembers")
    .doc(`${organizationId}_${user.id}`)
    .set({
      organization_id: organizationId,
      user_id: user.id,
      role: "instructor",
      joined_at: timestamp,
    })

  await firestore
    .collection("users")
    .doc(user.id)
    .set(
      {
        role: "instructor",
        organization_id: organizationId,
        organization_name: String(organization.name || ""),
        updated_at: timestamp,
      },
      { merge: true }
    )

  await setUserRoleClaim(user.id, "instructor")
  return getUserProfile(user.id)
}

export async function joinBatch(user: User, data: { inviteCode: string }) {
  const inviteCode = data.inviteCode.trim().toUpperCase()
  if (!inviteCode) {
    throw new Error("Batch invite code is required")
  }

  const inviteSnapshot = await firestore
    .collection("batchInvites")
    .doc(inviteCode)
    .get()
  if (!inviteSnapshot.exists) {
    throw new Error("Batch invite code not found")
  }

  const invite = inviteSnapshot.data() || {}
  if (!invite.is_active) {
    throw new Error("This invite code is no longer active")
  }

  const batchId = String(invite.batch_id)
  const batchSnapshot = await getBatchDoc(batchId)
  if (!batchSnapshot.exists) {
    throw new Error("Batch not found")
  }

  const batch = batchSnapshot.data() || {}
  const timestamp = nowIso()
  const organizationId = String(batch.organization_id)

  // Add to org if not already a member
  const existingOrgMember = await firestore
    .collection("organizationMembers")
    .doc(`${organizationId}_${user.id}`)
    .get()

  if (!existingOrgMember.exists) {
    await firestore
      .collection("organizationMembers")
      .doc(`${organizationId}_${user.id}`)
      .set(
        {
          organization_id: organizationId,
          user_id: user.id,
          role: "student",
          joined_at: timestamp,
        },
        { merge: true }
      )
  }

  // Check if already in batch
  const existingBatchMember = await firestore
    .collection("batchMembers")
    .doc(`${batchId}_${user.id}`)
    .get()

  if (existingBatchMember.exists) {
    throw new Error("You are already a member of this batch")
  }

  await firestore.collection("batchMembers").doc(`${batchId}_${user.id}`).set({
    batch_id: batchId,
    organization_id: organizationId,
    user_id: user.id,
    role: "student",
    joined_at: timestamp,
  })

  // Update user doc with org info if not set
  if (!user.organization_id) {
    await firestore
      .collection("users")
      .doc(user.id)
      .set(
        {
          organization_id: organizationId,
          organization_name: String(batch.organization_name || ""),
          updated_at: timestamp,
        },
        { merge: true }
      )
  }

  return getUserProfile(user.id)
}

export async function listOrganizations(
  user: User
): Promise<OrganizationSummary[]> {
  if (user.role !== "admin") {
    throw new Error("Forbidden")
  }

  const snapshot = await firestore.collection("organizations").get()
  const organizations = snapshot.docs.map((doc: Doc) => ({
    id: doc.id,
    data: doc.data() || {},
  }))

  return Promise.all(
    organizations.map(async ({ id, data }) => {
      const [membersSnapshot, batchesSnapshot, orgAdminSnapshot] =
        await Promise.all([
          firestore
            .collection("users")
            .where("organization_id", "==", id)
            .get(),
          firestore
            .collection("batches")
            .where("organization_id", "==", id)
            .get(),
          firestore
            .collection("users")
            .where("organization_id", "==", id)
            .where("role", "==", "org_admin")
            .get(),
        ])

      return {
        id,
        name: String(data.name || ""),
        slug: String(data.slug || ""),
        invite_code: (data.invite_code as string | undefined) ?? undefined,
        created_at: String(data.created_at || nowIso()),
        member_count: membersSnapshot.size,
        active_member_count: membersSnapshot.docs.filter((doc: Doc) =>
          Boolean((doc.data() || {}).is_active ?? true)
        ).length,
        org_admin_count: orgAdminSnapshot.size,
        batch_count: batchesSnapshot.size,
      } satisfies OrganizationSummary
    })
  )
}

export async function listOrgUsers(user: User) {
  if (user.role !== "admin" && user.role !== "org_admin") {
    throw new Error("Forbidden")
  }

  const query =
    user.role === "admin"
      ? firestore.collection("users")
      : firestore
          .collection("users")
          .where("organization_id", "==", user.organization_id)

  const snapshot = await query.get()
  return snapshot.docs.map((doc: Doc) => mapUser(doc.id, doc.data() || {}))
}

export async function changeUserRole(
  user: User,
  userId: string,
  role: UserRole
) {
  if (user.role !== "admin" && user.role !== "org_admin") {
    throw new Error("Forbidden")
  }

  const target = await getUserDoc(userId)
  if (!target.exists) {
    throw new Error("User not found")
  }

  const targetData = target.data() || {}
  if (
    user.role !== "admin" &&
    targetData.organization_id !== user.organization_id
  ) {
    throw new Error("Forbidden")
  }

  await target.ref.set({ role, updated_at: nowIso() }, { merge: true })
  await setUserRoleClaim(userId, role)
  return getUserProfile(userId)
}

export async function setUserActive(
  user: User,
  userId: string,
  isActive: boolean
) {
  if (user.role !== "admin" && user.role !== "org_admin") {
    throw new Error("Forbidden")
  }

  const target = await getUserDoc(userId)
  if (!target.exists) {
    throw new Error("User not found")
  }

  await target.ref.set(
    { is_active: isActive, updated_at: nowIso() },
    { merge: true }
  )
  return getUserProfile(userId)
}

export async function listBatches(user: User, status?: string) {
  let batchDocs

  if (user.role === "admin") {
    batchDocs = await firestore.collection("batches").get()
  } else if (
    (user.role === "org_admin" || user.role === "instructor") &&
    user.organization_id
  ) {
    batchDocs = await firestore
      .collection("batches")
      .where("organization_id", "==", user.organization_id)
      .get()
  } else {
    const memberships = await firestore
      .collection("batchMembers")
      .where("user_id", "==", user.id)
      .get()
    const batches = await Promise.all(
      memberships.docs.map((doc: Doc) =>
        getBatchDoc(String((doc.data() || {}).batch_id))
      )
    )
    batchDocs = { docs: batches.filter((doc: Snap) => doc.exists) }
  }

  return batchDocs.docs
    .map((doc: Snap | Doc) => mapBatch(doc.id, doc.data() || {}))
    .filter((batch: Batch) => (!status ? true : batch.status === status))
}

export async function createBatch(
  user: User,
  data: { name: string; description?: string }
) {
  if (
    user.role !== "admin" &&
    user.role !== "org_admin" &&
    user.role !== "instructor"
  ) {
    throw new Error("Only admins and instructors can create batches")
  }

  if (!user.organization_id) {
    throw new Error("Organization is required")
  }

  const timestamp = nowIso()
  const batchId = randomUUID()
  const joinCode = `BAT-${createCode()}`

  await firestore
    .collection("batches")
    .doc(batchId)
    .set({
      organization_id: user.organization_id,
      organization_name: user.organization_name || null,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: "active",
      join_code: joinCode,
      created_by: user.id,
      created_at: timestamp,
      updated_at: timestamp,
    })

  await firestore.collection("batchMembers").doc(`${batchId}_${user.id}`).set({
    batch_id: batchId,
    organization_id: user.organization_id,
    user_id: user.id,
    role: "instructor",
    joined_at: timestamp,
  })

  await firestore.collection("batchInvites").doc(joinCode).set({
    batch_id: batchId,
    organization_id: user.organization_id,
    code: joinCode,
    role: "student",
    is_active: true,
    created_by: user.id,
    created_at: timestamp,
  })

  return mapBatch(batchId, {
    organization_id: user.organization_id,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    status: "active",
    join_code: joinCode,
    created_at: timestamp,
    updated_at: timestamp,
  })
}

export async function getBatch(user: User, batchId: string) {
  const batch = await requireBatchAccess(user, batchId)
  return batch
}

export async function listBatchMembers(
  user: User,
  batchId: string
): Promise<BatchMembership[]> {
  await requireBatchAccess(user, batchId)

  const snapshot = await firestore
    .collection("batchMembers")
    .where("batch_id", "==", batchId)
    .get()
  const userSnapshots = await Promise.all(
    snapshot.docs.map((doc: Doc) =>
      getUserDoc(String((doc.data() || {}).user_id))
    )
  )

  return snapshot.docs.map((doc: Doc, index: number) => {
    const d = doc.data() || {}
    return {
      id: doc.id,
      user_id: String(d.user_id),
      batch_id: String(d.batch_id),
      role: (d.role as BatchRole) || "student",
      user: userSnapshots[index].exists
        ? mapUser(userSnapshots[index].id, userSnapshots[index].data() || {})
        : undefined,
      joined_at: String(d.joined_at || nowIso()),
    }
  })
}

export async function addBatchMember(
  user: User,
  batchId: string,
  data: { email?: string; user_id?: string; role: BatchRole }
) {
  await requireBatchAccess(user, batchId)
  if (
    user.role !== "admin" &&
    user.role !== "org_admin" &&
    user.role !== "instructor"
  ) {
    throw new Error("Forbidden")
  }

  const batch = await getBatch(user, batchId)
  const target =
    data.user_id != null
      ? await getUserDoc(data.user_id)
      : data.email
        ? await findUserByEmail(data.email)
        : null

  if (!target || !target.exists) {
    throw new Error("User not found for this email")
  }

  const targetUser = mapUser(target.id, target.data() || {})
  const timestamp = nowIso()

  await firestore
    .collection("organizationMembers")
    .doc(`${batch.organization_id}_${target.id}`)
    .set(
      {
        organization_id: batch.organization_id,
        user_id: target.id,
        role: data.role,
        joined_at: timestamp,
      },
      { merge: true }
    )

  await firestore
    .collection("batchMembers")
    .doc(`${batchId}_${target.id}`)
    .set({
      batch_id: batchId,
      organization_id: batch.organization_id,
      user_id: target.id,
      role: data.role,
      joined_at: timestamp,
    })

  if (data.role === "instructor" && targetUser.role === "student") {
    await firestore
      .collection("users")
      .doc(target.id)
      .set({ role: "instructor", updated_at: timestamp }, { merge: true })
    await setUserRoleClaim(target.id, "instructor")
  }

  return {
    id: `${batchId}_${target.id}`,
    user_id: target.id,
    batch_id: batchId,
    role: data.role,
    user: (await getUserProfile(target.id)) || undefined,
    joined_at: timestamp,
  } satisfies BatchMembership
}

export async function removeBatchMember(
  user: User,
  batchId: string,
  membershipId: string
) {
  await requireBatchAccess(user, batchId)
  await firestore.collection("batchMembers").doc(membershipId).delete()
}

export async function listQuestionSets(user: User, batchId?: string) {
  let snapshot
  if (batchId) {
    await requireBatchAccess(user, batchId)
    snapshot = await firestore
      .collection("questionSets")
      .where("batch_id", "==", batchId)
      .get()
  } else if (user.role === "admin") {
    snapshot = await firestore.collection("questionSets").get()
  } else {
    snapshot = await firestore
      .collection("questionSets")
      .where("organization_id", "==", user.organization_id)
      .get()
  }

  const sets = snapshot.docs.map((doc: Doc) => ({
    id: doc.id,
    data: doc.data() || {},
  }))

  // Fetch questions for all sets in parallel
  const setsWithQuestions = await Promise.all(
    sets.map(async (set) => {
      const questionSnapshot = await firestore
        .collection("questions")
        .where("question_set_id", "==", set.id)
        .get()
      const questions = questionSnapshot.docs
        .map((doc: Doc) => mapQuestion(doc.id, doc.data() || {}))
        .sort((a: Question, b: Question) => a.order - b.order)
      return mapQuestionSet(set.id, set.data, questions)
    })
  )

  return setsWithQuestions
}

export async function getQuestionSet(user: User, questionSetId: string) {
  const questionSetSnapshot = await getQuestionSetDoc(questionSetId)
  if (!questionSetSnapshot.exists) {
    throw new Error("Question set not found")
  }

  const questionSetData = questionSetSnapshot.data() || {}
  if (questionSetData.batch_id) {
    await requireBatchAccess(user, String(questionSetData.batch_id))
  }

  const questionSnapshot = await firestore
    .collection("questions")
    .where("question_set_id", "==", questionSetId)
    .get()
  const questions = questionSnapshot.docs
    .map((doc: Doc) => mapQuestion(doc.id, doc.data() || {}))
    .sort((left: Question, right: Question) => left.order - right.order)

  return mapQuestionSet(questionSetSnapshot.id, questionSetData, questions)
}

export async function createSession(
  user: User,
  data: { batch_id: string; question_set_id: string }
) {
  if (user.role !== "student") {
    throw new Error("Only students can create sessions")
  }

  const batch = await requireBatchAccess(user, data.batch_id)
  const questionSet = await getQuestionSet(user, data.question_set_id)
  const questions = questionSet.questions || []

  if (questions.length === 0) {
    throw new Error(
      "Cannot start session — this question set has no questions yet"
    )
  }

  const timestamp = nowIso()
  const sessionId = randomUUID()
  const sessionRef = firestore.collection("sessions").doc(sessionId)
  const counterRef = firestore
    .collection("sessionCounters")
    .doc(`${user.id}_${data.batch_id}`)

  const priorSessions = await firestore
    .collection("sessions")
    .where("student_id", "==", user.id)
    .where("batch_id", "==", data.batch_id)
    .get()

  await firestore.runTransaction(async (transaction) => {
    const counterSnapshot = await transaction.get(counterRef)
    const sessionNumber = counterSnapshot.exists
      ? Number(
          counterSnapshot.data()?.next_session_number || priorSessions.size + 1
        )
      : priorSessions.size + 1

    transaction.set(
      counterRef,
      {
        student_id: user.id,
        batch_id: data.batch_id,
        next_session_number: sessionNumber + 1,
        updated_at: timestamp,
      },
      { merge: true }
    )

    transaction.set(sessionRef, {
      organization_id: batch.organization_id,
      batch_id: data.batch_id,
      student_id: user.id,
      user_id: user.id,
      question_set_id: data.question_set_id,
      question_set: {
        id: questionSet.id,
        name: questionSet.name,
        title: questionSet.title,
        family: questionSet.family,
      },
      status: "recording",
      session_number: sessionNumber,
      started_at: timestamp,
      created_at: timestamp,
      completed_at: null,
      answers_uploaded: 0,
      answers_analyzed: 0,
      question_snapshot: questions.map((question) => ({
        id: question.id,
        body: question.body,
        order: question.order,
        family: question.family,
        audio_url: question.audio_url || null,
      })),
    })
    questions.forEach((question) => {
      transaction.set(
        firestore
          .collection("sessionAnswers")
          .doc(`${sessionId}_${question.id}`),
        {
          session_id: sessionId,
          batch_id: data.batch_id,
          organization_id: batch.organization_id,
          student_id: user.id,
          question_id: question.id,
          question_body: question.body,
          order: question.order,
          status: "pending_upload",
          audio_path: null,
          created_at: timestamp,
          updated_at: timestamp,
        }
      )
    })
  })

  return getSession(user, sessionId)
}

export async function listSessions(
  user: User,
  params?: { batch_id?: string; user_id?: string }
) {
  let snapshot
  if (user.role === "student") {
    snapshot = await firestore
      .collection("sessions")
      .where("student_id", "==", user.id)
      .get()
  } else if (params?.user_id) {
    if (params.batch_id) {
      await requireBatchAccess(user, params.batch_id)
      snapshot = await firestore
        .collection("sessions")
        .where("student_id", "==", params.user_id)
        .where("batch_id", "==", params.batch_id)
        .get()
    } else if (user.role === "admin" || user.role === "org_admin") {
      snapshot = await firestore
        .collection("sessions")
        .where("student_id", "==", params.user_id)
        .get()
    } else {
      const memberships = await firestore
        .collection("batchMembers")
        .where("user_id", "==", user.id)
        .get()
      const allowedBatchIds = new Set(
        memberships.docs.map((doc: Doc) => String((doc.data() || {}).batch_id))
      )
      const rawSessions = await firestore
        .collection("sessions")
        .where("student_id", "==", params.user_id)
        .get()
      snapshot = {
        docs: rawSessions.docs.filter((doc: Doc) =>
          allowedBatchIds.has(String((doc.data() || {}).batch_id))
        ),
      }
    }
  } else if (user.role === "org_admin" && user.organization_id) {
    snapshot = await firestore
      .collection("sessions")
      .where("organization_id", "==", user.organization_id)
      .get()
  } else {
    const memberships = await firestore
      .collection("batchMembers")
      .where("user_id", "==", user.id)
      .get()
    const allowedBatchIds = new Set(
      memberships.docs.map((doc: Doc) => String((doc.data() || {}).batch_id))
    )
    const rawSessions = await firestore.collection("sessions").get()
    snapshot = {
      docs: rawSessions.docs.filter((doc: Doc) =>
        allowedBatchIds.has(String((doc.data() || {}).batch_id))
      ),
    }
  }

  const sessions = snapshot.docs.map((doc: Doc | Snap) =>
    mapSession(doc.id, doc.data() || {})
  )
  return sessions
    .filter((session: Session) =>
      !params?.batch_id ? true : session.batch_id === params.batch_id
    )
    .sort((left: Session, right: Session) =>
      right.started_at.localeCompare(left.started_at)
    )
}

export async function getSession(user: User, sessionId: string) {
  const sessionSnapshot = await firestore
    .collection("sessions")
    .doc(sessionId)
    .get()
  if (!sessionSnapshot.exists) {
    throw new Error("Session not found")
  }

  const sessionData = sessionSnapshot.data() || {}
  const batchId = String(sessionData.batch_id)

  if (user.role === "student" && String(sessionData.student_id) !== user.id) {
    throw new Error("Forbidden")
  }

  if (user.role !== "student") {
    await requireBatchAccess(user, batchId)
  }

  const answersSnapshot = await firestore
    .collection("sessionAnswers")
    .where("session_id", "==", sessionId)
    .get()
  const answers = answersSnapshot.docs
    .map((doc: Doc) => mapAnswer(doc.id, doc.data() || {}))
    .sort(
      (left: SessionAnswer, right: SessionAnswer) =>
        Number(left.question?.order || 0) - Number(right.question?.order || 0)
    )

  return mapSession(sessionSnapshot.id, sessionData, answers)
}

export async function saveAnswer(
  user: User,
  sessionId: string,
  data: {
    question_id: string
    cloudinary: SessionAnswer["cloudinary"]
    audio_path: string
    duration_seconds?: number | null
  }
) {
  const session = await getSession(user, sessionId)
  if (session.user_id !== user.id) {
    throw new Error("Forbidden")
  }

  const answerId = `${sessionId}_${data.question_id}`
  const timestamp = nowIso()

  await firestore
    .collection("sessionAnswers")
    .doc(answerId)
    .set(
      {
        session_id: sessionId,
        batch_id: session.batch_id,
        student_id: session.user_id,
        question_id: data.question_id,
        audio_path: data.audio_path,
        cloudinary: data.cloudinary,
        duration_seconds: data.duration_seconds ?? null,
        status: "uploaded",
        updated_at: timestamp,
      },
      { merge: true }
    )

  const answersSnapshot = await firestore
    .collection("sessionAnswers")
    .where("session_id", "==", sessionId)
    .get()
  const uploadedCount = answersSnapshot.docs.filter((doc: Doc) => {
    const status = (doc.data() || {}).status
    return (
      status === "uploaded" || status === "processing" || status === "analyzed"
    )
  }).length

  await firestore.collection("sessions").doc(sessionId).set(
    {
      status: "recording",
      answers_uploaded: uploadedCount,
    },
    { merge: true }
  )

  return getSession(user, sessionId).then(
    (updated) =>
      updated.answers?.find(
        (answer) => answer.question_id === data.question_id
      ) || null
  )
}

export async function markSessionReady(user: User, sessionId: string) {
  const session = await getSession(user, sessionId)
  if (session.user_id !== user.id) {
    throw new Error("Forbidden")
  }

  const answersSnapshot = await firestore
    .collection("sessionAnswers")
    .where("session_id", "==", sessionId)
    .get()
  const answers = answersSnapshot.docs.map((doc: Doc) => doc.data() || {})
  const uploadedCount = answers.filter(
    (answer: DocumentData) => answer.status === "uploaded"
  ).length

  if (uploadedCount === 0 || uploadedCount !== answers.length) {
    throw new Error("Upload all answers before analysis")
  }

  await firestore.collection("sessions").doc(sessionId).set(
    {
      status: "ready_for_analysis",
      answers_uploaded: uploadedCount,
    },
    { merge: true }
  )

  return getSession(user, sessionId)
}

export async function getProgressSummary(
  user: User,
  studentId?: string,
  batchId?: string
): Promise<ProgressSummary> {
  const targetStudentId = studentId || user.id
  if (user.role === "student" && targetStudentId !== user.id) {
    throw new Error("Forbidden")
  }

  if (batchId && user.role !== "student") {
    await requireBatchAccess(user, batchId)
  }

  const sessions = await listSessions(
    user.role === "student" ? user : { ...user, id: targetStudentId },
    { batch_id: batchId, user_id: targetStudentId }
  )

  const completed = sessions.filter(
    (session: Session) => session.status === "completed"
  )
  const recentSessions = completed.slice(0, 5)

  const analysisSnapshots = await Promise.all(
    completed.map((session: Session) =>
      firestore.collection("sessionAnalyses").doc(session.id).get()
    )
  )

  const analyses = analysisSnapshots
    .filter((snap: Snap) => snap.exists)
    .map((snap: Snap) => snap.data() || {})
  const scores = analyses.map((analysis: DocumentData) =>
    Number(analysis.final_score ?? 0)
  )
  const latest = analyses[0] || null
  const avgScore = average(scores)
  const deliveryLevels = analyses.map((analysis: DocumentData) =>
    String(analysis.overall_delivery_level || "")
  )
  const contentLevels = analyses.map((analysis: DocumentData) =>
    String(analysis.overall_content_level || "")
  )
  const avgDelivery = average(deliveryLevels.map(levelToScore))
  const avgContent = average(contentLevels.map(levelToScore))

  return {
    user_id: targetStudentId,
    batch_id: batchId ?? null,
    sessions_completed: completed.length,
    avg_delivery_level: deliveryLevels[0] || null,
    avg_content_level: contentLevels[0] || null,
    trend_direction:
      scores.length > 1 && scores[0] > scores[scores.length - 1]
        ? "improving"
        : "stable",
    metrics_summary: latest
      ? {
          avg_final_score: avgScore,
          latest_strengths: (latest.strengths as string[]) || [],
          latest_slowdowns: (latest.slowdowns as string[]) || [],
          latest_next_focus: (latest.next_focus as string[]) || [],
        }
      : null,
    trend_data: analyses
      .slice(0, 6)
      .map((analysis: DocumentData, index: number) => ({
        session_id: completed[index]?.id || "",
        delivery_level: String(analysis.overall_delivery_level || ""),
        content_level: String(analysis.overall_content_level || ""),
        final_score: Number(analysis.final_score ?? 0),
      })),
    total_sessions: completed.length,
    avg_score: avgScore,
    avg_delivery: avgDelivery,
    avg_content: avgContent,
    current_grade: gradeFromScore(avgScore),
    focus_area: latest?.next_focus?.[0] || null,
    recent_sessions: recentSessions,
  }
}

export async function getCompletedSessionSnapshots(
  user: User,
  batchId?: string
) {
  const sessions = await listSessions(user, {
    batch_id: batchId,
    user_id: user.id,
  })
  return sessions
    .filter((session: Session) => session.status === "completed")
    .map((session: Session) => ({
      id: session.id,
      session_number: Number(
        (session as unknown as { session_number?: number }).session_number || 0
      ),
      batch_id: session.batch_id,
      completed_at: session.completed_at,
      overall_delivery_level: null,
      overall_content_level: null,
      final_score: null,
      summary_text: null,
    }))
}

// ─── Question Set CRUD ───────────────────────────────────────────────────────

export async function createQuestionSet(
  user: User,
  batchId: string,
  data: { name: string; description?: string }
) {
  const batch = await requireBatchAccess(user, batchId)
  const timestamp = nowIso()
  const questionSetId = randomUUID()

  await firestore
    .collection("questionSets")
    .doc(questionSetId)
    .set({
      organization_id: batch.organization_id,
      batch_id: batchId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      family: "hr_interview_v1",
      question_count: 0,
      created_by: user.id,
      created_at: timestamp,
    })

  return mapQuestionSet(questionSetId, {
    organization_id: batch.organization_id,
    batch_id: batchId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    family: "hr_interview_v1",
    question_count: 0,
    created_at: timestamp,
  })
}

export async function addQuestion(
  user: User,
  questionSetId: string,
  data: {
    body: string
    order?: number
    family?: string
    audio_url?: string
    audio_cloudinary?: unknown
  }
) {
  const qsDoc = await getQuestionSetDoc(questionSetId)
  if (!qsDoc.exists) {
    throw new Error("Question set not found")
  }

  const qsData = qsDoc.data() || {}
  await requireBatchAccess(user, String(qsData.batch_id))

  const timestamp = nowIso()
  const questionId = randomUUID()
  const currentCount = Number(qsData.question_count || 0)
  const order = data.order ?? currentCount + 1

  await firestore
    .collection("questions")
    .doc(questionId)
    .set({
      organization_id: String(qsData.organization_id),
      batch_id: String(qsData.batch_id),
      question_set_id: questionSetId,
      body: data.body.trim(),
      order,
      family: data.family || "general",
      audio_url: data.audio_url || null,
      audio_cloudinary: data.audio_cloudinary || null,
      created_at: timestamp,
    })

  await firestore
    .collection("questionSets")
    .doc(questionSetId)
    .update({
      question_count: currentCount + 1,
    })

  return mapQuestion(questionId, {
    question_set_id: questionSetId,
    body: data.body.trim(),
    order,
    family: data.family || "general",
    audio_url: data.audio_url || null,
    audio_cloudinary: data.audio_cloudinary || null,
  })
}

export async function updateQuestion(
  user: User,
  questionId: string,
  data: {
    body?: string
    audio_url?: string | null
    audio_cloudinary?: unknown | null
  }
) {
  const questionDoc = await firestore
    .collection("questions")
    .doc(questionId)
    .get()
  if (!questionDoc.exists) {
    throw new Error("Question not found")
  }

  const questionData = questionDoc.data() || {}
  await requireBatchAccess(user, String(questionData.batch_id))

  const updates: Record<string, unknown> = { updated_at: nowIso() }
  if (data.body !== undefined) updates.body = data.body.trim()
  if (data.audio_url !== undefined) updates.audio_url = data.audio_url
  if (data.audio_cloudinary !== undefined)
    updates.audio_cloudinary = data.audio_cloudinary

  await firestore.collection("questions").doc(questionId).update(updates)
  return mapQuestion(questionId, { ...questionData, ...updates })
}

export async function deleteQuestion(user: User, questionId: string) {
  const questionDoc = await firestore
    .collection("questions")
    .doc(questionId)
    .get()
  if (!questionDoc.exists) {
    throw new Error("Question not found")
  }

  const questionData = questionDoc.data() || {}
  await requireBatchAccess(user, String(questionData.batch_id))

  await firestore.collection("questions").doc(questionId).delete()

  const qsDoc = await getQuestionSetDoc(String(questionData.question_set_id))
  if (qsDoc.exists) {
    const count = Number((qsDoc.data() || {}).question_count || 1)
    await firestore
      .collection("questionSets")
      .doc(String(questionData.question_set_id))
      .update({
        question_count: Math.max(0, count - 1),
      })
  }
}
