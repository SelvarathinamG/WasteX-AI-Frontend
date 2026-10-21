export function required(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required.`
  }
  return null
}

export function validateBinForm({ binId, binName, region, latitude, longitude }) {
  const errors = {}
  if (required(binId, 'Bin ID')) errors.binId = required(binId, 'Bin ID')
  if (required(binName, 'Bin name')) errors.binName = required(binName, 'Bin name')
  if (required(region, 'Region')) errors.region = required(region, 'Region')
  if (latitude === null || latitude === undefined) errors.latitude = 'Click the map to set a location.'
  if (longitude === null || longitude === undefined) errors.longitude = 'Click the map to set a location.'
  return errors
}

export function validateCollectorForm({ fullName, username, password, wasteClass, vehicleId }) {
  const errors = {}
  if (required(fullName, 'Full name')) errors.fullName = required(fullName, 'Full name')
  if (required(username, 'Username')) errors.username = required(username, 'Username')
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (required(wasteClass, 'Waste class')) errors.wasteClass = required(wasteClass, 'Waste class')
  if (required(vehicleId, 'Vehicle')) errors.vehicleId = required(vehicleId, 'Vehicle')
  return errors
}

export function validateVehicleForm({ vehicleId, vehicleName, wasteClass, capacity }) {
  const errors = {}
  if (required(vehicleId, 'Vehicle ID')) errors.vehicleId = required(vehicleId, 'Vehicle ID')
  if (required(vehicleName, 'Vehicle name')) errors.vehicleName = required(vehicleName, 'Vehicle name')
  if (required(wasteClass, 'Waste class')) errors.wasteClass = required(wasteClass, 'Waste class')
  if (!capacity || Number(capacity) <= 0) errors.capacity = 'Capacity must be greater than 0.'
  return errors
}

export function validateVendorForm({ businessName, username, password, businessType, latitude, longitude }) {
  const errors = {}
  if (required(businessName, 'Business name')) errors.businessName = required(businessName, 'Business name')
  if (required(username, 'Username')) errors.username = required(username, 'Username')
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.'
  if (required(businessType, 'Business type')) errors.businessType = required(businessType, 'Business type')
  if (latitude === null || latitude === undefined || latitude === '' || longitude === null || longitude === undefined || longitude === '') {
    errors.location = 'Click the map to mark the industry location.'
  }
  return errors
}

export const isEmpty = (errors) => Object.keys(errors).length === 0
