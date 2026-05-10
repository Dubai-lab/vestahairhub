import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, CheckCircle, X, Loader2, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Badge }    from '@/components/ui/Badge'
import { Spinner }  from '@/components/ui/Spinner'
import { Button }   from '@/components/ui/Button'
import type { Order, OrderStatus } from '@/types'

/* ── Types ── */
type OrderItem = {
  id:            string
  product_id:    string
  product_name:  string
  product_image: string | null
  quantity:      number
  unit_price:    number
}

type FullOrder = Order & {
  shops:       { name: string; slug: string } | null
  order_items: OrderItem[]
}

/* ── Status config ── */
const STATUS_BADGE: Record<OrderStatus, { label: string; variant: 'gold' | 'green' | 'red' | 'blue' | 'gray' }> = {
  pending_payment:   { label: 'Awaiting Payment',  variant: 'gray' },
  payment_submitted: { label: 'Payment Submitted', variant: 'blue' },
  payment_confirmed: { label: 'Confirmed',         variant: 'gold' },
  processing:        { label: 'Processing',        variant: 'gold' },
  shipped:           { label: 'Shipped',           variant: 'blue' },
  delivered:         { label: 'Delivered',         variant: 'green' },
  cancelled:         { label: 'Cancelled',         variant: 'red'  },
}

const STATUS_STEPS: OrderStatus[] = [
  'payment_submitted', 'payment_confirmed', 'processing', 'shipped', 'delivered',
]

/* ── Star row ── */
function StarRow({ rating, size = 16, interactive = false, onRate }: {
  rating: number; size?: number; interactive?: boolean; onRate?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const effective = hovered || rating
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type={interactive ? 'button' : undefined} disabled={!interactive}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star size={size} className={`transition-colors ${
            i <= effective ? 'fill-brand-400 text-brand-400' : 'fill-transparent text-white/20'
          }`} />
        </button>
      ))}
    </div>
  )
}

/* ── Review modal ── */
interface ReviewTarget { productId: string; productName: string; existingRating?: number; existingComment?: string; existingReviewId?: string }

