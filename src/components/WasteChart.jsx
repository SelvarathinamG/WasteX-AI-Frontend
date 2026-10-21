import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { WASTE_TYPES } from '../utils/priority'
import { capitalize } from '../utils/formatting'

const COLORS = { plastic: '#2563EB', paper: '#9333EA', metal: '#64748B', organic: '#1FA971' }

export default function WasteChart({ bins }) {
  const data = WASTE_TYPES.map((type) => {
    const totalWeight = Object.values(bins || {}).reduce((sum, bin) => sum + (bin.compartments?.[type]?.weight || 0), 0)
    return { name: capitalize(type), weight: Number(totalWeight.toFixed(1)) }
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-3">Waste by category (current, kg)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
          <Bar dataKey="weight" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={COLORS[d.name.toLowerCase()]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
