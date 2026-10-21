import { useEffect, useRef, useState } from 'react'
import { Play, Square, Thermometer, Droplets, Wind } from 'lucide-react'
import { WASTE_TYPES, fillStatus, STATUS_COLOR } from '../utils/priority'
import { capitalize, formatKg, formatPercent } from '../utils/formatting'
import { applyCompartmentValues, setSimulationRunning, tickSimulation, SIM_SPEEDS } from '../services/simulationService'
import { useToast } from './Toast'

const COMPARTMENT_COLORS = {
  plastic: '#2563EB',
  paper: '#9333EA',
  metal: '#64748B',
  organic: '#1FA971'
}

export default function BinSimulator({ bin, simulationState }) {
  const toast = useToast()
  const [drafts, setDrafts] = useState({})
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!bin) return
    const next = {}
    for (const type of WASTE_TYPES) {
      next[type] = {
        fill: bin.compartments?.[type]?.fill ?? 0,
        weight: bin.compartments?.[type]?.weight ?? 0
      }
    }
    setDrafts(next)
  }, [bin?.binId])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (simulationState?.running && bin) {
      const delay = SIM_SPEEDS[simulationState.speed] || SIM_SPEEDS.normal
      intervalRef.current = setInterval(() => {
        tickSimulation(bin.binId).catch(() => {})
      }, delay)
    }
    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [simulationState?.running, simulationState?.speed, bin?.binId])

  if (!bin) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
        Select a smart bin above to open its digital twin.
      </div>
    )
  }

  const setDraft = (type, key, value) => {
    setDrafts((d) => ({ ...d, [type]: { ...d[type], [key]: value } }))
  }

  const apply = async (type) => {
    try {
      await applyCompartmentValues(bin.binId, type, drafts[type])
      toast.success(`${capitalize(type)} compartment updated in Firebase.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update compartment.')
    }
  }

  const toggleAuto = async (speed) => {
    try {
      await setSimulationRunning(bin.binId, !simulationState?.running, speed || simulationState?.speed || 'normal')
    } catch (err) {
      toast.error(err.message || 'Failed to toggle simulation.')
    }
  }

  const organic = bin.compartments?.organic || {}

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div>
          <p className="font-bold text-slate-800">{bin.binName}</p>
          <p className="text-xs text-slate-400">{bin.binId} &middot; {bin.region}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input !py-1.5 !text-xs w-28"
            value={simulationState?.speed || 'normal'}
            onChange={(e) => setSimulationRunning(bin.binId, simulationState?.running || false, e.target.value)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
          <button
            onClick={() => toggleAuto()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              simulationState?.running ? 'bg-red-50 text-wastex-red' : 'bg-emerald-50 text-wastex-green'
            }`}
          >
            {simulationState?.running ? <Square size={12} /> : <Play size={12} />}
            {simulationState?.running ? 'Stop auto simulation' : 'Start auto simulation'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 p-5">
        {WASTE_TYPES.map((type) => {
          const draft = drafts[type] || { fill: 0, weight: 0 }
          const status = fillStatus(draft.fill)
          return (
            <div key={type} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-slate-700">{capitalize(type)}</span>
                <span className="text-[11px] font-bold" style={{ color: STATUS_COLOR[status] }}>{status}</span>
              </div>

              {/* 2D vessel visualization */}
              <div className="relative w-16 h-24 mx-auto mb-3 border-2 border-slate-300 rounded-b-lg rounded-t-sm overflow-hidden bg-slate-50">
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                  style={{ height: `${Math.min(draft.fill, 100)}%`, background: COMPARTMENT_COLORS[type], opacity: 0.85 }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold text-slate-700 mix-blend-difference text-white">
                  {formatPercent(draft.fill)}
                </span>
              </div>

              <label className="text-[11px] text-slate-500">Fill percentage</label>
              <input
                type="range"
                min="0"
                max="100"
                value={draft.fill}
                onChange={(e) => setDraft(type, 'fill', Number(e.target.value))}
                className="w-full accent-wastex-green"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  className="input !py-1 !text-xs w-20"
                  value={draft.fill}
                  onChange={(e) => setDraft(type, 'fill', Number(e.target.value))}
                />
                <label className="text-[11px] text-slate-500 ml-auto">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input !py-1 !text-xs w-20"
                  value={draft.weight}
                  onChange={(e) => setDraft(type, 'weight', Number(e.target.value))}
                />
              </div>

              <button
                onClick={() => apply(type)}
                className="w-full mt-3 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800"
              >
                Apply values
              </button>
            </div>
          )
        })}
      </div>

      <div className="px-5 pb-5">
        <p className="text-xs font-semibold text-slate-500 mb-2">Simulated organic sensor readings (DHT22 / MQ135)</p>
        <div className="grid grid-cols-3 gap-3">
          <SensorTile icon={Thermometer} label="Temperature" value={`${organic.temperature ?? '—'} °C`} />
          <SensorTile icon={Droplets} label="Humidity" value={`${organic.humidity ?? '—'} %`} />
          <SensorTile icon={Wind} label="Gas level" value={`${organic.gasLevel ?? '—'} ppm`} />
        </div>
      </div>
    </div>
  )
}

function SensorTile({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
      <Icon size={16} className="text-wastex-green" />
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-sm font-mono font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  )
}
