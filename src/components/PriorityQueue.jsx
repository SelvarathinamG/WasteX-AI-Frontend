import { PackageCheck, Truck } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { formatKg, formatPercent } from '../utils/formatting'
import { EmptyState } from './CollectorTable'

const NEXT_STATUS = {
  PENDING: 'DISPATCHED',
  DISPATCHED: 'IN_TRANSIT',
  IN_TRANSIT: 'ARRIVED',
  ARRIVED: 'COLLECTING'
}

const NEXT_LABEL = {
  PENDING: 'Dispatch vehicle',
  DISPATCHED: 'Mark in transit',
  IN_TRANSIT: 'Mark arrived',
  ARRIVED: 'Start collecting'
}

export default function PriorityQueue({ jobs, onAdvance, onCollect }) {
  if (!jobs || jobs.length === 0) {
    return <EmptyState message="No jobs in your queue right now — every bin in your class is under control." />
  }

  return (
    <div className="space-y-3">
      {jobs.map((job, idx) => (
        <div key={job.binId} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {job.routeOrder || idx + 1}
          </div>
          <div className="flex-1 min-w-[160px]">
            <p className="font-semibold text-slate-800 text-sm">{job.binName}</p>
            <p className="text-xs text-slate-400">{job.region} &middot; {job.binId}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Fill</p>
            <p className="font-mono font-semibold text-sm">{formatPercent(job.fill)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Weight</p>
            <p className="font-mono font-semibold text-sm">{formatKg(job.weight)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Priority score</p>
            <p className="font-mono font-semibold text-sm text-wastex-green">{job.score.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400">From last stop</p>
            <p className="font-mono font-semibold text-sm">{job.distanceKm ?? 0} km</p>
          </div>
          <StatusBadge status={job.status} />
          <StatusBadge status={job.collectionStatus} />

          <div className="flex gap-2 ml-auto">
            {NEXT_STATUS[job.collectionStatus] && (
              <button
                onClick={() => onAdvance(job, NEXT_STATUS[job.collectionStatus])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Truck size={13} /> {NEXT_LABEL[job.collectionStatus]}
              </button>
            )}
            {job.collectionStatus === 'COLLECTING' && (
              <button
                onClick={() => onCollect(job)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wastex-green text-white text-xs font-semibold hover:bg-wastex-greendark"
              >
                <PackageCheck size={13} /> Collect
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
