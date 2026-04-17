import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, Wallet, Image as ImageIcon, Plus } from 'lucide-react'

const FloatingNav: React.FC = () => {
  const navigate = useNavigate()
  
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Inicio' },
    { to: '/plans', icon: Map, label: 'Planes' },
    { to: '/finances', icon: Wallet, label: 'Finanzas' },
    { to: '/gallery', icon: ImageIcon, label: 'Galería' },
  ]

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-surface-lowest rounded-full px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-outline-variant/20 flex items-center gap-6">
        
        {/* Left Nav Items */}
        {navItems.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all duration-300 w-12
              ${isActive ? 'text-primary scale-110' : 'text-on-surface/40 hover:text-on-surface/70'}
            `}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}

        {/* Central Action Button */}
        <button 
          onClick={() => navigate('/plans/new')}
          className="w-14 h-14 -my-7 bg-gradient-to-tr from-primary to-primary-container rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-10"
        >
          <Plus size={28} />
        </button>

        {/* Right Nav Items */}
        {navItems.slice(2, 4).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-all duration-300 w-12
              ${isActive ? 'text-primary scale-110' : 'text-on-surface/40 hover:text-on-surface/70'}
            `}
          >
            <Icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
          </NavLink>
        ))}

      </div>
    </nav>
  )
}

export default FloatingNav
