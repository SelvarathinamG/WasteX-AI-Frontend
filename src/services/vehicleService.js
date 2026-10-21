import { listenToPath, writePath, updatePath, removePath } from '../firebase/database'

export function listenToVehicles(callback, onError) {
  return listenToPath('vehicles', (vehicles) => callback(vehicles || {}), onError)
}

export async function createVehicle({ vehicleId, vehicleName, vehicleType, wasteClass, capacity, latitude, longitude }) {
  await writePath(`vehicles/${vehicleId}`, {
    vehicleId,
    vehicleName,
    vehicleType: vehicleType || 'Compactor Truck',
    wasteClass,
    collectorId: null,
    capacity: Number(capacity),
    currentLoad: 0,
    latitude: latitude ?? 11.86,
    longitude: longitude ?? 79.76,
    status: 'AVAILABLE',
    createdAt: Date.now()
  })
  return vehicleId
}

export async function updateVehicle(vehicleId, patch) {
  await updatePath(`vehicles/${vehicleId}`, patch)
}

export async function updateVehicleLocation(vehicleId, latitude, longitude) {
  await updateVehicle(vehicleId, { latitude, longitude, locationUpdatedAt: Date.now() })
}

export async function unloadVehicle(vehicleId) {
  await updateVehicle(vehicleId, { currentLoad: 0, loadByType: {}, status: 'AVAILABLE', unloadedAt: Date.now() })
}

export async function deleteVehicle(vehicleId) {
  await removePath(`vehicles/${vehicleId}`)
}
