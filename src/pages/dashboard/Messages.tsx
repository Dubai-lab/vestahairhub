import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Send, Loader2, MessageSquare, ArrowLeft, Search, Smile, Image as ImageIcon,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Spinner }  from '@/components/ui/Spinner'
import type { Conversation, Message } from '@/types'

type Conv = Conversation & { product: { id: string; name: string; images: string[] } | null }

interface MsgWithSender extends Message {
  attachment_meta: { product_id?: string; product_name?: string; product_price?: number; product_image?: string } | null
}

const EMOJIS = [
  '😊','😂','❤️','🔥','👍','✨','😍','🙏','💯','🎉',
  '😮','😢','🤔','💪','🌟','💕','🎊','👏','🤝','💸',
  '💰','🛍️','📦','🚀','⭐','💎','🏆','✅','🌺','💅',
  '💇','👑','💄','👗','💍','🌈','🦋','🥰','😘','🤩',
]

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(iso: string) {
  const d = new Date(iso); const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function ProductCard({ meta }: { meta: NonNullable<MsgWithSender['attachment_meta']> }) {
  if (!meta.product_id) return null
  return (
    <Link
      to={`/product/${meta.product_id}`}
      className="flex items-center gap-3 bg-space-700/60 border border-brand-500/25 rounded-xl overflow-hidden hover:border-brand-500/50 transition-colors mb-2 group"
    >
      {meta.product_image ? (
        <img src={meta.product_image} alt="" className="w-16 h-16 object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 bg-brand-900/40 flex items-center justify-center text-2xl shrink-0">📦</div>
      )}
      <div className="py-2 pr-3 min-w-0">
        <p className="text-sm font-medium text-white truncate">{meta.product_name}</p>
        {meta.product_price != null && (
          <p className="text-brand-400 font-bold text-sm">₦{Number(meta.product_price).toLocaleString()}</p>
        )}
        <p className="text-[11px] text-brand-400/60 group-hover:text-brand-400 transition-colors">View Product →</p>
      </div>
    </Link>
  )
}

function MessageBubble({ msg, isMine, senderName }: { msg: MsgWithSender; isMine: boolean; senderName: string }) {
  const initials = senderName[0]?.toUpperCase() ?? '?'
  return (
    <div className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
        isMine ? 'bg-brand-500/30 text-brand-300' : 'bg-space-600 text-white/70'
      }`}>{initials}</div>
      <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {msg.message_type === 'product_inquiry' && msg.attachment_meta && (
          <ProductCard meta={msg.attachment_meta} />
        )}
        {msg.message_type === 'image' && msg.attachment_url && (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
            <img src={msg.attachment_url} alt="attachment" className="max-w-[200px] max-h-[200px] object-cover rounded-xl" />
          </a>
        )}
        <div className={`rounded-2xl px-3.5 py-2.5 ${
          isMine ? 'bg-brand-500/25 border border-brand-500/35 rounded-tr-sm' : 'bg-white/5 border border-white/8 rounded-tl-sm'
        }`}>
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-400/50 text-right' : 'text-white/25'}`}>{msgTime(msg.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardMessages() {
  const { user, profile } = useAuth()

  const [conversations, setConversations] = useState<Conv[]>([])
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null)
  const [messages,      setMessages]      = useState<MsgWithSender[]>([])
  const [input,         setInput]         = useState('')
  const [showEmoji,     setShowEmoji]     = useState(false)
  const [isSending,     setIsSending]     = useState(false)
  const [convLoading,   setConvLoading]   = useState(true)
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [mobileThread,  setMobileThread]  = useState(false)
  const [search,        setSearch]        = useState('')
  const [filterUnread,  setFilterUnread]  = useState(false)
  const [imgUploading,  setImgUploading]  = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const emojiRef   = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  const loadConversations = useCallback(async () => {
    if (!user) return
    // No profile join — use denormalized buyer_name from conversations table
    // Only show conversations that have at least one message
    const { data } = await supabase
      .from('conversations')
      .select('*, product:products(id, name, images)')
      .eq('seller_id', user.id)
      .not('last_message_preview', 'is', null)
      .order('last_message_at', { ascending: false })
    setConversations((data ?? []) as unknown as Conv[])
    setConvLoading(false)
  }, [user])

  useEffect(() => { loadConversations() }, [loadConversations])

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id); setMobileThread(true); setShowEmoji(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  useEffect(() => {
    if (!activeConvId || !user) return
    let cancelled = false

    async function load() {
      setMsgLoading(true); setMessages([])
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConvId!)
        .order('created_at', { ascending: true })

      if (!cancelled) {
        setMessages((data ?? []) as unknown as MsgWithSender[])
        setMsgLoading(false)
      }

      // Mark buyer messages as read + reset seller unread
      await supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', activeConvId!).neq('sender_id', user!.id).eq('is_read', false)
      await supabase.from('conversations').update({ unread_seller: 0 }).eq('id', activeConvId!)
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unread_seller: 0 } : c))

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const ch = supabase.channel(`seller-msg-${activeConvId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
          async (payload) => {
            const raw = payload.new as Message
            const newMsg: MsgWithSender = { ...(raw as unknown as MsgWithSender), attachment_meta: (raw as any).attachment_meta ?? null }
            setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
            setConversations(prev => prev.map(c =>
              c.id === activeConvId ? { ...c, last_message_preview: raw.content, last_message_at: raw.created_at } : c
            ))
            if (raw.sender_id !== user!.id) {
              await supabase.from('messages').update({ is_read: true }).eq('id', raw.id)
            }
          })
        .subscribe()
      channelRef.current = ch
    }

    load()
    return () => {
      cancelled = true
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    }
  }, [activeConvId, user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || !user || isSending) return
    const content = input.trim(); setInput(''); setIsSending(true)
    const tempId = `temp-${Date.now()}`
    const tempMsg: MsgWithSender = {
      id: tempId, conversation_id: activeConvId, sender_id: user.id,
      content, message_type: 'text', attachment_url: null, attachment_meta: null,
      is_read: false, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    const { data: inserted, error } = await supabase.from('messages')
      .insert({ conversation_id: activeConvId, sender_id: user.id, content })
      .select('id').single()
    if (error) console.error('Send error:', error)
    if (inserted) setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: inserted.id } : m))
    setIsSending(false); loadConversations()
  }

  const sendImage = async (file: File) => {
    if (!activeConvId || !user) return
    setImgUploading(true)
    const path = `conversations/${activeConvId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { error: upErr } = await supabase.storage.from('chat-media').upload(path, file, { upsert: true })
    if (upErr) { setImgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path)
    await supabase.from('messages').insert({
      conversation_id: activeConvId, sender_id: user.id,
      content: '📷 Photo', message_type: 'image', attachment_url: publicUrl,
    })
    setImgUploading(false); loadConversations()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const grouped: { day: string; msgs: MsgWithSender[] }[] = []
  for (const msg of messages) {
    const day = dayLabel(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  }

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_seller ?? 0), 0)

  const filteredConvs = conversations.filter(c => {
    const name = c.buyer_name ?? ''
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (c.last_message_preview ?? '').toLowerCase().includes(search.toLowerCase())
    const matchUnread = !filterUnread || c.unread_seller > 0
    return matchSearch && matchUnread
  })

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Messages</h1>
        <p className="text-white/45 mt-1 text-sm">Customer enquiries — reply to keep sales moving</p>
      </div>

      <div className="glass-dark rounded-2xl overflow-hidden border border-white/5 flex flex-1 h-[calc(100vh-220px)] min-h-[480px]">
        {/* Left: conversation list */}
        <div className={`w-full sm:w-[300px] shrink-0 flex flex-col border-r border-white/8 ${mobileThread ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 pt-4 pb-3 border-b border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Buyers</p>
              {totalUnread > 0 && (
                <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{totalUnread} new</span>
              )}
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/8 rounded-xl text-white text-xs placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div className="flex gap-2">
              {(['All', 'Unread'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setFilterUnread(tab === 'Unread')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    (tab === 'Unread') === filterUnread
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {convLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-white/20 text-center px-4">
                <MessageSquare size={28} className="opacity-30" />
                <p className="text-xs">No conversations yet. Customers will message you from product pages.</p>
              </div>
            ) : filteredConvs.map(conv => {
              const isActive = conv.id === activeConvId
              const name = conv.buyer_name ?? 'Customer'
              const initials = name[0]?.toUpperCase() ?? '?'
              const hasUnread = conv.unread_seller > 0
              return (
                <button key={conv.id} type="button" onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all ${
                    isActive ? 'bg-brand-500/10 border-l-2 border-brand-500' : 'hover:bg-white/3 border-l-2 border-transparent'
                  }`}>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-space-600 to-space-700 flex items-center justify-center text-white/70 font-bold text-sm border border-white/10">
                      {initials}
                    </div>
                    {hasUnread && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-space-800" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>{name}</span>
                      <span className="text-[10px] text-white/25 shrink-0">{relativeTime(conv.last_message_at)}</span>
                    </div>
                    {conv.product && <p className="text-[11px] text-brand-400/70 truncate mb-0.5">{conv.product.name}</p>}
                    <p className={`text-xs truncate ${hasUnread ? 'text-white/70' : 'text-white/30'}`}>
                      {conv.last_message_preview ?? 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_seller > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {conv.unread_seller > 9 ? '9+' : conv.unread_seller}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: thread */}
        <div className={`flex-1 flex flex-col min-w-0 ${!mobileThread ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <MessageSquare size={28} className="text-brand-500/40" />
              </div>
              <p className="text-sm">Select a conversation to reply</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
                <button type="button" onClick={() => setMobileThread(false)} className="sm:hidden text-white/50 hover:text-white p-1">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-space-600 flex items-center justify-center text-white/70 font-bold text-sm shrink-0">
                  {(activeConv?.buyer_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{activeConv?.buyer_name ?? 'Customer'}</p>
                  {activeConv?.product && <p className="text-xs text-brand-400/70 truncate">{activeConv.product.name}</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {msgLoading ? <div className="flex justify-center py-10"><Spinner /></div>
                  : grouped.length === 0 ? <div className="text-center py-10 text-white/25 text-sm">No messages yet.</div>
                  : grouped.map(({ day, msgs }) => (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/6" />
                        <span className="text-[11px] text-white/20 px-2">{day}</span>
                        <div className="flex-1 h-px bg-white/6" />
                      </div>
                      {msgs.map(msg => {
                        const isMine = msg.sender_id === user!.id
                        return (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMine={isMine}
                            senderName={isMine
                              ? (profile?.full_name ?? user!.email?.split('@')[0] ?? 'Me')
                              : (activeConv?.buyer_name ?? 'Customer')
                            }
                          />
                        )
                      })}
                    </div>
                  ))
                }
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-white/8 shrink-0">
                <div className="flex items-end gap-2">
                  {/* Emoji */}
                  <div className="relative" ref={emojiRef}>
                    <button type="button" onClick={() => setShowEmoji(s => !s)}
                      className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5">
                      <Smile size={18} />
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-11 left-0 z-50 bg-space-700 border border-white/10 rounded-2xl p-3 shadow-2xl grid grid-cols-10 gap-1 w-[280px]"
                        >
                          {EMOJIS.map(e => (
                            <button key={e} type="button"
                              onClick={() => { setInput(i => i + e); setShowEmoji(false); inputRef.current?.focus() }}
                              className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors leading-none">
                              {e}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Image */}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={imgUploading}
                    className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5 disabled:opacity-40">
                    {imgUploading ? <Loader2 size={16} className="animate-spin text-brand-400" /> : <ImageIcon size={16} />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) sendImage(e.target.files[0]); e.target.value = '' }} />

                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
                    placeholder="Reply to customer…" aria-label="Reply to customer" rows={1}
                    className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none transition-colors scrollbar-thin max-h-32 min-h-[40px]"
                    onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 128)}px` }}
                  />
                  <button type="button" onClick={sendMessage} disabled={!input.trim() || isSending}
                    className="w-9 h-9 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
                    {isSending ? <Loader2 size={15} className="text-white animate-spin" /> : <Send size={15} className="text-white" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
