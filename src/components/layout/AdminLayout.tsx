import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Store, ShoppingBag, Package, Flag, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { to: '/admin',           label: 'Overview',  icon: LayoutDashboard, end: true },
  { to: '/admin/users',     label: 'Users',     icon: Users },
  { to: '/admin/shops',     label: 'Shops',     icon: Store },
  { to: '/admin/orders',    label: 'Orders',    icon: ShoppingBag },
  { to: '/admin/products',  label: 'Products',  icon: Package },
  { to: '/admin/reports',   label: 'Reports',   icon: Flag },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-space-950">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-white/5 flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Shield size={15} className="text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Admin Panel</p>
              <p className="text-[10px] text-white/30">VestaHairHub</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-white/45 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + signout */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-500/25 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-[10px] text-white/30">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => { signOut(); navigate('/auth/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
