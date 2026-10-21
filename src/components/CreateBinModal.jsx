import { useState } from 'react'
import { X, MapPin } from 'lucide-react'
import SmartBinMap from './SmartBinMap'
import { validateBinForm, isEmpty } from '../utils/validation'
import { createBin } from '../services/binService'
import { useToast } from './Toast'

const REGION_CENTER = [11.86, 79.76]

export default function CreateBinModal({ open, onClose, existingBins }) {
  const toast = useToast()
  const [form, setForm] = useState({ binId: '', binName: '', region: '', status: 'ACTIVE' })
  const [position, setPosition] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng])
    setErrors((e) => ({ ...e, latitude: null, longitude: null }))
  }

  const reset = () => {
    setForm({ binId: '', binName: '', region: '', status: 'ACTIVE' })
    setPosition(null)
    setErrors({})
  }

  const handleSubmit = async () => {
    const payload = {
      ...form,
      latitude: position?.[0] ?? null,
      longitude: position?.[1] ?? null
    }
    const validation = validateBinForm(payload)
    if (existingBins?.[form.binId]) validation.binId = 'A bin with this ID already exists.'
    setErrors(validation)
    if (!isEmpty(validation)) return

    setSaving(true)
    try {
      await createBin(payload)
      toast.success(`Smart bin ${form.binId} created and saved to Firebase.`)
      reset()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create smart bin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[998] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-800">Create smart bin</h2>
          <button onClick={() => { reset(); onClose() }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <MapPin size={14} className="text-wastex-green" />
              Click on the map to select the smart-bin location
            </div>
            <SmartBinMap center={REGION_CENTER} zoom={12} height={280} onMapClick={handleMapClick} selectedPosition={position} />
            <div className="flex gap-4 mt-2 text-xs text-slate-500 font-mono">
              <span>Latitude: {position ? position[0].toFixed(6) : '—'}</span>
              <span>Longitude: {position ? position[1].toFixed(6) : '—'}</span>
            </div>
            {(errors.latitude || errors.longitude) && (
              <p className="text-xs text-wastex-red mt-1">{errors.latitude || errors.longitude}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Bin ID" error={errors.binId}>
              <input
                className="input"
                placeholder="BIN007"
                value={form.binId}
                onChange={(e) => setForm({ ...form, binId: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Bin name" error={errors.binName}>
              <input
                className="input"
                placeholder="Gandhi Road Junction"
                value={form.binName}
                onChange={(e) => setForm({ ...form, binName: e.target.value })}
              />
            </Field>
            <Field label="Region" error={errors.region}>
              <input
                className="input"
                placeholder="Muthialpet"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
          <button onClick={() => { reset(); onClose() }} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-wastex-green text-white font-medium hover:bg-wastex-greendark disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create smart bin'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-[11px] text-wastex-red">{error}</span>}
    </label>
  )
}
