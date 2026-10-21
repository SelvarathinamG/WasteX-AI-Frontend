// Central place for the rules that decide urgency & collection ordering.
// Swapping this module's internals for GA / ACO / PPO / DQN later should not
// require any change to the components that call it.

export const WASTE_TYPES = ['plastic', 'paper', 'metal', 'organic']

export function fillStatus(fillPercent) {
  if (fillPercent >= 90) return 'CRITICAL'
  if (fillPercent >= 75) return 'HIGH'
  if (fillPercent >= 50) return 'MEDIUM'
  return 'NORMAL'
}

export const STATUS_RANK = { CRITICAL: 3, HIGH: 2, MEDIUM: 1, NORMAL: 0 }

export const STATUS_COLOR = {
  CRITICAL: '#D63A3A',
  HIGH: '#D9682B',
  MEDIUM: '#D98E28',
  NORMAL: '#1FA971'
}

/** Highest urgency across a bin's four compartments. */
export function binOverallStatus(compartments = {}) {
  let worst = 'NORMAL'
  for (const type of WASTE_TYPES) {
    const fill = compartments?.[type]?.fill ?? 0
    const status = fillStatus(fill)
    if (STATUS_RANK[status] > STATUS_RANK[worst]) worst = status
  }
  return worst
}

const MAX_REALISTIC_WEIGHT_KG = 40

/**
 * priorityScore = fill * 0.5 + normalizedWeight * 0.3 + waitingFactor * 0.2
 * All three terms are normalized to a 0-100 scale before weighting.
 */
export function priorityScore({ fill = 0, weight = 0, createdAt = Date.now(), now = Date.now() }) {
  const fillTerm = Math.min(fill, 100)
  const weightTerm = Math.min((weight / MAX_REALISTIC_WEIGHT_KG) * 100, 100)
  const hoursWaiting = Math.max(0, (now - createdAt) / (1000 * 60 * 60))
  const waitingTerm = Math.min((hoursWaiting / 24) * 100, 100) // caps out after 24h waiting

  return fillTerm * 0.5 + weightTerm * 0.3 + waitingTerm * 0.2
}

export function distanceKm(from, to) {
  if (!from?.latitude || !from?.longitude || !to?.latitude || !to?.longitude) return 0
  const radians = (value) => (value * Math.PI) / 180
  const dLat = radians(to.latitude - from.latitude)
  const dLon = radians(to.longitude - from.longitude)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Builds a sorted, waste-class-scoped job queue for a collector dashboard. */
export function buildPriorityQueue(bins = {}, wasteClass, vehicle = null) {
  const jobs = []
  for (const [binId, bin] of Object.entries(bins)) {
    const compartment = bin?.compartments?.[wasteClass]
    if (!compartment) continue
    const score = priorityScore({
      fill: compartment.fill,
      weight: compartment.weight,
      createdAt: bin.createdAt || Date.now()
    })
    jobs.push({
      binId,
      binName: bin.binName,
      region: bin.region,
      latitude: bin.latitude,
      longitude: bin.longitude,
      fill: compartment.fill,
      weight: compartment.weight,
      status: fillStatus(compartment.fill),
      collectionStatus: compartment.collectionStatus || 'PENDING',
      score
    })
  }
  const remaining = [...jobs]
  const route = []
  let current = vehicle
  while (remaining.length) {
    remaining.sort((a, b) => {
      const aDistance = distanceKm(current, a)
      const bDistance = distanceKm(current, b)
      return (b.score - aDistance * 4) - (a.score - bDistance * 4)
    })
    const next = remaining.shift()
    next.distanceKm = Number(distanceKm(current, next).toFixed(1))
    next.routeOrder = route.length + 1
    route.push(next)
    current = next
  }
  return route
}
