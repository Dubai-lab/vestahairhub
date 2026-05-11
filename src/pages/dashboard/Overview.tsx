import { useQuery } from '@tanstack/react-query'
import { Package, ShoppingCart, TrendingUp, Clock, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth }         from '@/context/AuthContext'
import { supabase }        from '@/lib/supabase'
import { Spinner }         from '@/components/ui/Spinner'
import { Badge }           from '@/components/ui/Badge'
import { formatPrice }     from '@/lib/currencies'
import type { Order }      from '@/types'

const ORDER_STATUS_BADGE: Record<string, { label: string; variant: 'gold' | 'green' | 'red' | 'blue' | 'gray' }> = {
  pending_payment:    { label: 'Awaiting Payment', variant: 'gray' },
  payment_submitted:  { label: 'Payment Submitted', variant: 'blue' },
  payment_confirmed:  { label: 'Payment Confirmed', variant: 'gold' },
  processing:         { label: 'Processing',        variant: 'gold' },
  shipped:            { label: 'Shipped',            variant: 'blue' },
  delivered:          { label: 'Delivered',          variant: 'green' },
  cancelled:          { label: 'Cancelled',          variant: 'red' },
}

export default function Overview() {
  const { user } = useAuth()

  const { data: shop } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('seller_id', user!.id)
        .maybeSingle()
      return data
    },
  })

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const [{ count: products }, { count: orders }, { data: recentOrders }, { data: salesRows }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', shop!.id),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop!.id),
        supabase.from('orders').select('*, order_items(*)').eq('shop_id', shop!.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount').eq('shop_id', shop!.id).neq('status', 'cancelled'),
      ])
      const totalSales = (salesRows ?? []).reduce((sum, o) => sum + (o.total_amount ?? 0), 0)
      return { products: products ?? 0, orders: orders ?? 0, recentOrders: recentOrders ?? [], totalSales }
    },
  })

  const STAT_CARDS = [
    { label: 'Total Sales',    value: formatPrice(stats?.totalSales ?? 0, shop?.currency), Icon: DollarSign,   color: 'text-brand-400',   bg: 'bg-brand-400/10'   },
    { label: 'Total Products', value: stats?.products ?? 0,                                Icon: Package,      color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
    { label: 'Total Orders',   value: stats?.orders ?? 0,                                  Icon: ShoppingCart, color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
    { label: 'Pending Review', value: (stats?.recentOrders as Order[])?.filter((o) => o.status === 'payment_submitted').length ?? 0, Icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Active Shop',    value: shop ? 1 : 0,                                        Icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-white/45 mt-1">
          {shop ? `Managing: ${shop.name}` : 'Welcome! Set up your shop to start selling.'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAT_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-dark rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.Icon size={20} className={card.color} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{card.value}</div>
                  <div className="text-xs text-white/40 mt-0.5">{card.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="glass-dark rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Recent Orders</h2>
            </div>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="divide-y divide-white/5">
                {(stats.recentOrders as Order[]).map((order) => {
                  const badge = ORDER_STATUS_BADGE[order.status] ?? { label: order.status, variant: 'gray' as const }
                  return (
                    <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-white/40 mt-0.5">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-brand-400">
                          ₦{order.total_amount.toLocaleString()}
                        </span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-white/30 text-sm">
                No orders yet. Share your shop link to start receiving orders.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
