import { Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { capitalize } from '../utils/formatting'
import { EmptyState } from './CollectorTable'

export default function VehicleTable({ vehicles, collectors, onDelete }) {
  const rows = Object.values(vehicles || {})
  if (rows.length === 0) return <EmptyState message="No vehicles yet. Add one before creating collectors." />

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th className="text-left font-semibold px-4 py-2.5">Vehicle ID</th>
            <th className="text-left font-semibold px-4 py-2.5">Name</th>
            <th className="text-left font-semibold px-4 py-2.5">Waste class</th>
            <th className="text-left font-semibold px-4 py-2.5">Capacity</th>
            <th className="text-left font-semibold px-4 py-2.5">Driver</th>
            <th className="text-left font-semibold px-4 py-2.5">Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((v) => (
            <tr key={v.vehicleId} className="hover:bg-slate-50/60">
              <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">{v.vehicleId}</td>
              <td className="px-4 py-2.5">{v.vehicleName}</td>
              <td className="px-4 py-2.5">{capitalize(v.wasteClass)}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{v.capacity} kg</td>
              <td className="px-4 py-2.5">{collectors?.[v.collectorId]?.name || '—'}</td>
              <td className="px-4 py-2.5"><StatusBadge status={v.status} /></td>
              <td className="px-4 py-2.5">
                <button onClick={() => onDelete?.(v)} className="p-1.5 rounded-md text-wastex-red hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
