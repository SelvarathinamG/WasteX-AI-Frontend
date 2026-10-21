import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Recycle, MapPin } from 'lucide-react'
import { registerVendor } from '../services/vendorService'
import { validateVendorForm, isEmpty } from '../utils/validation'
import { WASTE_TYPES } from '../utils/priority'
import { capitalize } from '../utils/formatting'
import { useToast } from '../components/Toast'
import SmartBinMap from '../components/SmartBinMap'

const BUSINESS_TYPES = [
  { label: 'Plastic Recycler', wasteType: 'plastic' },
  { label: 'Paper Recycler', wasteType: 'paper' },
  { label: 'Metal Recycler', wasteType: 'metal' },
  { label: 'Biogas Station', wasteType: 'organic' }
]

export default function VendorRegister() {
  const [form, setForm] = useState({ businessName: '', username: '', password: '', businessType: '', location: '', latitude: '', longitude: '' })
  const [wasteTypes, setWasteTypes] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  const toggleType = (type) => {
    setWasteTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateVendorForm(form)
    if (wasteTypes.length === 0) validation.wasteTypes = 'Select at least one waste type you can process.'
    setErrors(validation)
    if (!isEmpty(validation)) return

    setSaving(true)
    try {
      await registerVendor({ ...form, wasteTypes })
      toast.success('Vendor account created. Redirecting to your dashboard…')
      navigate('/vendor/dashboard')
    } catch (err) {
      toast.error(mapError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleMapClick = (latitude, longitude) => {
    setSelectedPosition([latitude, longitude])
    setForm((previous) => ({ ...previous, latitude, longitude }))
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-wastex-green/15 text-wastex-green flex items-center justify-center mb-3">
            <Recycle size={26} />
          </div>
          <h1 className="text-white text-xl font-extrabold tracking-tight">Register as vendor</h1>
          <p className="text-slate-400 text-xs mt-1">Join WasteX AI's resource recovery network</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-navy-900 border border-white/5 rounded-2xl shadow-panel p-6 space-y-3">
          <Field label="Business name" error={errors.businessName}>
            <input className="dark-input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Username" error={errors.username}>
              <input className="dark-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input type="password" className="dark-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
          </div>
          <Field label="Business type" error={errors.businessType}>
            <select
              className="dark-input"
              value={form.businessType}
              onChange={(e) => {
                const selected = BUSINESS_TYPES.find((type) => type.label === e.target.value)
                setForm({ ...form, businessType: e.target.value })
                setWasteTypes(selected ? [selected.wasteType] : [])
              }}
            >
              <option value="">Select type…</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type.label} value={type.label}>{type.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input className="dark-input" placeholder="Industry area or address" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Mark industry on map</span>
              {selectedPosition && <span className="text-[11px] text-wastex-green flex items-center gap-1"><MapPin size={12} /> Location selected</span>}
            </div>
            <SmartBinMap center={[11.86, 79.76]} zoom={12} height={190} onMapClick={handleMapClick} selectedPosition={selectedPosition} />
            {errors.location && <p className="text-[11px] text-wastex-red mt-1">{errors.location}</p>}
          </div>
          <div>
            <span className="text-xs text-slate-400">Waste types you can process</span>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {WASTE_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => toggleType(type)}
                  disabled={Boolean(form.businessType)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    wasteTypes.includes(type)
                      ? 'bg-wastex-green text-white border-wastex-green'
                      : 'border-navy-700 text-slate-400 hover:border-wastex-green'
                  }`}
                >
                  {capitalize(type)}
                </button>
              ))}
            </div>
            {errors.wasteTypes && <p className="text-[11px] text-wastex-red mt-1">{errors.wasteTypes}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-wastex-green hover:bg-wastex-greendark text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? 'Creating account…' : 'Create vendor account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Already registered? <Link to="/login" className="text-wastex-green font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="text-[11px] text-wastex-red">{error}</span>}
    </label>
  )
}

function mapError(err) {
  if (err?.code === 'auth/email-already-in-use') return 'That username is already taken.'
  return err.message || 'Registration failed. Please try again.'
}
