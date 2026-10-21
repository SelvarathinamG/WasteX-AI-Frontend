import { writePath } from '../firebase/database'
import {
  createManagedAccount,
  loginWithUsername,
  logout
} from '../firebase/auth'
import { createBin } from './binService'
import { createVehicle } from './vehicleService'

const CENTER = { lat: 11.86, lng: 79.76 }
const jitter = (n = 0.02) => (Math.random() - 0.5) * n

const DEMO_BINS = [
  { binId: 'BIN001', binName: 'Madukarai Market', region: 'Madukarai', compartments: { plastic: [72, 14.5], paper: [45, 8.2], metal: [61, 11.4], organic: [82, 17.8] } },
  { binId: 'BIN002', binName: 'Lawspet Bus Stand', region: 'Lawspet', compartments: { plastic: [38, 6.1], paper: [22, 3.4], metal: [15, 2.0], organic: [55, 9.6] } },
  { binId: 'BIN003', binName: 'Reddiarpalayam Junction', region: 'Reddiarpalayam', compartments: { plastic: [91, 21.3], paper: [67, 12.9], metal: [40, 7.7], organic: [30, 5.1] } },
  { binId: 'BIN004', binName: 'Ariyankuppam Park', region: 'Ariyankuppam', compartments: { plastic: [58, 10.2], paper: [80, 15.6], metal: [72, 13.8], organic: [94, 24.0] } },
  { binId: 'BIN005', binName: 'Kalapet Beach Road', region: 'Kalapet', compartments: { plastic: [25, 4.0], paper: [33, 5.5], metal: [88, 16.2], organic: [41, 7.0] } },
  { binId: 'BIN006', binName: 'Muthialpet Market', region: 'Muthialpet', compartments: { plastic: [66, 12.0], paper: [51, 9.1], metal: [29, 4.6], organic: [70, 13.3] } }
]

const DEMO_VEHICLES = [
  { vehicleId: 'PLASTIC-01', vehicleName: 'Plastic Hauler 1', wasteClass: 'plastic', capacity: 500 },
  { vehicleId: 'PAPER-01', vehicleName: 'Paper Hauler 1', wasteClass: 'paper', capacity: 500 },
  { vehicleId: 'METAL-01', vehicleName: 'Metal Hauler 1', wasteClass: 'metal', capacity: 500 },
  { vehicleId: 'ORGANIC-01', vehicleName: 'Organic Hauler 1', wasteClass: 'organic', capacity: 500 }
]

const DEMO_COLLECTORS = [
  { fullName: 'Arun Kumar', username: 'arun01', password: 'arun123', wasteClass: 'plastic', vehicleId: 'PLASTIC-01' },
  { fullName: 'Priya Ramesh', username: 'priya01', password: 'priya123', wasteClass: 'paper', vehicleId: 'PAPER-01' },
  { fullName: 'Suresh Babu', username: 'suresh01', password: 'suresh123', wasteClass: 'metal', vehicleId: 'METAL-01' },
  { fullName: 'Kavitha Devi', username: 'kavitha01', password: 'kavitha123', wasteClass: 'organic', vehicleId: 'ORGANIC-01' }
]

const DEMO_VENDORS = [
  { businessName: 'GreenCycle Plastics', username: 'greencycle', password: 'vendor123', businessType: 'Plastic Recycler', wasteTypes: ['plastic'], location: 'Puducherry Industrial Estate' },
  { businessName: 'PaperLoop Recovery', username: 'paperloop', password: 'vendor123', businessType: 'Paper Recycler', wasteTypes: ['paper'], location: 'Thattanchavady' },
  { businessName: 'MetalWorks Salvage', username: 'metalworks', password: 'vendor123', businessType: 'Metal Recycler', wasteTypes: ['metal'], location: 'Mudaliarpet' },
  { businessName: 'BioGas Puducherry', username: 'biogaspdy', password: 'vendor123', businessType: 'Biogas Station', wasteTypes: ['organic'], location: 'Kirumampakkam' }
]

