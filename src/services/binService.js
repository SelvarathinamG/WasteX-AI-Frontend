import { listenToPath, writePath, updatePath, removePath, serverTimestamp } from '../firebase/database'
import { WASTE_TYPES } from '../utils/priority'

const emptyCompartments = () =>
  WASTE_TYPES.reduce((acc, type) => {
    acc[type] = { fill: 0, weight: 0, collectionStatus: 'PENDING' }
    if (type === 'organic') {
      acc[type].temperature = 28
      acc[type].humidity = 55
      acc[type].gasLevel = 12
    }
    return acc
  }, {})

export function listenToBins(callback, onError) {
  return listenToPath('bins', (bins) => callback(bins || {}), onError)
}

export async function createBin({ binId, binName, region, latitude, longitude, status = 'ACTIVE' }) {
  const now = Date.now()
  await writePath(`bins/${binId}`, {
    binId,
    binName,
    region,
    latitude,
    longitude,
    status,
    createdAt: now,
    updatedAt: now,
    compartments: emptyCompartments()
  })
  return binId
}

export async function updateBin(binId, patch) {
  await updatePath(`bins/${binId}`, { ...patch, updatedAt: Date.now() })
}

export async function updateCompartment(binId, wasteType, patch) {
  await updatePath(`bins/${binId}/compartments/${wasteType}`, patch)
  await updatePath(`bins/${binId}`, { updatedAt: Date.now() })
}

export async function deleteBin(binId) {
  await removePath(`bins/${binId}`)
}

export { serverTimestamp }
