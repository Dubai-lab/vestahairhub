import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, MessageCircle, Lock } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import type { Message as MessageRow } from '@/types'

interface Props {
  isOpen:       boolean
  onClose:      () => void
  sellerId:     string
  shopId:       string
  shopName:     string
  productId:    string
  productName:  string
  productImage?: string | null
}

type MsgWithSender = MessageRow & { sender: { full_name: string | null } | null }

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ChatModal({ isOpen, onClose, sellerId, shopId, shopName, productId, productName, productImage }: Props) {
  const { user, profile } = useAuth()
  const [convId,    setConvId]    = useState<string | null>(null)
  const [messages,  setMessages]  = useState<MsgWithSender[]>([])
  const [input,     setInput]     = useState('')
  const [isInit,    setIsInit]    = useState(false)
  const [isSending, setIsSending] = useState(false)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const channelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Find-or-create conversation + load messages when modal opens
  useEffect(() => {
    if (!isOpen || !user) return
    let cancelled = false

    async function init() {
      setIsInit(false)
      setMessages([])

      // 1. Find existing conversation
      let { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', user!.id)
        .eq('seller_id', sellerId)
        .maybeSingle()

      // 2. Create if none
      if (!conv) {
        const { data: created } = await supabase
          .from('conversations')
          .insert({ buyer_id: user!.id, seller_id: sellerId, shop_id: shopId, product_id: productId })
          .select('id')
          .single()
        conv = created
      }

      if (cancelled || !conv) return
      setConvId(conv.id)

      // 3. Load existing messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })

      if (!cancelled) {
        setMessages((msgs ?? []) as unknown as MsgWithSender[])
        // Pre-fill default message only if conversation is empty
        if (!msgs?.length) {
          setInput(`Hi! I'm interested in "${productName}". Is it still available?`)
        }
      }

      // 4. Mark unread messages from seller as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user!.id)
        .eq('is_read', false)

      setIsInit(true)

      // 5. Subscribe to realtime new messages
      const ch = supabase
        .channel(`chat-${conv.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conv.id}`,
        }, async (payload) => {
          // Fetch sender name for the new message
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', (payload.new as MessageRow).sender_id)
            .maybeSingle()

          const newMsg: MsgWithSender = {
            ...(payload.new as MessageRow),
            sender: senderProfile,
          }
          setMessages(prev => {
            // Avoid duplicates (optimistic update already added it)
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark as read if the other person sent it
          if ((payload.new as MessageRow).sender_id !== user!.id) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', (payload.new as MessageRow).id)
          }
        })
        .subscribe()

      channelRef.current = ch
    }

    init()
    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [isOpen, user, sellerId, shopId, productId, productName])

  // Focus input when ready
  useEffect(() => {
    if (isInit) inputRef.current?.focus()
  }, [isInit])

  const sendMessage = async () => {
    if (!input.trim() || !convId || !user || isSending) return
    const content = input.trim()
    setInput('')
    setIsSending(true)

    // Optimistic update
    const tempMsg: MsgWithSender = {
      id: `temp-${Date.now()}`,
      conversation_id: convId,
      sender_id: user.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: profile?.full_name ?? null },
    }
    setMessages(prev => [...prev, tempMsg])

    const { data: inserted } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: user.id, content })
      .select('id')
      .single()

    // Replace temp with real id
    if (inserted) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, id: inserted.id } : m))
    }
    setIsSending(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Group messages by day
  const grouped: { day: string; msgs: MsgWithSender[] }[] = []
  for (const msg of messages) {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel — right side on desktop, bottom sheet on mobile */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] flex flex-col bg-space-800 border-l border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-900/50 flex items-center justify-center shrink-0 overflow-hidden">
                {productImage
                  ? <img src={productImage} alt="" className="w-full h-full object-cover" />
                  : <MessageCircle size={18} className="text-brand-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{shopName}</p>
                <p className="text-xs text-white/40 truncate">{productName}</p>
              </div>
              <button type="button" onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            {!user ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/15 flex items-center justify-center">
                  <Lock size={24} className="text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Sign in to chat</p>
                  <p className="text-sm text-white/40">You need an account to message this seller.</p>
                </div>
                <Link
                  to="/auth/login"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : !isInit ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="text-brand-400 animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {grouped.length === 0 && (
                  <div className="text-center py-10 text-white/30 text-sm">
                    No messages yet. Say hello!
                  </div>
                )}
                {grouped.map(({ day, msgs }) => (
                  <div key={day} className="space-y-3">
                    {/* Day separator */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/8" />
                      <span className="text-[11px] text-white/25 shrink-0">{day}</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {msgs.map((msg) => {
                      const isMine = msg.sender_id === user.id
                      const initials = (msg.sender?.full_name ?? '?')[0].toUpperCase()
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
                            isMine ? 'bg-brand-500/30 text-brand-300' : 'bg-space-600 text-white/60'
                          }`}>
                            {initials}
                          </div>
                          {/* Bubble */}
                          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                            isMine
                              ? 'bg-brand-500/25 border border-brand-500/30 rounded-tr-sm'
                              : 'bg-white/5 border border-white/8 rounded-tl-sm'
                          }`}>
                            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-400/60 text-right' : 'text-white/25'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Input */}
            {user && isInit && (
              <div className="px-4 py-3 border-t border-white/10 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    rows={2}
                    className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none transition-colors scrollbar-thin"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!input.trim() || isSending}
                    className="w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                  >
                    {isSending
                      ? <Loader2 size={16} className="text-white animate-spin" />
                      : <Send size={16} className="text-white" />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-white/20 mt-1.5 text-center">Shift+Enter for new line · Enter to send</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
