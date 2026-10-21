import { Trash2, SlidersHorizontal, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { WASTE_TYPES, binOverallStatus, fillStatus, STATUS_COLOR } from '../utils/priority'
import { formatKg, formatPercent, timeAgo } from '../utils/formatting'
import { capitalize } from '../utils/formatting'

export default function SmartBinCard({ bin, onSimulate, onDelete }) {
  const overall = binOverallStatus(bin.compartments)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-slate-800 text-sm">{bin.binName}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin size={11} /> {bin.region} &middot; {bin.binId}
          </p>
        </div>
        <StatusBadge status={overall} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {WASTE_TYPES.map((type) => {
          const c = bin.compartments?.[type] || { fill: 0, weight: 0 }
          const status = fillStatus(c.fill)
          return (
            <div key={type} className="bg-slate-50 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">{capitalize(type)}</span>
                <span className="text-[10px] font-mono text-slate-400">{formatKg(c.weight)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(c.fill, 100)}%`, background: STATUS_COLOR[status] }} />
              </div>
              <p className="text-right text-[10px] font-mono text-slate-500 mt-0.5">{formatPercent(c.fill)}</p>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">Updated {timeAgo(bin.updatedAt)}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onSimulate?.(bin)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal size={12} /> Simulate
          </button>
          <button
            onClick={() => onDelete?.(bin)}
            className="p-1.5 rounded-md border border-slate-200 text-wastex-red hover:bg-red-50"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
