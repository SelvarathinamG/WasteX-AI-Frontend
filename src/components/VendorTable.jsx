import StatusBadge from './StatusBadge'
import { EmptyState } from './CollectorTable'

export default function VendorTable({ vendors, onStatusChange }) {
  const rows = Object.values(vendors || {})
  if (rows.length === 0) return <EmptyState message="No vendors have registered yet." />

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs">
          <tr>
            <th className="text-left font-semibold px-4 py-2.5">Business</th>
            <th className="text-left font-semibold px-4 py-2.5">Type</th>
            <th className="text-left font-semibold px-4 py-2.5">Waste types</th>
            <th className="text-left font-semibold px-4 py-2.5">Location</th>
            <th className="text-left font-semibold px-4 py-2.5">License</th>
            <th className="text-left font-semibold px-4 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((v) => (
            <tr key={v.vendorId} className="hover:bg-slate-50/60">
              <td className="px-4 py-2.5 font-medium text-slate-700">{v.businessName}</td>
              <td className="px-4 py-2.5">{v.businessType}</td>
              <td className="px-4 py-2.5 capitalize">{(v.wasteTypes || []).join(', ')}</td>
              <td className="px-4 py-2.5">{v.location}</td>
              <td className="px-4 py-2.5"><StatusBadge status={v.licenseStatus} /></td>
              <td className="px-4 py-2.5">
                {v.licenseStatus === 'PENDING_VERIFICATION' ? (
                  <div className="flex gap-2">
                    <button onClick={() => onStatusChange(v.vendorId, 'VERIFIED')} className="text-xs font-semibold text-wastex-green hover:underline">Verify</button>
                    <button onClick={() => onStatusChange(v.vendorId, 'REJECTED')} className="text-xs font-semibold text-wastex-red hover:underline">Reject</button>
                  </div>
                ) : <span className="text-xs text-slate-400">Reviewed</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