function ReviewModal({ target, onClose }: { target: ReviewTarget; onClose: () => void }) {
  const { user }  = useAuth()
  const qc        = useQueryClient()
  const [rating,  setRating]  = useState(target.existingRating ?? 0)
  const [comment, setComment] = useState(target.existingComment ?? '')
  const [ratingErr, setRatingErr] = useState(false)

  const submit = useMutation({
    mutationFn: async () => {
      if (!rating) { setRatingErr(true); return }
      setRatingErr(false)
      if (target.existingReviewId) {
        await supabase.from('reviews').update({ rating, comment: comment || null }).eq('id', target.existingReviewId)
      } else {
        await supabase.from('reviews').insert({ buyer_id: user!.id, product_id: target.productId, rating, comment: comment || null })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reviews', user?.id] })
      qc.invalidateQueries({ queryKey: ['reviews', target.productId] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold text-white">
            {target.existingReviewId ? 'Update your review' : 'Rate this product'}
          </p>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-brand-400 font-medium mb-4 truncate">{target.productName}</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/50">Your rating</label>
            <StarRow rating={rating} size={32} interactive onRate={setRating} />
            {ratingErr && <p className="text-xs text-red-400">Please select a star rating.</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/50">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Share your experience with this product…"
              className="w-full bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button isLoading={submit.isPending} onClick={() => submit.mutate()} className="flex-1">
              {target.existingReviewId ? 'Update Review' : 'Submit Review'}
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Progress timeline ── */
function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'pending_payment') return null
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((s, i) => {
        const done    = i <= currentIdx
        const current = i === currentIdx
        const label   = s === 'payment_submitted' ? 'Paid' : s === 'payment_confirmed' ? 'Verified' : s.charAt(0).toUpperCase() + s.slice(1)
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
              done ? 'bg-brand-500 border-brand-500' : 'bg-transparent border-white/20'
            } ${current ? 'ring-2 ring-brand-500/30' : ''}`} />
            <p className={`text-[9px] text-center leading-tight ${done ? 'text-brand-400' : 'text-white/20'}`}>{label}</p>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`absolute h-0.5 w-full ${done && i < currentIdx ? 'bg-brand-500' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Main ── */
export default function MyOrders() {
  const { user } = useAuth()
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, shops(name, slug), order_items(id, product_id, product_name, product_image, quantity, unit_price)')
        .eq('buyer_id', user!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as FullOrder[]
    },
  })

  // All reviews this buyer has left — used to check per-product review status
  const { data: myReviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase
        .from('reviews').select('id, product_id, rating, comment').eq('buyer_id', user!.id)
      return (data ?? []) as { id: string; product_id: string; rating: number; comment: string | null }[]
    },
  })

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-white mb-2">My Orders</h1>
      <p className="text-white/40 text-sm mb-8">Track your purchases and rate delivered products</p>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <ShoppingBag size={44} className="mx-auto mb-3 opacity-25" />
          <p>No orders yet.{' '}
            <Link to="/marketplace" className="text-brand-400 hover:underline">Start shopping</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge      = STATUS_BADGE[order.status as OrderStatus] ?? { label: order.status, variant: 'gray' as const }
            const isDelivered = order.status === 'delivered'

            return (
              <div key={order.id} className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap border-b border-white/5">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    {order.shops && (
                      <Link to={`/shop/${order.shops.slug}`} className="text-xs text-brand-400 hover:underline">
                        {order.shops.name}
                      </Link>
                    )}
                    <p className="text-xs text-white/30 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-400">₦{order.total_amount.toLocaleString()}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                </div>

                {/* Order items */}
                {order.order_items?.length > 0 && (
                  <div className="divide-y divide-white/5">
                    {order.order_items.map((item) => {
                      const myReview = myReviews.find(r => r.product_id === item.product_id)
                      return (
                        <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                          {/* Product image */}
                          <Link to={`/product/${item.product_id}`} className="shrink-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-space-700 border border-white/8">
                              {item.product_image
                                ? <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                              }
                            </div>
                          </Link>

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${item.product_id}`}
                              className="text-sm font-medium text-white hover:text-brand-400 transition-colors truncate block">
                              {item.product_name}
                            </Link>
                            <p className="text-xs text-white/35">
                              Qty: {item.quantity} · ₦{item.unit_price.toLocaleString()} each
                            </p>

                            {/* Review status for delivered orders */}
                            {isDelivered && myReview && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <StarRow rating={myReview.rating} size={11} />
                                <span className="text-[10px] text-green-400 flex items-center gap-0.5">
                                  <CheckCircle size={10} /> Reviewed
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Rate button — only for delivered orders */}
                          {isDelivered && (
                            <button
                              type="button"
                              onClick={() => setReviewTarget({
                                productId:        item.product_id,
                                productName:      item.product_name,
                                existingRating:   myReview?.rating,
                                existingComment:  myReview?.comment ?? undefined,
                                existingReviewId: myReview?.id,
                              })}
                              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                myReview
                                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/25 hover:bg-brand-500/20'
                                  : 'bg-white/8 text-white/60 border border-white/10 hover:bg-brand-500/15 hover:text-brand-400 hover:border-brand-500/30'
                              }`}
                            >
                              <Star size={12} className={myReview ? 'fill-brand-400 text-brand-400' : ''} />
                              {myReview ? 'Edit Review' : 'Rate'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Delivered banner */}
                {isDelivered && (
                  <div className="px-5 py-2.5 bg-green-500/8 border-t border-green-500/15 flex items-center gap-2">
                    <CheckCircle size={13} className="text-green-400 shrink-0" />
                    <p className="text-xs text-green-400">
                      Order delivered — tap <strong>Rate</strong> next to each product to share your experience
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Review modal */}
      <AnimatePresence>
        {reviewTarget && (
          <ReviewModal target={reviewTarget} onClose={() => setReviewTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
