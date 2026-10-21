export default function StatCard({ label, value, icon: Icon, accent = 'green', sub }) {
  const accents = {
    green: 'text-wastex-green bg-emerald-50',
    red: 'text-wastex-red bg-red-50',
    orange: 'text-wastex-orange bg-orange-50',
    amber: 'text-wastex-amber bg-amber-50',
    navy: 'text-navy-700 bg-slate-100'
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800 font-mono mt-1">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
      {Icon && (
        <div className={`p-2 rounded-lg ${accents[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}
