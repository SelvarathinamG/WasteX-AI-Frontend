import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { initializeApp, deleteApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { ref, get, set, getDatabase } from 'firebase/database'
import { auth, db, app } from './config'

// WasteX AI usernames are plain strings (e.g. "arun01"), but Firebase Authentication
// requires an email-shaped identifier. We deterministically map every username to a
// pseudo-email under a private domain. The real, human-facing username is always the
// one stored in the user's database profile — this mapping is an implementation detail.
export const usernameToEmail = (username) =>
  `${String(username).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@wastex.local`

export async function loginWithUsername(username, password, expectedRole) {
  const email = usernameToEmail(username)
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid
  const snap = await get(ref(db, `users/${uid}`))

  if (!snap.exists()) {
    await signOut(auth)
    throw new Error('No profile found for this account. Contact your administrator.')
  }

  const profile = snap.val()
  if (expectedRole && profile.role !== expectedRole) {
    await signOut(auth)
    throw new Error(`This account is not registered as ${expectedRole}. Choose the correct tab.`)
  }

  return { uid, ...profile }
}

export async function logout() {
  await signOut(auth)
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null)
      return
    }
    const snap = await get(ref(db, `users/${user.uid}`))
    if (!snap.exists()) {
      callback(null)
      return
    }
    callback({ uid: user.uid, ...snap.val() })
  })
}

/**
 * Creates a Firebase Authentication account WITHOUT disturbing the currently
 * signed-in session (e.g. the Admin creating a Collector account). The client
 * Firebase SDK signs in as whichever user was just created, so we spin up a
 * short-lived secondary app instance, perform the creation there, and tear it
 * down immediately. In a full production deployment this would instead be a
 * Cloud Function using the Admin SDK — this is the client-only equivalent.
 */
export async function createManagedAccount({ username, password, role, profile }) {
  const secondaryName = `secondary-${Date.now()}`
  const secondaryApp = initializeApp(app.options, secondaryName)
  const secondaryAuth = getAuth(secondaryApp)
  const secondaryDb = getDatabase(secondaryApp)

  try {
    const email = usernameToEmail(username)

    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    )

    const uid = credential.user.uid

    await set(ref(secondaryDb, `users/${uid}`), {
      uid,
      username,
      role,
      ...profile,
      createdAt: Date.now()
    })

    return { uid, ...profile }
  } finally {
    await signOut(secondaryAuth).catch(() => {})

    const existing = getApps().find(
      (a) => a.name === secondaryName
    )

    if (existing) {
      await deleteApp(existing)
    }
  }
}

/** Vendors self-register, so it's fine to sign them in directly on the primary app. */
export async function registerVendorAccount({ username, password }) {
  const email = usernameToEmail(username)
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user.uid
}
