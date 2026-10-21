import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import VehicleTable from '../../components/VehicleTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import { listenToVehicles, createVehicle, deleteVehicle } from '../../services/vehicleService'
import { listenToCollectors } from '../../services/collectorService'
import { validateVehicleForm, isEmpty } from '../../utils/validation'
import { WASTE_TYPES } from '../../utils/priority'
import { capitalize } from '../../utils/formatting'
import { useToast } from '../../components/Toast'

const emptyForm = { vehicleId: '', vehicleName: '', vehicleType: 'Compactor Truck', wasteClass: '', capacity: 500 }

export default function Fleet() {
  const [vehicles, setVehicles] = useState({})
  const [collectors, setCollectors] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const toast = useToast()

  useEffect(() => {
    const unsub = [listenToVehicles(setVehicles), listenToCollectors(setCollectors)]
    return () => unsub.forEach((fn) => fn())
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateVehicleForm(form)
    if (vehicles[form.vehicleId]) validation.vehicleId = 'A vehicle with this ID already exists.'
    setErrors(validation)
    if (!isEmpty(validation)) return

    setSaving(true)
    try {
      await createVehicle(form)
      toast.success(`Vehicle ${form.vehicleId} added to fleet.`)
      setForm(emptyForm)
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message || 'Failed to create vehicle.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteVehicle(pendingDelete.vehicleId)
      toast.success(`${pendingDelete.vehicleId} removed from fleet.`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete vehicle.')
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
          <Plus size={16} /> Add vehicle
        </button>
      </div>

      <VehicleTable vehicles={vehicles} collectors={collectors} onDelete={setPendingDelete} />

      {modalOpen && (
        <div className="fixed inset-0 z-[998] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Add vehicle</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <Field label="Vehicle ID" error={errors.vehicleId}>
                <input className="input" placeholder="PLASTIC-02" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Vehicle name" error={errors.vehicleName}>
                <input className="input" value={form.vehicleName} onChange={(e) => setForm({ ...form, vehicleName: e.target.value })} />
              </Field>
              <Field label="Vehicle type">
                <input className="input" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
              </Field>
              <Field label="Waste class" error={errors.wasteClass}>
                <select className="input" value={form.wasteClass} onChange={(e) => setForm({ ...form, wasteClass: e.target.value })}>
                  <option value="">Select waste class…</option>
                  {WASTE_TYPES.map((t) => (
                    <option key={t} value={t}>{capitalize(t)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Capacity (kg)" error={errors.capacity}>
                <input type="number" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-wastex-green hover:bg-wastex-greendark text-white text-sm font-semibold py-2.5 rounded-lg mt-2 disabled:opacity-60"
              >
                {saving ? 'Adding…' : 'Add vehicle'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Remove ${pendingDelete?.vehicleId}?`}
        confirmLabel="Remove vehicle"
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
