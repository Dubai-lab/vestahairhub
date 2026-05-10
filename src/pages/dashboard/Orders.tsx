import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, Package, Truck, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { useAuth }    from '@/context/AuthContext'
import { Badge }      from '@/components/ui/Badge'
import { Button }     from '@/components/ui/Button'
import { Spinner }    from '@/components/ui/Spinner'
import type { Order, OrderStatus } from '@/types'

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'gold' | 'green' | 'red' | 'blue' | 'gray'; Icon: React.ElementType }> = {
  pending_payment:   { label: 'Awaiting Payment',  variant: 'gray',  Icon: Clock },
  payment_submitted: { label: 'Payment Submitted', variant: 'blue',  Icon: Clock },
  payment_confirmed: { label: 'Confirmed',         variant: 'gold',  Icon: CheckCircle },
  processing:        { label: 'Processing',         variant: 'gold',  Icon: Package },
  shipped:           { label: 'Shipped',            variant: 'blue',  Icon: Truck },
  delivered:         { label: 'Delivered',          variant: 'green', Icon: CheckCircle },
  cancelled:         { label: 'Cancelled',          variant: 'red',   Icon: XCircle },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  payment_submitted: 'payment_confirmed',
  payment_confirmed: 'processing',
  processing:        'shipped',
  shipped:           'delivered',
}

export default function Orders() {
  const { user } = useAuth()
  const qc       = useQueryClient()

  const { data: shop } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('id').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shop!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as Order[]
    },
  })

  const advance = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      await supabase.from('orders').update({ status }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
        <p className="text-white/45 mt-1 text-sm">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="glass-dark rounded-2xl p-16 text-center text-white/30">
          No orders yet. Share your shop to start receiving orders.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status   = order.status as OrderStatus
            const cfg      = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending_payment
            const nextSt   = NEXT_STATUS[status]
            const nextCfg  = nextSt ? STATUS_CONFIG[nextSt] : null

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-dark rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-white/40 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-400 font-bold text-lg">₦{order.total_amount.toLocaleString()}</span>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </div>

                {/* Shipping info */}
                {order.shipping_name && (
                  <div className="text-sm text-white/50">
                    📦 {order.shipping_name} · {order.shipping_phone} · {order.shipping_city}, {order.shipping_country}
                  </div>
                )}

                {/* Payment proof */}
                {order.payment_reference && (
                  <div className="text-sm glass rounded-xl px-4 py-2.5 text-white/60">
                    Payment reference: <span className="text-brand-400 font-mono">{order.payment_reference}</span>
                  </div>
                )}

                {/* Actions */}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {nextCfg && nextSt && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<nextCfg.Icon size={14} />}
                        onClick={() => advance.mutate({ id: order.id, status: nextSt })}
                        isLoading={advance.isPending}
                      >
                        {order.status === 'payment_submitted' ? 'Confirm Payment' : `Mark as ${nextCfg.label}`}
                      </Button>
                    )}
                    {status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => cancel.mutate(order.id)}
                        isLoading={cancel.isPending}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
