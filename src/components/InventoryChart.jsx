import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { WASTE_TYPES } from '../utils/priority'
import { capitalize } from '../utils/formatting'

export default function InventoryChart({ inventory, disposals = {}, title = 'Regional waste inventory (kg)' }) {
  const data = WASTE_TYPES.map((type) => {
    let dispatched = 0
    let remaining = 0
    let disposed = 0
    for (const region of Object.values(inventory || {})) {
      dispatched += region?.[type]?.dispatchedQuantity || 0
      remaining += region?.[type]?.remainingQuantity || 0
    }
    for (const disposal of Object.values(disposals || {})) {
      if (disposal.wasteType === type) disposed += Number(disposal.amount || 0)
    }
    return { name: capitalize(type), Dispatched: Number(dispatched.toFixed(1)), Remaining: Number(remaining.toFixed(1)), Disposed: Number(disposed.toFixed(1)) }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Remaining" stackId="a" fill="#1FA971" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Dispatched" stackId="a" fill="#D98E28" radius={[6, 6, 0, 0]} />
          <Bar dataKey="Disposed" stackId="a" fill="#64748B" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
