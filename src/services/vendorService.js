import { listenToPath, writePath, updatePath } from '../firebase/database'
import { registerVendorAccount } from '../firebase/auth'

export function listenToVendors(callback, onError) {
  return listenToPath('vendors', (vendors) => callback(vendors || {}), onError)
}

export async function updateVendorLicenseStatus(vendorId, licenseStatus) {
  await updatePath(`vendors/${vendorId}`, { licenseStatus, verifiedAt: licenseStatus === 'VERIFIED' ? Date.now() : null })
}

export async function registerVendor({ businessName, username, password, businessType, wasteTypes, location, latitude, longitude }) {
  const uid = await registerVendorAccount({ username, password })

  await writePath(`users/${uid}`, {
    uid,
    username,
    role: 'vendor',
    createdAt: Date.now()
  })

  await writePath(`vendors/${uid}`, {
    vendorId: uid,
    businessName,
    username,
    businessType,
    wasteTypes,
    location,
    latitude: Number(latitude) || null,
    longitude: Number(longitude) || null,
    licenseStatus: 'PENDING_VERIFICATION',
    createdAt: Date.now()
  })

  return uid
}
