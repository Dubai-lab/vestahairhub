import { useAuth }  from '@/context/AuthContext'
import { Link }     from 'react-router-dom'
import { User, ShoppingCart, Settings, LayoutDashboard, MessageSquare } from 'lucide-react'

export default function AccountPage() {
  const { profile, isLoading } = useAuth()
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin'

  const cards = [
    { label: 'My Orders',  Icon: ShoppingCart,    to: '/account/orders',    sub: 'Track your purchases' },
    { label: 'Messages',   Icon: MessageSquare,   to: '/messages',          sub: 'Chat with sellers' },
    { label: 'Profile',    Icon: User,             to: '/account/profile',   sub: 'Manage your details' },
    { label: 'Settings',   Icon: Settings,         to: '/account/settings',  sub: 'Account preferences' },
    ...(isSeller ? [{ label: 'My Dashboard', Icon: LayoutDashboard, to: '/dashboard', sub: 'Manage your shop & products' }] : []),
  ]

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-white mb-2">My Account</h1>
      <p className="text-white/45 mb-8">
        {isLoading
          ? 'Welcome back!'
          : `Welcome back, ${profile?.full_name?.split(' ')[0] ?? 'there'}!`
        }
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, Icon, to, sub }) => (
          <Link
            key={label}
            to={to}
            className="glass-dark rounded-2xl p-6 flex flex-col gap-3 border border-white/5 hover:border-brand-500/30 transition-all hover:-translate-y-1 duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <Icon size={22} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{label}</p>
              <p className="text-xs text-white/40 mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
