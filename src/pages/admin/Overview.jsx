import { useEffect, useMemo, useState } from 'react'
import { Trash2, AlertTriangle, Users, Truck, Store, Weight } from 'lucide-react'
import StatCard from '../../components/StatCard'
import SmartBinMap from '../../components/SmartBinMap'
import WasteChart from '../../components/WasteChart'
import InventoryChart from '../../components/InventoryChart'
import { listenToBins } from '../../services/binService'
import { listenToCollectors } from '../../services/collectorService'
import { listenToVehicles } from '../../services/vehicleService'
import { listenToVendors } from '../../services/vendorService'
import { listenToCollections, listenToInventory } from '../../services/collectionService'
import { binOverallStatus, WASTE_TYPES } from '../../utils/priority'
import { formatKg } from '../../utils/formatting'

export default function Overview() {
  const [bins, setBins] = useState({})
  const [collectors, setCollectors] = useState({})
  const [vehicles, setVehicles] = useState({})
  const [vendors, setVendors] = useState({})
  const [collections, setCollections] = useState({})
  const [inventory, setInventory] = useState({})

  useEffect(() => {
    const unsub = [
      listenToBins(setBins),
      listenToCollectors(setCollectors),
      listenToVehicles(setVehicles),
      listenToVendors(setVendors),
      listenToCollections(setCollections),
      listenToInventory(setInventory)
    ]
    return () => unsub.forEach((fn) => fn())
  }, [])

  const stats = useMemo(() => {
    const binList = Object.values(bins)
    const statuses = binList.map((b) => binOverallStatus(b.compartments))
    const totalWaste = binList.reduce(
      (sum, b) => sum + WASTE_TYPES.reduce((s, t) => s + (b.compartments?.[t]?.weight || 0), 0),
      0
    )
    const collectedToday = Object.values(collections).filter(
      (c) => new Date(c.collectedAt).toDateString() === new Date().toDateString()
    ).length

    return {
      totalBins: binList.length,
      critical: statuses.filter((s) => s === 'CRITICAL').length,
      high: statuses.filter((s) => s === 'HIGH').length,
      totalWaste,
      fleet: Object.keys(vehicles).length,
      collectors: Object.keys(collectors).length,
      vendors: Object.keys(vendors).length,
      collectedToday
    }
  }, [bins, vehicles, collectors, vendors, collections])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total smart bins" value={stats.totalBins} icon={Trash2} accent="navy" />
        <StatCard label="Critical bins" value={stats.critical} icon={AlertTriangle} accent="red" />
        <StatCard label="High priority bins" value={stats.high} icon={AlertTriangle} accent="orange" />
        <StatCard label="Total waste" value={formatKg(stats.totalWaste)} icon={Weight} accent="green" />
        <StatCard label="Fleet vehicles" value={stats.fleet} icon={Truck} accent="navy" />
        <StatCard label="Collectors" value={stats.collectors} icon={Users} accent="navy" />
        <StatCard label="Vendors" value={stats.vendors} icon={Store} accent="navy" />
        <StatCard label="Collected today" value={stats.collectedToday} icon={Trash2} accent="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WasteChart bins={bins} />
        <InventoryChart inventory={inventory} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Live operations map · bins, collectors and vendor industries</p>
        <SmartBinMap bins={bins} vehicles={vehicles} vendors={vendors} height={380} />
      </div>
    </div>
  )
}
