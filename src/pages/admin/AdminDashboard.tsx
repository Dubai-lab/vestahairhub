import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Store, ShoppingBag, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending_payment:   'gray',
  payment_submitted: 'blue',
  payment_confirmed: 'gold',
  processing:        'gold',
  shipped:           'blue',
  delivered:         'green',
  cancelled:         'red',
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [profiles, shops, orders, revenue] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('shops').select('status'),
        supabase.from('orders').select('status, total_amount'),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
      ])
      const allProfiles  = profiles.data ?? []
      const allShops     = shops.data ?? []
      const allOrders    = orders.data ?? []

      return {
        totalUsers:       allProfiles.length,
        sellers:          allProfiles.filter(p => p.role === 'seller').length,
        buyers:           allProfiles.filter(p => p.role === 'buyer').length,
        activeShops:      allShops.filter(s => s.status === 'active').length,
        suspendedShops:   allShops.filter(s => s.status === 'suspended').length,
        totalOrders:      allOrders.length,
        deliveredOrders:  allOrders.filter(o => o.status === 'delivered').length,
        cancelledOrders:  allOrders.filter(o => o.status === 'cancelled').length,
        gmv:              (revenue.data ?? []).reduce((s, o) => s + o.total_amount, 0),
      }
    },
  })

  // Orders stuck in payment_submitted > 48 h — seller may be ignoring
  const { data: staleOrders = [] } = useQuery({
    queryKey: ['admin-stale-orders'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, payment_reference, created_at, shops(name)')
        .eq('status', 'payment_submitted')
        .lt('created_at', cutoff)
        .order('created_at', { ascending: true })
        .limit(10)
      return (data ?? []) as any[]
    },
  })

  // Recent orders
  const { data: recentOrders = [], isLoading: recentLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, shops(name)')
        .order('created_at', { ascending: false })
        .limit(10)
      return (data ?? []) as any[]
    },
  })

  const { data: pendingReports = 0 } = useQuery({
    queryKey: ['admin-report-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      return count ?? 0
    },
  })

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '—',
      sub:   `${stats?.sellers ?? 0} sellers · ${stats?.buyers ?? 0} buyers`,
      icon:  Users,
      color: 'text-blue-400',
      bg:    'bg-blue-500/8',
    },
    {
      label: 'Active Shops',
      value: stats?.activeShops ?? '—',
      sub:   stats?.suspendedShops ? `${stats.suspendedShops} suspended` : 'All active',
      icon:  Store,
      color: 'text-brand-400',
      bg:    'bg-brand-500/8',
    },
    {
      label: 'Total Orders',
      value: stats?.totalOrders ?? '—',
      sub:   `${stats?.deliveredOrders ?? 0} delivered · ${stats?.cancelledOrders ?? 0} cancelled`,
      icon:  ShoppingBag,
      color: 'text-purple-400',
      bg:    'bg-purple-500/8',
    },
    {
      label: 'Platform GMV',
      value: stats?.gmv != null ? `₦${stats.gmv.toLocaleString()}` : '—',
      sub:   'Sum of delivered orders',
      icon:  TrendingUp,
      color: 'text-green-400',
      bg:    'bg-green-500/8',
    },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Admin Overview</h1>
        <p className="text-white/40 text-sm mt-1">Platform health at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="glass-dark rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 uppercase tracking-wide">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={15} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/30 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Fraud alert: stale payments */}
      {staleOrders.length > 0 && (
        <div className="glass-dark rounded-2xl border border-amber-500/25 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/8 border-b border-amber-500/15">
            <AlertTriangle size={15} className="text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-400">
                {staleOrders.length} Stale Payment{staleOrders.length !== 1 ? 's' : ''} — Seller Not Responding
              </p>
              <p className="text-xs text-amber-400/60">In "Payment Submitted" for over 48 hours — possible scam</p>
            </div>
            <Link to="/admin/orders?status=payment_submitted"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 shrink-0">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {staleOrders.map((order: any) => {
              const hours = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 3600000)
              return (
                <div key={order.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-white/35">{(order.shops as any)?.name} · {hours}h waiting</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-400">₦{order.total_amount.toLocaleString()}</p>
                    <p className="text-xs text-white/30 font-mono">{order.payment_reference ?? 'no ref'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pending reports alert */}
      {pendingReports > 0 && (
        <Link to="/admin/reports"
          className="flex items-center gap-4 glass-dark rounded-2xl px-5 py-4 border border-red-500/20 hover:border-red-500/40 transition-colors">
          <div className="p-2 bg-red-500/10 rounded-xl">
            <AlertTriangle size={15} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">
              {pendingReports} Pending Report{pendingReports !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-white/40">Fraud reports awaiting review</p>
          </div>
          <ChevronRight size={15} className="text-white/30" />
        </Link>
      )}

      {/* Recent orders */}
      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white text-sm">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
            View all <ChevronRight size={11} />
          </Link>
        </div>
        {recentLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentOrders.map((order: any) => (
              <div key={order.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-white/35 truncate">{(order.shops as any)?.name}</p>
                </div>
                <p className="text-xs text-white/30 hidden sm:block">
                  {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={STATUS_BADGE[order.status] ?? 'gray'}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-sm font-bold text-brand-400">
                    ₦{order.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
