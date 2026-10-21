import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard, LocateFixed } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import PriorityQueue from '../components/PriorityQueue'
import SmartBinMap from '../components/SmartBinMap'
import StatCard from '../components/StatCard'
import { useAuth } from '../context/AuthContext'
import { listenToBins } from '../services/binService'
import { listenToPath } from '../firebase/database'
import { updateJobStatus, collectBin, disposeVehicleLoad } from '../services/collectionService'
import { updateVehicleLocation, unloadVehicle } from '../services/vehicleService'
import { buildPriorityQueue } from '../utils/priority'
import { capitalize } from '../utils/formatting'
import { useToast } from '../components/Toast'

const NAV_ITEMS = [{ to: '/collector/dashboard', label: 'My jobs', icon: LayoutDashboard, end: true }]

export default function CollectorDashboard() {
  const { user } = useAuth()
  const [collectorProfile, setCollectorProfile] = useState(null)
  const [bins, setBins] = useState({})
  const [vehicle, setVehicle] = useState(null)
  const [vendors, setVendors] = useState({})
  const toast = useToast()

  useEffect(() => {
    if (!user?.uid) return
    return listenToPath(`collectors/${user.uid}`, setCollectorProfile)
  }, [user?.uid])

  useEffect(() => listenToBins(setBins), [])

  useEffect(() => listenToPath('vendors', (records) => setVendors(records || {})), [])

  useEffect(() => {
    if (!collectorProfile?.vehicleId) return
    return listenToPath(`vehicles/${collectorProfile.vehicleId}`, setVehicle)
  }, [collectorProfile?.vehicleId])

  const wasteClass = collectorProfile?.wasteClass

  const jobs = useMemo(() => {
    if (!wasteClass) return []
    return buildPriorityQueue(bins, wasteClass, vehicle)
  }, [bins, wasteClass, vehicle])

  const scopedBins = useMemo(() => {
    if (!wasteClass) return {}
    return Object.fromEntries(Object.entries(bins).filter(([, b]) => b.compartments?.[wasteClass]))
  }, [bins, wasteClass])

  const scopedVendors = useMemo(() => Object.fromEntries(
    Object.entries(vendors).filter(([, vendor]) => vendor.licenseStatus === 'VERIFIED' && vendor.wasteTypes?.includes(wasteClass))
  ), [vendors, wasteClass])

  const handleAdvance = async (job, nextStatus) => {
    try {
      await updateJobStatus(job.binId, wasteClass, nextStatus, collectorProfile?.vehicleId)
      toast.success(`${job.binName}: status set to ${nextStatus.replace('_', ' ')}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update job status.')
    }
  }

  const handleCollect = async (job) => {
    try {
      const bin = bins[job.binId]
      await collectBin({ bin, wasteType: wasteClass, collectorId: user.uid, vehicleId: collectorProfile?.vehicleId })
      toast.success(`Collected ${job.binName}. Bin emptied and inventory updated.`)
    } catch (err) {
      toast.error(err.message || 'Failed to complete collection.')
    }
  }

  const handleLocationUpdate = () => {
    if (!navigator.geolocation || !collectorProfile?.vehicleId) {
      toast.error('Live location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await updateVehicleLocation(collectorProfile.vehicleId, coords.latitude, coords.longitude)
          toast.success('Vehicle location updated.')
        } catch (err) {
          toast.error(err.message || 'Could not update location.')
        }
      },
      () => toast.error('Location permission was not granted.')
    )
  }

  const handleUnload = async () => {
    try {
      await disposeVehicleLoad({ vehicleId: collectorProfile.vehicleId, collectorId: user.uid, loadByType: vehicle?.loadByType })
      await unloadVehicle(collectorProfile.vehicleId)
      toast.success('Vehicle unloaded. Waste marked as disposed and load counter reset.')
    } catch (err) {
      toast.error(err.message || 'Could not unload vehicle.')
    }
  }

  if (!collectorProfile) {
    return (
      <div className="flex min-h-screen bg-[#F4F6F8]">
        <Sidebar items={NAV_ITEMS} roleLabel="Collector" />
        <div className="flex-1">
          <Topbar title="Loading your assignment…" />
          <main className="p-6 text-sm text-slate-400">Fetching your collector profile…</main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Sidebar items={NAV_ITEMS} roleLabel="Collector" />
      <div className="flex-1 min-w-0">
        <Topbar
          title={`${capitalize(wasteClass)} collection queue`}
          subtitle={`Vehicle ${vehicle?.vehicleId || collectorProfile.vehicleId} · ${vehicle?.status || '—'}`}
        />
        <main className="p-6 max-w-[1200px] mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Jobs in queue" value={jobs.length} accent="navy" />
            <StatCard label="Critical / high" value={jobs.filter((j) => j.status === 'CRITICAL' || j.status === 'HIGH').length} accent="red" />
            <StatCard label="Vehicle load" value={`${Number(vehicle?.currentLoad || 0).toFixed(1)} / ${vehicle?.capacity || '—'} kg`} accent={vehicle?.status === 'FULL' ? 'red' : 'green'} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Route starts from the vehicle location and balances priority with driving distance.</p>
            <div className="flex gap-2">
              <button onClick={handleLocationUpdate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700"><LocateFixed size={14} /> Update live location</button>
              <button onClick={handleUnload} disabled={!vehicle?.currentLoad} className="px-3 py-2 rounded-lg bg-navy-900 text-white text-xs font-semibold disabled:opacity-40">Unload vehicle</button>
            </div>
          </div>

          <SmartBinMap bins={scopedBins} vendors={scopedVendors} vehicles={vehicle ? { [vehicle.vehicleId]: vehicle } : {}} height={300} />

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Priority queue — highest score first</p>
            <PriorityQueue jobs={jobs} onAdvance={handleAdvance} onCollect={handleCollect} />
          </div>
        </main>
      </div>
    </div>
  )
}
