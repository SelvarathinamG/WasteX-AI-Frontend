import { useEffect, useMemo, useState } from 'react'
import { Store, PackageCheck, MapPin } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import InventoryChart from '../components/InventoryChart'
import { useAuth } from '../context/AuthContext'
import { listenToPath } from '../firebase/database'
import { listenToInventory, listenToDispatches, dispatchInventory } from '../services/collectionService'
import { WASTE_TYPES } from '../utils/priority'
import { capitalize, formatKg } from '../utils/formatting'
import { useToast } from '../components/Toast'

const NAV_ITEMS = [{ to: '/vendor/dashboard', label: 'Resource recovery', icon: Store, end: true }]

export default function VendorDashboard() {
  const { user } = useAuth()
  const [vendorProfile, setVendorProfile] = useState(null)
  const [inventory, setInventory] = useState({})
  const [claimAmount, setClaimAmount] = useState({})
  const [dispatches, setDispatches] = useState({})
  const toast = useToast()

  useEffect(() => {
    if (!user?.uid) return
    return listenToPath(`vendors/${user.uid}`, setVendorProfile)
  }, [user?.uid])

  useEffect(() => listenToInventory(setInventory), [])
  useEffect(() => listenToDispatches(setDispatches), [])

  const relevantTypes = vendorProfile?.wasteTypes?.length ? vendorProfile.wasteTypes : WASTE_TYPES

  const totals = useMemo(() => {
    const sums = {}
    for (const type of relevantTypes) {
      sums[type] = Object.values(inventory).reduce((sum, region) => sum + (region?.[type]?.remainingQuantity || 0), 0)
    }
    return sums
  }, [inventory, relevantTypes])

  const handleClaim = async (region, type) => {
    const amount = Number(claimAmount[`${region}-${type}`] || 0)
    if (!amount || amount <= 0) {
      toast.error('Enter a quantity greater than 0 to claim.')
      return
    }
    try {
      await dispatchInventory(region, type, amount, vendorProfile)
      toast.success(`Claimed ${formatKg(amount)} of ${capitalize(type)} from ${region}.`)
      setClaimAmount((prev) => ({ ...prev, [`${region}-${type}`]: '' }))
    } catch (err) {
      toast.error(err.message || 'Failed to claim material.')
    }
  }

  const myDispatches = Object.values(dispatches).filter((dispatch) => dispatch.vendorId === user?.uid)

  if (vendorProfile?.licenseStatus !== 'VERIFIED') {
    return (
      <div className="flex min-h-screen bg-[#F4F6F8]"><Sidebar items={NAV_ITEMS} roleLabel="Vendor" /><div className="flex-1 min-w-0"><Topbar title={vendorProfile?.businessName || 'Vendor account'} subtitle="Verification required" /><main className="p-6 max-w-[900px] mx-auto"><div className="bg-white rounded-xl border border-amber-200 p-8 text-center"><p className="text-lg font-semibold text-slate-800">Your account is awaiting admin verification.</p><p className="text-sm text-slate-500 mt-2">Resource dispatch becomes available after your license is approved.</p></div></main></div></div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Sidebar items={NAV_ITEMS} roleLabel="Vendor" />
      <div className="flex-1 min-w-0">
        <Topbar title={vendorProfile?.businessName || 'Resource recovery'} subtitle={vendorProfile?.businessType} />
        <main className="p-6 max-w-[1200px] mx-auto space-y-6">
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${relevantTypes.length}, minmax(0,1fr))` }}>
            {relevantTypes.map((type) => (
              <StatCard key={type} label={`Available ${capitalize(type)}`} value={formatKg(totals[type])} accent="green" />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <InventoryChart inventory={inventory} title="Material availability across regions" />
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2"><MapPin size={16} className="text-wastex-green" /><p className="text-sm font-semibold text-slate-700">Industry dispatch point</p></div>
              <p className="text-sm text-slate-600">{vendorProfile.location || 'Location not supplied'}</p>
              <p className="text-xs text-slate-400">{vendorProfile.latitude && vendorProfile.longitude ? `${vendorProfile.latitude}, ${vendorProfile.longitude}` : 'Add coordinates during registration'}</p>
              <p className="text-xs text-slate-500">{myDispatches.length} dispatches recorded</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">Claim material from regional inventory</p>
            {Object.entries(inventory).map(([region, types]) => (
              <div key={region} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">{region}</div>
                <div className="grid sm:grid-cols-2 gap-3 p-5">
                  {relevantTypes
                    .filter((type) => types?.[type])
                    .map((type) => {
                      const t = types[type]
                      const key = `${region}-${type}`
                      return (
                        <div key={type} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">{capitalize(type)}</p>
                            <p className="font-mono font-bold text-slate-800">{formatKg(t.remainingQuantity)} available</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="kg"
                              className="input !w-20 !py-1.5 !text-xs"
                              value={claimAmount[key] || ''}
                              onChange={(e) => setClaimAmount((prev) => ({ ...prev, [key]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleClaim(region, type)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy-900 text-white text-[11px] font-semibold hover:bg-navy-800"
                            >
                              <PackageCheck size={12} /> Claim
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
            {Object.keys(inventory).length === 0 && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                No material has been collected into inventory yet.
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold text-sm text-slate-800">My dispatch account</div>
            {myDispatches.length === 0 ? <p className="p-5 text-sm text-slate-400">No dispatches recorded yet.</p> : <div className="divide-y divide-slate-100">{myDispatches.slice(-8).reverse().map((dispatch) => <div key={dispatch.dispatchId} className="px-5 py-3 flex justify-between text-sm"><span className="capitalize">{dispatch.wasteType} · {dispatch.region}</span><span className="font-mono text-slate-600">{formatKg(dispatch.amount)}</span></div>)}</div>}
          </div>
        </main>
      </div>
    </div>
  )
}
