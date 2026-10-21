import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import CollectorTable from '../../components/CollectorTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import { listenToCollectors, createCollector, deleteCollector } from '../../services/collectorService'
import { listenToVehicles } from '../../services/vehicleService'
import { validateCollectorForm, isEmpty } from '../../utils/validation'
import { WASTE_TYPES } from '../../utils/priority'
import { capitalize } from '../../utils/formatting'
import { useToast } from '../../components/Toast'

const emptyForm = { fullName: '', username: '', password: '', wasteClass: '', vehicleId: '' }

export default function Collectors() {
  const [collectors, setCollectors] = useState({})
  const [vehicles, setVehicles] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const unsub = [listenToCollectors(setCollectors), listenToVehicles(setVehicles)]
    return () => unsub.forEach((fn) => fn())
  }, [])

  const availableVehicles = Object.values(vehicles).filter(
    (v) => !form.wasteClass || v.wasteClass === form.wasteClass
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateCollectorForm(form)
    setErrors(validation)
    if (!isEmpty(validation)) return

    setSaving(true)
    try {
      await createCollector(form)
      toast.success(`Collector account created for ${form.fullName}.`)
      setForm(emptyForm)
      setModalOpen(false)
    } catch (err) {
      toast.error(mapError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCollector(pendingDelete.collectorId)
      toast.success(`Removed collector ${pendingDelete.name}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to remove collector.')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-wastex-green text-white text-sm font-semibold hover:bg-wastex-greendark"
        >
          <Plus size={16} /> Create collector
        </button>
      </div>

      <CollectorTable collectors={collectors} vehicles={vehicles} onDelete={setPendingDelete} />

      {modalOpen && (
        <div className="fixed inset-0 z-[998] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Create collector</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <Field label="Full name" error={errors.fullName}>
                <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Username" error={errors.username}>
                  <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </Field>
                <Field label="Password" error={errors.password}>
                  <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </Field>
              </div>
              <Field label="Waste class" error={errors.wasteClass}>
                <select
                  className="input"
                  value={form.wasteClass}
                  onChange={(e) => setForm({ ...form, wasteClass: e.target.value, vehicleId: '' })}
                >
                  <option value="">Select waste class…</option>
                  {WASTE_TYPES.map((t) => (
                    <option key={t} value={t}>{capitalize(t)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Vehicle" error={errors.vehicleId}>
                <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle…</option>
                  {availableVehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId} disabled={Boolean(v.collectorId)}>
                      {v.vehicleId} {v.collectorId ? '(already assigned)' : ''}
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">No vehicles for this waste class yet — add one under Fleet.</p>
                )}
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-wastex-green hover:bg-wastex-greendark text-white text-sm font-semibold py-2.5 rounded-lg mt-2 disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create collector account'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Remove ${pendingDelete?.name}?`}
        description="This removes their profile and vehicle assignment from Firebase."
        confirmLabel="Remove collector"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
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

function mapError(err) {
  if (err?.code === 'auth/email-already-in-use') return 'That username is already taken.'
  return err.message || 'Failed to create collector.'
}
