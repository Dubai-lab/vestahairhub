import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Bell, CheckCheck, ShoppingBag, MessageSquare,
  Package, Star, Sparkles, Trash2,
} from 'lucide-react'
import { useNotifications, type AppNotification } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/Button'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  welcome:                 { icon: <Sparkles   size={16} />, color: 'text-brand-400',   bg: 'bg-brand-500/15'   },
  order_placed:            { icon: <ShoppingBag size={16} />, color: 'text-brand-400',  bg: 'bg-brand-500/15'   },
  order_confirmed:         { icon: <Package    size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  order_payment_confirmed: { icon: <Package    size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  order_processing:        { icon: <Package    size={16} />, color: 'text-yellow-400',  bg: 'bg-yellow-500/15'  },
  order_shipped:           { icon: <Package    size={16} />, color: 'text-blue-400',    bg: 'bg-blue-500/15'    },
  order_delivered:         { icon: <Package    size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  order_cancelled:         { icon: <Package    size={16} />, color: 'text-red-400',     bg: 'bg-red-500/15'     },
  message_received:        { icon: <MessageSquare size={16} />, color: 'text-brand-300', bg: 'bg-brand-500/10' },
  new_review:              { icon: <Star       size={16} />, color: 'text-yellow-400',  bg: 'bg-yellow-500/15'  },
}

function getMeta(type: string) {
  return TYPE_META[type] ?? { icon: <Bell size={16} />, color: 'text-white/40', bg: 'bg-white/8' }
}

function typeDestination(n: AppNotification): string | null {
  const data = n.data as Record<string, string>
  if (n.type === 'message_received' && data.conversation_id) return '/messages'
  if (n.type?.startsWith('order_') && data.order_id) return '/account/orders'
  if (n.type === 'welcome') return '/marketplace'
  return null
}

function NotifCard({ n, onRead, onDelete }: {
  n: AppNotification
  onRead:   (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const { icon, color, bg } = getMeta(n.type)
  const isUnread = !n.read_at

  function handleClick() {
    if (isUnread) onRead(n.id)
    const dest = typeDestination(n)
    if (dest) navigate(dest)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-dark rounded-2xl p-4 flex gap-4 items-start transition-colors ${isUnread ? 'border border-brand-500/20' : 'border border-transparent'}`}
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
        {icon}
      </div>

      {/* Content */}
      <button type="button" onClick={handleClick} className="flex-1 text-left min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${isUnread ? 'text-white' : 'text-white/70'}`}>
            {n.title}
          </p>
          {isUnread && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0 mt-1" />}
        </div>
        <p className="text-sm text-white/45 mt-1 leading-relaxed">{n.body}</p>
        <p className="text-xs text-white/25 mt-2">{relativeTime(n.created_at)}</p>
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
        className="p-1.5 text-white/20 hover:text-red-400 transition-colors shrink-0"
        aria-label="Delete notification"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}

export default function NotificationsPage() {
  const { notifications, unread, loading, markRead, markAllRead, deleteOne } = useNotifications()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <Bell size={28} className="text-brand-400" />
            Notifications
          </h1>
          {unread > 0 && (
            <p className="text-white/45 text-sm mt-1">
              {unread} unread notification{unread !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck size={15} />}
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-dark rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-brand-500/40" />
          </div>
          <h2 className="text-lg font-semibold text-white/60 mb-2">All caught up!</h2>
          <p className="text-sm text-white/30 max-w-xs mx-auto">
            Order updates, new messages, and other activity will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotifCard
              key={n.id}
              n={n}
              onRead={markRead}
              onDelete={deleteOne}
            />
          ))}
        </div>
      )}
    </div>
  )
}
