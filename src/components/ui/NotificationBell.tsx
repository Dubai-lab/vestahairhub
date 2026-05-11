import { useRef, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bell, CheckCheck, ShoppingBag, MessageSquare,
  Package, Star, Heart, Sparkles,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNotifications, type AppNotification } from '@/hooks/useNotifications'

/* ── Helpers ── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  welcome:            { icon: <Sparkles  size={13} />, color: 'text-brand-400'   },
  order_placed:       { icon: <ShoppingBag size={13} />, color: 'text-brand-400' },
  order_confirmed:    { icon: <Package   size={13} />, color: 'text-emerald-400' },
  order_payment_confirmed: { icon: <Package size={13} />, color: 'text-emerald-400' },
  order_processing:   { icon: <Package   size={13} />, color: 'text-yellow-400'  },
  order_shipped:      { icon: <Package   size={13} />, color: 'text-blue-400'    },
  order_delivered:    { icon: <Package   size={13} />, color: 'text-emerald-400' },
  order_cancelled:    { icon: <Package   size={13} />, color: 'text-red-400'     },
  message_received:   { icon: <MessageSquare size={13} />, color: 'text-brand-300' },
  new_review:         { icon: <Star      size={13} />, color: 'text-yellow-400'  },
}

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: <Bell size={13} />, color: 'text-white/40' }
}

/* ── Clickable destination per type ── */
function typeDestination(n: AppNotification): string | null {
  const data = n.data as Record<string, string>
  if (n.type === 'message_received' && data.conversation_id) return '/messages'
  if (n.type?.startsWith('order_') && data.order_id) {
    // seller gets /dashboard/orders, buyer gets /account/orders
    // We can't easily tell here — navigate to the general path, both work
    return '/account/orders'
  }
  if (n.type === 'welcome') return '/marketplace'
  return null
}

/* ── Single notification row ── */
function NotifRow({ n, onRead }: { n: AppNotification; onRead: (id: string) => void }) {
  const navigate = useNavigate()
  const { icon, color } = getTypeMeta(n.type)
  const isUnread = !n.read_at

  function handleClick() {
    if (isUnread) onRead(n.id)
    const dest = typeDestination(n)
    if (dest) navigate(dest)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-white/5 flex gap-3 items-start ${isUnread ? 'bg-brand-500/5' : ''}`}
    >
      {/* Icon badge */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isUnread ? 'bg-brand-500/20' : 'bg-white/8'} ${color}`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${isUnread ? 'text-white' : 'text-white/65'}`}>
            {n.title}
          </p>
          {isUnread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />}
        </div>
        <p className="text-xs text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
        <p className="text-[10px] text-white/25 mt-1">{relativeTime(n.created_at)}</p>
      </div>
    </button>
  )
}

/* ── Main bell component ── */
export function NotificationBell() {
  const { notifications, unread, loading, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Mark visible unread as read after dropdown opens
  useEffect(() => {
    if (!open || unread === 0) return
    const timer = setTimeout(() => markAllRead(), 3000)
    return () => clearTimeout(timer)
  }, [open, unread, markAllRead])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        className="relative p-2 text-white/70 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{   opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 glass-dark rounded-2xl border border-brand-900/50 shadow-2xl z-[60] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unread > 0 && (
                  <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full font-medium">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center mb-3">
                    <Bell size={20} className="text-brand-500/40" />
                  </div>
                  <p className="text-sm text-white/30">No notifications yet</p>
                  <p className="text-xs text-white/20 mt-1">Activity from orders and messages will appear here</p>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={n.id}>
                    <NotifRow n={n} onRead={(id) => { markRead(id); }} />
                    {i < notifications.length - 1 && <div className="h-px bg-white/5 mx-4" />}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/8 flex items-center justify-between">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                View all →
              </Link>
              {notifications.length > 0 && (
                <span className="text-[10px] text-white/20">{notifications.length} total</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
