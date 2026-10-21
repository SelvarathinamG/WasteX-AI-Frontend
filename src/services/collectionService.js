import { listenToPath, writePath, updatePath, newKey, readPath } from '../firebase/database'

export const JOB_STATUSES = [
  'PENDING',
  'PRIORITIZED',
  'ASSIGNED',
  'DISPATCHED',
  'IN_TRANSIT',
  'ARRIVED',
  'COLLECTING',
  'COLLECTED'
]

export function listenToCollections(callback, onError) {
  return listenToPath('collections', (collections) => callback(collections || {}), onError)
}

export function listenToInventory(callback, onError) {
  return listenToPath('wasteInventory', (inventory) => callback(inventory || {}), onError)
}

/** Advances a job's lifecycle status without finalizing the physical collection. */
export async function updateJobStatus(binId, wasteType, status, vehicleId) {
  await updatePath(`bins/${binId}/compartments/${wasteType}`, { collectionStatus: status })
  if (vehicleId) {
    const vehicleStatusMap = {
      DISPATCHED: 'DISPATCHED',
      IN_TRANSIT: 'IN_TRANSIT',
      ARRIVED: 'ARRIVED',
      COLLECTING: 'COLLECTING'
    }
    if (vehicleStatusMap[status]) {
      await updatePath(`vehicles/${vehicleId}`, { status: vehicleStatusMap[status] })
    }
  }
}

/**
 * Finalizes a collection: records the pickup, empties the bin compartment,
 * feeds the collected quantity into the regional resource-recovery inventory,
 * and frees up the vehicle. All in one place so every dashboard listening to
 * these paths stays consistent.
 */
export async function collectBin({ bin, wasteType, collectorId, vehicleId }) {
  const compartment = bin.compartments?.[wasteType]
  if (!compartment) throw new Error(`Bin ${bin.binId} has no ${wasteType} compartment.`)

  const quantity = Number(compartment.weight || 0)
  const region = bin.region || 'Unregistered'
  const collectionId = newKey('collections')
  const now = Date.now()
  const vehicle = vehicleId ? await readPath(`vehicles/${vehicleId}`) : null
  const currentLoad = Number(vehicle?.currentLoad || 0)
  const capacity = Number(vehicle?.capacity || Number.MAX_SAFE_INTEGER)
  if (currentLoad + quantity > capacity) {
    throw new Error(`Vehicle capacity exceeded. Unload ${Math.max(0, currentLoad - capacity + quantity).toFixed(1)} kg before collecting this bin.`)
  }

  await writePath(`collections/${collectionId}`, {
    collectionId,
    binId: bin.binId,
    binName: bin.binName,
    region,
    collectorId,
    vehicleId,
    wasteType,
    quantity,
    priority: compartment.fill,
    status: 'COLLECTED',
    createdAt: compartment.createdAt || now,
    collectedAt: now
  })

  // Empty the compartment — the digital twin now reflects an emptied bin.
  await updatePath(`bins/${bin.binId}/compartments/${wasteType}`, {
    fill: 0,
    weight: 0,
    collectionStatus: 'PENDING'
  })

  // Feed the recovered material into the regional inventory as newly available stock.
  const inventoryPath = `wasteInventory/${region}/${wasteType}`
  const existing = (await readPath(inventoryPath)) || { totalQuantity: 0, dispatchedQuantity: 0, remainingQuantity: 0 }
  const totalQuantity = Number(existing.totalQuantity || 0) + quantity
  const dispatchedQuantity = Number(existing.dispatchedQuantity || 0)
  await writePath(inventoryPath, {
    totalQuantity,
    dispatchedQuantity,
    remainingQuantity: totalQuantity - dispatchedQuantity
  })

  if (vehicleId) {
    const nextLoad = currentLoad + quantity
    await updatePath(`vehicles/${vehicleId}`, {
      currentLoad: nextLoad,
      loadByType: { ...(vehicle?.loadByType || {}), [wasteType]: Number(vehicle?.loadByType?.[wasteType] || 0) + quantity },
      status: nextLoad >= capacity ? 'FULL' : 'AVAILABLE'
    })
  }

  return collectionId
}

/** A vendor claiming/dispatching material out of the regional inventory. */
export async function dispatchInventory(region, wasteType, amount, vendor = {}) {
  const path = `wasteInventory/${region}/${wasteType}`
  const existing = (await readPath(path)) || { totalQuantity: 0, dispatchedQuantity: 0, remainingQuantity: 0 }
  const requestedAmount = Number(amount)
  const totalQuantity = Number(existing.totalQuantity || 0)
  const remainingQuantity = Number(existing.remainingQuantity ?? totalQuantity - Number(existing.dispatchedQuantity || 0))
  if (!requestedAmount || requestedAmount <= 0) throw new Error('Dispatch quantity must be greater than zero.')
  if (requestedAmount > remainingQuantity) throw new Error(`Only ${remainingQuantity.toFixed(1)} kg is available for dispatch.`)
  const dispatchedQuantity = Number(existing.dispatchedQuantity || 0) + requestedAmount
  await writePath(path, {
    totalQuantity,
    dispatchedQuantity,
    remainingQuantity: Math.max(totalQuantity - dispatchedQuantity, 0)
  })
  const dispatchId = newKey('dispatches')
  await writePath(`dispatches/${dispatchId}`, {
    dispatchId,
    region,
    wasteType,
    amount: requestedAmount,
    vendorId: vendor.vendorId || null,
    vendorName: vendor.businessName || null,
    status: 'DISPATCHED',
    dispatchedAt: Date.now()
  })
  return dispatchId
}

export function listenToDispatches(callback, onError) {
  return listenToPath('dispatches', (dispatches) => callback(dispatches || {}), onError)
}

export function listenToDisposals(callback, onError) {
  return listenToPath('disposals', (disposals) => callback(disposals || {}), onError)
}

export async function disposeVehicleLoad({ vehicleId, collectorId, loadByType = {} }) {
  const disposedAt = Date.now()
  for (const [wasteType, amountValue] of Object.entries(loadByType)) {
    const amount = Number(amountValue || 0)
    if (amount <= 0) continue
    const disposalId = newKey('disposals')
    await writePath(`disposals/${disposalId}`, {
      disposalId,
      vehicleId,
      collectorId,
      wasteType,
      amount,
      status: 'DISPOSED',
      disposedAt
    })
  }
}
