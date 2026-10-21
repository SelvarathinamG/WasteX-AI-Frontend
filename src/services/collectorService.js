import { listenToPath, writePath, updatePath, removePath } from '../firebase/database'
import { createManagedAccount } from '../firebase/auth'

export function listenToCollectors(callback, onError) {
  return listenToPath('collectors', (collectors) => callback(collectors || {}), onError)
}

export async function createCollector({ fullName, username, password, wasteClass, vehicleId }) {
  const { uid } = await createManagedAccount({
    username,
    password,
    role: 'collector',
    profile: { fullName, username, wasteClass, vehicleId }
  })

  await writePath(`collectors/${uid}`, {
    collectorId: uid,
    name: fullName,
    username,
    wasteClass,
    vehicleId,
    status: 'ACTIVE',
    createdAt: Date.now()
  })

  // Reflect the assignment on the vehicle record too.
  await updatePath(`vehicles/${vehicleId}`, { collectorId: uid, status: 'ASSIGNED' })

  return uid
}

export async function updateCollector(collectorId, patch) {
  await updatePath(`collectors/${collectorId}`, patch)
}

export async function deleteCollector(collectorId) {
  await removePath(`collectors/${collectorId}`)
  // Note: this removes the profile/assignment record. The underlying Firebase
  // Auth account is left intact by design (client SDKs cannot delete other
  // users' auth accounts without the Admin SDK) — document this in ops runbooks.
}
