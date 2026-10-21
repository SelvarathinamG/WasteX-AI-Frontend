import { useEffect, useMemo, useState } from 'react'
import { Package, Activity } from 'lucide-react'
import InventoryChart from '../../components/InventoryChart'
import { listenToInventory, listenToDispatches, listenToCollections, listenToDisposals } from '../../services/collectionService'
import { WASTE_TYPES } from '../../utils/priority'
import { capitalize, formatKg } from '../../utils/formatting'

export default function Inventory() {
  const [inventory, setInventory] = useState({})
  const [dispatches, setDispatches] = useState({})
  const [collections, setCollections] = useState({})
  const [disposals, setDisposals] = useState({})

  useEffect(() => {
    const unsubscribers = [
      listenToInventory(setInventory),
      listenToDispatches(setDispatches),
      listenToCollections(setCollections),
      listenToDisposals(setDisposals)
    ]
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [])

  const regions = Object.entries(inventory)
  const totals = useMemo(() => WASTE_TYPES.reduce((result, type) => {
    result[type] = regions.reduce((sum, [, region]) => sum + Number(region?.[type]?.remainingQuantity || 0), 0)
    return result
  }, {}), [regions])
  const activity = useMemo(() => [
    ...Object.values(dispatches).map((item) => ({ ...item, activityType: 'Dispatched', time: item.dispatchedAt })),
    ...Object.values(collections).map((item) => ({ ...item, activityType: 'Collected', time: item.collectedAt })),
    ...Object.values(disposals).map((item) => ({ ...item, activityType: 'Disposed', quantity: item.amount, time: item.disposedAt }))
  ].sort((a, b) => Number(b.time || 0) - Number(a.time || 0)).slice(0, 8), [collections, dispatches, disposals])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {WASTE_TYPES.map((type) => (
          <div key={type} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 capitalize">Live {type} available</p>
            <p className="text-xl font-mono font-bold text-slate-800 mt-1">{formatKg(totals[type])}</p>
          </div>
        ))}
      </div>
      <InventoryChart inventory={inventory} disposals={disposals} />

      {regions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
          No collections recorded yet. Inventory fills up automatically as collectors complete pickups.
        </div>
      ) : (
        regions.map(([region, types]) => (
          <div key={region} className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
              <Package size={16} className="text-wastex-green" />
              <p className="font-semibold text-slate-800 text-sm">{region}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-5">
              {WASTE_TYPES.map((type) => {
                const t = types?.[type] || { totalQuantity: 0, dispatchedQuantity: 0, remainingQuantity: 0 }
                return (
                  <div key={type} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-500">{capitalize(type)}</p>
                    <p className="text-lg font-mono font-bold text-slate-800 mt-1">{formatKg(t.remainingQuantity)}</p>
                    <p className="text-[11px] text-slate-400">available of {formatKg(t.totalQuantity)} total</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-wastex-amber"
                        style={{ width: `${t.totalQuantity ? (t.dispatchedQuantity / t.totalQuantity) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{formatKg(t.dispatchedQuantity)} dispatched</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
          <Activity size={16} className="text-wastex-green" />
          <p className="font-semibold text-slate-800 text-sm">Live inventory activity</p>
        </div>
        {activity.length === 0 ? <p className="p-5 text-sm text-slate-400">Collection and dispatch activity will appear here in real time.</p> : (
          <div className="divide-y divide-slate-100">
            {activity.map((item, index) => (
              <div key={`${item.activityType}-${item.collectionId || item.dispatchId || index}`} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span><strong>{item.activityType}</strong> · <span className="capitalize">{item.wasteType}</span> · {item.region}</span>
                <span className="font-mono text-slate-600">{formatKg(item.quantity ?? item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
