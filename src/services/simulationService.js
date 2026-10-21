import { listenToPath, writePath, updatePath, readPath } from '../firebase/database'
import { WASTE_TYPES } from '../utils/priority'

export const SIM_SPEEDS = { slow: 5000, normal: 3500, fast: 2000 }

export function listenToSimulationState(binId, callback, onError) {
  return listenToPath(`simulation/${binId}`, (state) => callback(state || { running: false, speed: 'normal' }), onError)
}

export async function applyCompartmentValues(binId, wasteType, { fill, weight }) {
  await updatePath(`bins/${binId}/compartments/${wasteType}`, {
    fill: Math.max(0, Math.min(100, Number(fill))),
    weight: Math.max(0, Number(weight))
  })
  await updatePath(`bins/${binId}`, { updatedAt: Date.now() })
}

export async function applyEnvironmentReading(binId, patch) {
  // Organic compartment carries the DHT22/MQ135-style ambient readings.
  await updatePath(`bins/${binId}/compartments/organic`, patch)
}

export async function setSimulationRunning(binId, running, speed = 'normal') {
  await writePath(`simulation/${binId}`, { running, speed, updatedAt: Date.now() })
}

/**
 * One simulated sensor tick for a single bin. Reads current values and nudges
 * each compartment independently and non-uniformly, mimicking real ultrasonic
 * / load-cell drift rather than moving every number in lockstep.
 */
export async function tickSimulation(binId) {
  const bin = await readPath(`bins/${binId}`)
  if (!bin) return

  for (const type of WASTE_TYPES) {
    const compartment = bin.compartments?.[type]
    if (!compartment) continue

    const fillDelta = Math.random() * 4 + 0.5 // 0.5 - 4.5 %
    const weightDelta = Math.random() * 1.2 + 0.1 // 0.1 - 1.3 kg, independent of fill

    const nextFill = Math.min(100, Number(compartment.fill || 0) + fillDelta)
    const nextWeight = Math.min(60, Number(compartment.weight || 0) + weightDelta)

    const patch = { fill: Number(nextFill.toFixed(1)), weight: Number(nextWeight.toFixed(1)) }

    if (type === 'organic') {
      patch.temperature = Number((26 + Math.random() * 8).toFixed(1))
      patch.humidity = Number((45 + Math.random() * 30).toFixed(1))
      patch.gasLevel = Number((10 + Math.random() * 40).toFixed(1))
    }

    await updatePath(`bins/${binId}/compartments/${type}`, patch)
  }
  await updatePath(`bins/${binId}`, { updatedAt: Date.now() })
}
