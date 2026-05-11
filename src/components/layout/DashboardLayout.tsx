import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Settings, CreditCard,
  MessageSquare, Menu, X, LogOut, ChevronRight, Shield,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }  from '@/context/AuthContext'
import { Button }   from '@/components/ui/Button'
import logoSrc      from '@images/logo.png'

const navItems = [
  { to: '/dashboard',           label: 'Overview',         Icon: LayoutDashboard, end: true },
  { to: '/dashboard/products',  label: 'Products',         Icon: Package },
  { to: '/dashboard/orders',    label: 'Orders',           Icon: ShoppingCart },
  { to: '/dashboard/messages',  label: 'Messages',         Icon: MessageSquare },
  { to: '/dashboard/payments',  label: 'Payment Methods',  Icon: CreditCard },
  { to: '/dashboard/settings',  label: 'Shop Settings',    Icon: Settings },
  { to: '/dashboard/kyc',       label: 'KYC Verification', Icon: Shield },
]

export function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const navigate              = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const Sidebar = (
    <aside className="flex flex-col h-full bg-space-800 border-r border-white/5">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link to="/">
          <img src={logoSrc} alt="VestaHairHub" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Profile pill */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-900/30">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
            {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Seller'}</p>
            <p className="text-[11px] text-brand-400">Seller Account</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex items-center gap-3">
                  <Icon size={17} />
                  {label}
                </span>
                {isActive && <ChevronRight size={14} className="text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <Link
          to="/marketplace"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          View Marketplace
        </Link>
        <button
          onClick={() => { signOut(); navigate('/') }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-space-900 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-64 shrink-0 fixed inset-y-0 left-0 z-40">
        {Sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              {Sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-space-800 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-white/60 hover:text-white">
            <Menu size={20} />
          </button>
          <img src={logoSrc} alt="VestaHairHub" className="h-7 w-auto" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
