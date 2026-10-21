import { Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Trash2, Users, Truck, Store, Package, SlidersHorizontal } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/smart-bins', label: 'Smart bins', icon: Trash2 },
  { to: '/admin/simulator', label: '2D simulator', icon: SlidersHorizontal },
  { to: '/admin/collectors', label: 'Collectors', icon: Users },
  { to: '/admin/fleet', label: 'Fleet', icon: Truck },
  { to: '/admin/vendors', label: 'Vendors', icon: Store },
  { to: '/admin/inventory', label: 'Waste inventory', icon: Package }
]

const TITLES = {
  '/admin': ['Command center overview', 'Live municipal waste operations'],
  '/admin/smart-bins': ['Smart bin management', 'Create, monitor and retire smart bins'],
  '/admin/simulator': ['2D digital-twin simulator', 'Drive sensor values before real IoT hardware arrives'],
  '/admin/collectors': ['Collector accounts', 'Create and manage waste-class collectors'],
  '/admin/fleet': ['Vehicle fleet', 'Assign vehicles to collectors by waste class'],
  '/admin/vendors': ['Vendor directory', 'Registered recycling and recovery partners'],
  '/admin/inventory': ['Resource recovery inventory', 'Regional waste availability and dispatch']
}

export default function AdminDashboard() {
  const location = useLocation()
  const [title, subtitle] = TITLES[location.pathname] || TITLES['/admin']

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Sidebar items={NAV_ITEMS} roleLabel="Municipal Admin" />
      <div className="flex-1 min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
