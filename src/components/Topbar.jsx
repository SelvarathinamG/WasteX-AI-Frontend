import { LogOut, Wifi } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar({ title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-wastex-green font-medium">
          <Wifi size={14} />
          Live
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
            {(user?.fullName || user?.businessName || user?.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-xs">
            <p className="font-semibold text-slate-700 leading-none">{user?.fullName || user?.businessName || user?.username}</p>
            <p className="text-slate-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
          <button onClick={handleLogout} title="Sign out" className="ml-2 p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-wastex-red">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
