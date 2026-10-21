import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import SmartBinCard from '../../components/SmartBinCard'
import SmartBinMap from '../../components/SmartBinMap'
import CreateBinModal from '../../components/CreateBinModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { listenToBins, deleteBin } from '../../services/binService'
import { binOverallStatus } from '../../utils/priority'
import { useToast } from '../../components/Toast'

const FILTERS = ['ALL', 'NORMAL', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function SmartBins() {
  const [bins, setBins] = useState({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => listenToBins(setBins), [])

  const filtered = useMemo(() => {
    return Object.values(bins).filter((bin) => {
      const status = binOverallStatus(bin.compartments)
      const matchesFilter = filter === 'ALL' || status === filter
      const query = search.toLowerCase()
      const matchesSearch =
        !query ||
        bin.binId?.toLowerCase().includes(query) ||
        bin.binName?.toLowerCase().includes(query) ||
        bin.region?.toLowerCase().includes(query)
      return matchesFilter && matchesSearch
    })
  }, [bins, search, filter])

  const handleDelete = async () => {
    try {
      await deleteBin(pendingDelete.binId)
      toast.success(`${pendingDelete.binId} deleted.`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete bin.')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              className="input pl-8"
              placeholder="Search by Bin ID, name or region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTERS.map((f) => (
              <option key={f} value={f}>{f === 'ALL' ? 'All statuses' : f}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-wastex-green text-white text-sm font-semibold hover:bg-wastex-greendark"
        >
          <Plus size={16} /> Add smart bin
        </button>
      </div>

      <SmartBinMap
        bins={Object.fromEntries(filtered.map((b) => [b.binId, b]))}
        height={320}
        onMarkerClick={(bin) => navigate(`/admin/simulator?bin=${bin.binId}`)}
      />

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
          No smart bins match your search. Try a different filter, or add a new bin.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bin) => (
            <SmartBinCard
              key={bin.binId}
              bin={bin}
              onSimulate={(b) => navigate(`/admin/simulator?bin=${b.binId}`)}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <CreateBinModal open={modalOpen} onClose={() => setModalOpen(false)} existingBins={bins} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.binId}?`}
        description="This permanently removes the smart bin record from Firebase. This cannot be undone."
        confirmLabel="Delete bin"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
