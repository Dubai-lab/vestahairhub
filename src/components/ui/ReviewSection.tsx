import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Button }   from '@/components/ui/Button'
import type { Review as ReviewRow } from '@/types'

interface Props {
  productId:   string
  productName: string
}

function StarRow({ rating, size = 16, interactive = false, onRate }: {
  rating: number; size?: number; interactive?: boolean; onRate?: (r: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const effective = hovered || rating

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={size}
            className={`transition-colors ${i <= effective ? 'fill-brand-400 text-brand-400' : 'fill-transparent text-white/20'}`}
          />
        </button>
      ))}
    </div>
  )
}

function avgRating(reviews: ReviewRow[]) {
  if (!reviews.length) return 0
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
}

export function ReviewSection({ productId, productName }: Props) {
  const { user } = useAuth()
  const qc       = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [rating,   setRating]   = useState(0)
  const [comment,  setComment]  = useState('')
  const [ratingErr, setRatingErr] = useState(false)

  // All reviews for this product — select * only (no profiles join to avoid RLS issues)
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
      return (data ?? []) as ReviewRow[]
    },
  })

  // Check if current buyer has a delivered order containing this product
  const { data: canReview } = useQuery({
    queryKey: ['can-review', productId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get user's delivered order IDs
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user!.id)
        .eq('status', 'delivered')

      if (!orders?.length) return false

      const { data: item } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .in('order_id', orders.map(o => o.id))
        .maybeSingle()

      return !!item
    },
  })

  // Check if the current user already left a review
  const myReview = reviews.find(r => r.buyer_id === user?.id)

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!rating) { setRatingErr(true); return }
      setRatingErr(false)
      if (myReview) {
        await supabase.from('reviews').update({ rating, comment: comment || null }).eq('id', myReview.id)
      } else {
        await supabase.from('reviews').insert({ buyer_id: user!.id, product_id: productId, rating, comment: comment || null })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', productId] })
      setShowForm(false)
      setComment('')
      setRating(0)
    },
  })

  const avg = avgRating(reviews)

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: reviews.filter(r => r.rating === n).length,
    pct:   reviews.length ? Math.round((reviews.filter(r => r.rating === n).length / reviews.length) * 100) : 0,
  }))

  return (
    <section className="space-y-6 pt-10 border-t border-white/8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold text-white">
          Customer Reviews
          {reviews.length > 0 && <span className="text-white/30 text-lg ml-2">({reviews.length})</span>}
        </h2>

        {/* Write a review button */}
        {user && canReview && (
          <Button
            size="sm"
            variant={showForm ? 'ghost' : 'primary'}
            onClick={() => {
              if (myReview) { setRating(myReview.rating); setComment(myReview.comment ?? '') }
              setShowForm(s => !s)
            }}
          >
            {myReview ? 'Edit Your Review' : 'Write a Review'}
          </Button>
        )}
        {!user && (
          <Link to="/auth/login" className="text-sm text-brand-400 hover:underline">
            Sign in to leave a review
          </Link>
        )}
      </div>

      {/* Summary row — only if there are reviews */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 glass-dark rounded-2xl p-5">
          {/* Average */}
          <div className="flex flex-col items-center justify-center sm:w-36 shrink-0">
            <span className="text-5xl font-bold text-white">{avg.toFixed(1)}</span>
            <StarRow rating={Math.round(avg)} size={18} />
            <span className="text-xs text-white/30 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {dist.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="text-white/40 w-5 text-right">{stars}</span>
                <Star size={11} className="fill-brand-400 text-brand-400 shrink-0" />
                <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
                <span className="text-white/30 w-5">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-dark rounded-2xl p-5 space-y-4 border border-brand-500/20">
              <p className="font-medium text-white">
                {myReview ? 'Update your review for' : 'Your review for'}{' '}
                <span className="text-brand-400">{productName}</span>
              </p>

              <div className="space-y-1.5">
                <label className="text-sm text-white/60">Rating</label>
                <StarRow rating={rating} size={28} interactive onRate={setRating} />
                {ratingErr && <p className="text-xs text-red-400">Please select a star rating.</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/60">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder={`Share your experience with ${productName}…`}
                  className="w-full bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  isLoading={submitReview.isPending}
                  onClick={() => submitReview.mutate()}
                >
                  {myReview ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-brand-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-white/25">
          <Star size={32} className="mx-auto mb-3 opacity-20" />
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, i) => {
            const isMe = review.buyer_id === user?.id
            const initials = review.buyer_id.slice(0, 2).toUpperCase()

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-dark rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">
                        {isMe ? 'You' : 'Verified Buyer'}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-brand-500/15 text-brand-400 px-2 py-0.5 rounded-full">Your review</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRow rating={review.rating} size={13} />
                      <span className="text-xs text-white/30">
                        {new Date(review.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="flex items-center gap-1 text-green-400 text-xs shrink-0">
                    <CheckCircle size={12} />
                    <span className="hidden sm:inline">Verified</span>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-white/65 leading-relaxed pl-13">{review.comment}</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
