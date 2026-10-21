import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import BinSimulator from '../../components/BinSimulator'
import { listenToBins } from '../../services/binService'
import { listenToSimulationState } from '../../services/simulationService'

export default function Simulator() {
  const [bins, setBins] = useState({})
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('bin') || ''
  const [simState, setSimState] = useState(null)

  useEffect(() => listenToBins(setBins), [])

  useEffect(() => {
    if (!selectedId) return
    return listenToSimulationState(selectedId, setSimState)
  }, [selectedId])

  const bin = bins[selectedId]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600 shrink-0">Select smart bin</label>
        <select
          className="input max-w-xs"
          value={selectedId}
          onChange={(e) => setSearchParams(e.target.value ? { bin: e.target.value } : {})}
        >
          <option value="">Choose a bin…</option>
          {Object.values(bins).map((b) => (
            <option key={b.binId} value={b.binId}>{b.binId} — {b.binName}</option>
          ))}
        </select>
      </div>

      <BinSimulator bin={bin} simulationState={simState} />
    </div>
  )
}
