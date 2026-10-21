const STYLES = {
  CRITICAL: 'bg-red-50 text-wastex-red border-red-200',
  HIGH: 'bg-orange-50 text-wastex-orange border-orange-200',
  MEDIUM: 'bg-amber-50 text-wastex-amber border-amber-200',
  NORMAL: 'bg-emerald-50 text-wastex-green border-emerald-200',
  ACTIVE: 'bg-emerald-50 text-wastex-green border-emerald-200',
  AVAILABLE: 'bg-emerald-50 text-wastex-green border-emerald-200',
  ASSIGNED: 'bg-blue-50 text-blue-600 border-blue-200',
  DISPATCHED: 'bg-amber-50 text-wastex-amber border-amber-200',
  IN_TRANSIT: 'bg-amber-50 text-wastex-amber border-amber-200',
  ARRIVED: 'bg-orange-50 text-wastex-orange border-orange-200',
  COLLECTING: 'bg-orange-50 text-wastex-orange border-orange-200',
  COLLECTED: 'bg-emerald-50 text-wastex-green border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-wastex-green border-emerald-200',
  PENDING: 'bg-slate-100 text-slate-500 border-slate-200',
  OFFLINE: 'bg-slate-100 text-slate-500 border-slate-200',
  PENDING_VERIFICATION: 'bg-amber-50 text-wastex-amber border-amber-200',
  VERIFIED: 'bg-emerald-50 text-wastex-green border-emerald-200'
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  )
}
