import { NavLink } from 'react-router-dom'
import { Recycle } from 'lucide-react'

export default function Sidebar({ items, roleLabel }) {
  return (
    <aside className="w-60 shrink-0 bg-navy-950 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-wastex-green/15 text-wastex-green flex items-center justify-center">
          <Recycle size={18} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">WasteX AI</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-wastex-green/15 text-wastex-green font-semibold' : 'hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/5 text-[10px] text-slate-600">
        AI-Enabled Smart Waste Segregation
        <br />& Resource Recovery System
      </div>
    </aside>
  )
}