async function safeCreateAccount(config) {
  try {
    return await createManagedAccount(config)
  } catch (err) {
    if (err?.code === 'auth/email-already-in-use') {
      return { skipped: true }
    }
    throw err
  }
}

export async function seedDemoData(onProgress = () => {}) {
  const summary = { bins: 0, vehicles: 0, collectors: 0, vendors: 0, adminCreated: false, skipped: [] }

  onProgress('Creating demo administrator account…')

const adminResult = await safeCreateAccount({
  username: 'Selva',
  password: 'selva2005',
  role: 'admin',
  profile: { fullName: 'Selva (Municipal Admin)' }
})

if (adminResult.skipped) {
  summary.skipped.push('admin: Selva')
} else {
  summary.adminCreated = true
}

// Sign in the primary Firebase app as the demo administrator.
// All subsequent Realtime Database writes use the primary app.
onProgress('Signing in demo administrator…')

await loginWithUsername('Selva', 'selva2005', 'admin')

  onProgress('Seeding smart bins…')
  for (const bin of DEMO_BINS) {
    await createBin({
      binId: bin.binId,
      binName: bin.binName,
      region: bin.region,
      latitude: CENTER.lat + jitter(),
      longitude: CENTER.lng + jitter(),
      status: 'ACTIVE'
    })
    const patch = {}
    for (const [type, [fill, weight]] of Object.entries(bin.compartments)) {
      patch[type] = { fill, weight, collectionStatus: 'PENDING' }
      if (type === 'organic') Object.assign(patch[type], { temperature: 29.5, humidity: 68, gasLevel: 24 })
    }
    await writePath(`bins/${bin.binId}/compartments`, patch)
    summary.bins += 1
  }

  onProgress('Seeding fleet vehicles…')
  for (const vehicle of DEMO_VEHICLES) {
    await createVehicle({ ...vehicle, latitude: CENTER.lat + jitter(), longitude: CENTER.lng + jitter() })
    summary.vehicles += 1
  }

  onProgress('Creating collector accounts…')
  for (const collector of DEMO_COLLECTORS) {
    const result = await safeCreateAccount({
      username: collector.username,
      password: collector.password,
      role: 'collector',
      profile: { fullName: collector.fullName }
    })
    if (result.skipped) {
      summary.skipped.push(`collector: ${collector.username}`)
      continue
    }
    await writePath(`collectors/${result.uid}`, {
      collectorId: result.uid,
      name: collector.fullName,
      username: collector.username,
      wasteClass: collector.wasteClass,
      vehicleId: collector.vehicleId,
      status: 'ACTIVE',
      createdAt: Date.now()
    })
    await writePath(`vehicles/${collector.vehicleId}/collectorId`, result.uid)
    await writePath(`vehicles/${collector.vehicleId}/status`, 'ASSIGNED')
    summary.collectors += 1
  }

  onProgress('Creating vendor accounts…')
  for (const vendor of DEMO_VENDORS) {
    const result = await safeCreateAccount({
      username: vendor.username,
      password: vendor.password,
      role: 'vendor',
      profile: { businessName: vendor.businessName }
    })
    if (result.skipped) {
      summary.skipped.push(`vendor: ${vendor.username}`)
      continue
    }
    await writePath(`vendors/${result.uid}`, {
      vendorId: result.uid,
      businessName: vendor.businessName,
      username: vendor.username,
      businessType: vendor.businessType,
      wasteTypes: vendor.wasteTypes,
      location: vendor.location,
      licenseStatus: 'VERIFIED',
      createdAt: Date.now()
    })
    summary.vendors += 1
  }

  onProgress('Seeding regional waste inventory…')
  const inventory = {
    Madukarai: { plastic: [500, 180], paper: [350, 120], metal: [280, 100], organic: [700, 250] }
  }
  for (const [region, types] of Object.entries(inventory)) {
    const patch = {}
    for (const [type, [total, dispatched]] of Object.entries(types)) {
      patch[type] = { totalQuantity: total, dispatchedQuantity: dispatched, remainingQuantity: total - dispatched }
    }
    await writePath(`wasteInventory/${region}`, patch)
  }

  return summary
}
