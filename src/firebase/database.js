import { ref, onValue, set, update, remove, push, get, serverTimestamp } from 'firebase/database'
import { db } from './config'

/** Subscribes to a Realtime Database path and returns an unsubscribe function. */
export function listenToPath(path, callback, onError) {
  const nodeRef = ref(db, path)
  const unsubscribe = onValue(
    nodeRef,
    (snapshot) => callback(snapshot.exists() ? snapshot.val() : null),
    (error) => {
      console.error(`Realtime listener failed for ${path}:`, error)
      if (onError) onError(error)
    }
  )
  return () => unsubscribe()
}

export async function readPath(path) {
  const snapshot = await get(ref(db, path))
  return snapshot.exists() ? snapshot.val() : null
}

export async function writePath(path, value) {
  return set(ref(db, path), value)
}

export async function updatePath(path, value) {
  return update(ref(db, path), value)
}

export async function removePath(path) {
  return remove(ref(db, path))
}

export function newKey(path) {
  return push(ref(db, path)).key
}

export { serverTimestamp }
