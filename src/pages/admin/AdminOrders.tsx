import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Search, ChevronDown, ChevronUp, MapPin, CreditCard, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

const STATUS_LIST = [
  'all', 'pending_payment', 'payment_submitted', 'payment_confirmed',
  'processing', 'shipped', 'delivered', 'cancelled',
]

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending_payment:   'gray',
  payment_submitted: 'blue',
  payment_confirmed: 'gold',
  processing:        'gold',
  shipped:           'blue',
  delivered:         'green',
  cancelled:         'red',
}

export default function AdminOrders() {
  const [urlParams] = useSearchParams()
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') ?? 'all')
  const [expanded,     setExpanded]     = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-all-orders', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*, shops(name, slug), order_items(product_name, quantity, unit_price, product_image)')
        .order('created_at', { ascending: false })
        .limit(300)
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return (data ?? []) as any[]
    },
  })

  const filtered = orders.filter((o: any) =>
    !search ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    (o.shops?.name  ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.shipping_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (o.payment_reference ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">All Orders</h1>
        <p className="text-white/40 text-sm mt-1">Platform-wide order traffic — click a row to expand</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Order ID, shop name, buyer name, ref…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_LIST.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >
              {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>

      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">No orders found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((order: any) => {
              const isOpen  = expanded === order.id
              const staleMs = Date.now() - new Date(order.created_at).getTime()
              const isStale = order.status === 'payment_submitted' && staleMs > 48 * 3600 * 1000
              const hours   = Math.floor(staleMs / 3600000)

              return (
                <div key={order.id} className={isStale ? 'border-l-[3px] border-amber-500' : ''}>
                  {/* Row header — click to expand */}
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium text-white">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {isStale && (
                          <span className="text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">
                            ⚠ Stale {hours}h
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/35 mt-0.5">
                        {order.shops?.name} · {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={STATUS_BADGE[order.status] ?? 'gray'}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-bold text-brand-400">
                        ₦{order.total_amount.toLocaleString()}
                      </span>
                      {isOpen
                        ? <ChevronUp size={14} className="text-white/30" />
                        : <ChevronDown size={14} className="text-white/30" />
                      }
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-4 border-t border-white/5 space-y-4 bg-white/[0.01]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Shipping */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                            <MapPin size={10} /> Shipping
                          </p>
                          <p className="text-sm font-medium text-white">{order.shipping_name ?? '—'}</p>
                          <p className="text-xs text-white/50">{order.shipping_phone ?? '—'}</p>
                          <p className="text-xs text-white/40">
                            {[order.shipping_address, order.shipping_city, order.shipping_country]
                              .filter(Boolean).join(', ') || '—'}
                          </p>
                          {order.notes && (
                            <p className="text-xs text-white/30 italic">"{order.notes}"</p>
                          )}
                        </div>

                        {/* Payment */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                            <CreditCard size={10} /> Payment
                          </p>
                          <p className="text-sm font-medium text-white capitalize">
                            {order.payment_method?.replace(/_/g, ' ') ?? '—'}
                          </p>
                          <p className="text-xs text-brand-400 font-mono">
                            {order.payment_reference ?? 'No reference provided'}
                          </p>
                          {order.payment_proof_url && (
                            <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline">
                              View proof →
                            </a>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                            <Package size={10} /> Items ({order.order_items?.length ?? 0})
                          </p>
                          {order.order_items?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              {item.product_image && (
                                <img src={item.product_image} alt=""
                                  className="w-7 h-7 rounded-lg object-cover shrink-0 bg-space-700" />
                              )}
                              <p className="text-xs text-white/60">
                                {item.product_name} × {item.quantity}
                                <span className="text-white/30 ml-1">₦{item.unit_price.toLocaleString()}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
