import { Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { capitalize } from '../utils/formatting'

export default function CollectorTable({ collectors, vehicles, onDelete }) {
  const rows = Object.values(collectors || {})

  if (rows.length === 0) {
    return <EmptyState message="No collectors yet. Create one to assign waste-class jobs." />
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <Th>Name</Th>
            <Th>Username</Th>
            <Th>Waste class</Th>
            <Th>Vehicle</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((c) => (
            <tr key={c.collectorId} className="hover:bg-slate-50/60">
              <Td className="font-medium text-slate-700">{c.name}</Td>
              <Td className="font-mono text-xs text-slate-500">{c.username}</Td>
              <Td>{capitalize(c.wasteClass)}</Td>
              <Td className="font-mono text-xs">{vehicles?.[c.vehicleId]?.vehicleName || c.vehicleId || '—'}</Td>
              <Td><StatusBadge status={c.status || 'ACTIVE'} /></Td>
              <Td>
                <button onClick={() => onDelete?.(c)} className="p-1.5 rounded-md text-wastex-red hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }) {
  return <th className="text-left font-semibold px-4 py-2.5">{children}</th>
}
function Td({ children, className = '' }) {
  return <td className={`px-4 py-2.5 ${className}`}>{children}</td>
}
export function EmptyState({ message }) {
  return <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">{message}</div>
}
