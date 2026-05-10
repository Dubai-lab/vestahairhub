import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Send, Loader2, MessageSquare, ArrowLeft, Search,
  Smile, Image as ImageIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Spinner }  from '@/components/ui/Spinner'
import type { Conversation, Message } from '@/types'

/* ── Types ── */
type Conv = Conversation & { product: { name: string; images: string[] } | null }

interface MsgWithSender extends Message {
  attachment_meta: { product_id?: string; product_name?: string; product_price?: number; product_image?: string } | null
}

interface PendingProduct {
  sellerId:     string
  shopId:       string
  productId:    string
  productName:  string
  productImage: string
  productPrice: number
  sellerName:   string
}

/* ── Constants ── */
const EMOJIS = [
  '😊','😂','❤️','🔥','👍','✨','😍','🙏','💯','🎉',
  '😮','😢','🤔','💪','🌟','💕','🎊','👏','🤝','💸',
  '💰','🛍️','📦','🚀','⭐','💎','🏆','✅','🌺','💅',
  '💇','👑','💄','👗','💍','🌈','🦋','🥰','😘','😜',
  '🤩','😎','🎀','🪄','💫','🔥','⚡','🌙','☀️','🐝',
]

/* ── Helpers ── */
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'now'
  if (mins < 60)  return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function msgTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yest = new Date(); yest.setDate(today.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

/* ── Product card inside a message ── */
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

/* ── Single message bubble ── */
function MessageBubble({ msg, isMine, senderName }: { msg: MsgWithSender; isMine: boolean; senderName: string }) {
  const initials = senderName[0]?.toUpperCase() ?? '?'
  return (
    <div className={`flex gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${
        isMine ? 'bg-brand-500/30 text-brand-300' : 'bg-space-600 text-white/70'
      }`}>
        {initials}
      </div>
      <div className={`max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {msg.message_type === 'product_inquiry' && msg.attachment_meta && (
          <ProductCard meta={msg.attachment_meta} />
        )}
        {msg.message_type === 'image' && msg.attachment_url && (
          <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden">
            <img src={msg.attachment_url} alt="attachment" className="max-w-[200px] max-h-[200px] object-cover rounded-xl" />
          </a>
        )}
        <div className={`rounded-2xl px-3.5 py-2.5 ${
          isMine
            ? 'bg-brand-500/25 border border-brand-500/35 rounded-tr-sm'
            : 'bg-white/5 border border-white/8 rounded-tl-sm'
        }`}>
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-400/50 text-right' : 'text-white/25'}`}>
            {msgTime(msg.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Reusable input toolbar ── */
function InputBar({
  input, setInput, onSend, isSending, imgUploading, onImage,
  fileRef, inputRef, emojiRef, showEmoji, setShowEmoji, placeholder,
}: {
  input: string; setInput: (v: string) => void
  onSend: () => void; isSending: boolean
  imgUploading: boolean; onImage: (f: File) => void
  fileRef: React.RefObject<HTMLInputElement>
  inputRef: React.RefObject<HTMLTextAreaElement>
  emojiRef: React.RefObject<HTMLDivElement>
  showEmoji: boolean; setShowEmoji: (v: boolean) => void
  placeholder: string
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }
  return (
    <div className="px-4 py-3 border-t border-white/8 bg-space-800 shrink-0">
      <div className="flex items-end gap-2">
        <div className="relative" ref={emojiRef}>
          <button type="button" onClick={() => setShowEmoji(!showEmoji)}
            className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5">
            <Smile size={20} />
          </button>
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute bottom-12 left-0 z-50 bg-space-700 border border-white/10 rounded-2xl p-3 shadow-2xl grid grid-cols-10 gap-1 w-[280px]"
              >
                {EMOJIS.map(e => (
                  <button key={e} type="button"
                    onClick={() => { setInput(input + e); setShowEmoji(false); inputRef.current?.focus() }}
                    className="text-xl hover:bg-white/10 rounded-lg p-1 transition-colors leading-none">
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button type="button" onClick={() => fileRef.current?.click()} disabled={imgUploading}
          className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-brand-400 transition-colors rounded-xl hover:bg-white/5 disabled:opacity-40">
          {imgUploading ? <Loader2 size={18} className="animate-spin text-brand-400" /> : <ImageIcon size={18} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" aria-label="Upload image" className="hidden"
          onChange={e => { if (e.target.files?.[0]) onImage(e.target.files[0]); e.target.value = '' }} />

        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
          placeholder={placeholder} aria-label={placeholder} rows={1}
          className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none transition-colors scrollbar-thin max-h-32 min-h-[42px]"
          onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 128)}px` }}
        />

        <button type="button" onClick={onSend} disabled={!input.trim() || isSending}
          className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
          {isSending ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
        </button>
      </div>
      <p className="text-[10px] text-white/15 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
    </div>
  )
}

/* ── Main Page ── */
export default function MessagesPage() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const sellerParam       = searchParams.get('seller')
  const shopParam         = searchParams.get('shop')
  const productIdParam    = searchParams.get('product')
  const productNameParam  = searchParams.get('productName')
  const productImageParam = searchParams.get('productImage')
  const productPriceParam = searchParams.get('productPrice')

  const [conversations,  setConversations]  = useState<Conv[]>([])
  const [activeConvId,   setActiveConvId]   = useState<string | null>(null)
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(null)
  const [messages,       setMessages]       = useState<MsgWithSender[]>([])
  const [input,          setInput]          = useState('')
  const [showEmoji,      setShowEmoji]      = useState(false)
  const [isSending,      setIsSending]      = useState(false)
  const [convLoading,    setConvLoading]    = useState(true)
  const [msgLoading,     setMsgLoading]     = useState(false)
  const [mobileThread,   setMobileThread]   = useState(false)
  const [search,         setSearch]         = useState('')
  const [filterUnread,   setFilterUnread]   = useState(false)
  const [imgUploading,   setImgUploading]   = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const emojiRef   = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  /* ── Load conversation list (only convs with at least one message) ── */
  const loadConversations = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('*, product:products(name, images)')
      .eq('buyer_id', user.id)
      .not('last_message_preview', 'is', null)
      .order('last_message_at', { ascending: false })
    setConversations((data ?? []) as unknown as Conv[])
    setConvLoading(false)
  }, [user])

  useEffect(() => { loadConversations() }, [loadConversations])

  /* ── Handle URL params from product "Chat with Seller" button ── */
  useEffect(() => {
    if (!user || !sellerParam || !shopParam || convLoading) return
    handleProductParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sellerParam, convLoading])

  async function handleProductParams() {
    if (!user || !sellerParam || !shopParam) return

    // Block self-messaging (seller clicking their own product)
    if (sellerParam === user.id) {
      setSearchParams({})
      return
    }

    // Check if a conversation (with messages) already exists
    const { data: existing } = await supabase
      .from('conversations').select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerParam)
      .eq('shop_id', shopParam)
      .not('last_message_preview', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)

    setSearchParams({})

    if (existing?.[0]) {
      // Existing active conversation — just open it
      selectConversation(existing[0].id)
      return
    }

    // No existing conversation — set pending state so user can compose first message.
    // The conversation is created only when they hit Send.
    const { data: sp } = await supabase
      .from('profiles').select('full_name').eq('id', sellerParam).maybeSingle()
    const sellerName = sp?.full_name ?? 'Seller'

    setPendingProduct({
      sellerId:     sellerParam,
      shopId:       shopParam,
      productId:    productIdParam    ?? '',
      productName:  productNameParam  ?? '',
      productImage: productImageParam ?? '',
      productPrice: productPriceParam ? Number(productPriceParam) : 0,
      sellerName,
    })
    setActiveConvId(null)
    setMobileThread(true)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  /* ── Select an existing conversation ── */
  const selectConversation = useCallback((id: string) => {
    setPendingProduct(null)
    setActiveConvId(id)
    setMobileThread(true)
    setShowEmoji(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }, [])

  /* ── Load messages for active conversation ── */
  useEffect(() => {
    if (!activeConvId || !user) return
    let cancelled = false

    async function loadMessages() {
      setMsgLoading(true)
      setMessages([])

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConvId!)
        .order('created_at', { ascending: true })

      if (!cancelled) {
        setMessages((data ?? []) as unknown as MsgWithSender[])
        setMsgLoading(false)
      }

      await supabase.from('messages').update({ is_read: true })
        .eq('conversation_id', activeConvId!).neq('sender_id', user!.id).eq('is_read', false)
      await supabase.from('conversations').update({ unread_buyer: 0 }).eq('id', activeConvId!)
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unread_buyer: 0 } : c))

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const ch = supabase.channel(`buyer-msg-${activeConvId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`,
        }, async (payload) => {
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

    loadMessages()
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

  /* ── Send message (handles both pending-first-message and normal) ── */
  const sendMessage = async () => {
    if (!input.trim() || !user || isSending) return
    const content = input.trim()
    setInput('')
    setIsSending(true)

    // ── PENDING: first message creates the conversation ──
    if (pendingProduct) {
      const buyerName  = profile?.full_name ?? user.email?.split('@')[0] ?? 'Customer'

      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({
          buyer_id:    user.id,
          seller_id:   pendingProduct.sellerId,
          shop_id:     pendingProduct.shopId,
          product_id:  pendingProduct.productId || null,
          buyer_name:  buyerName,
          seller_name: pendingProduct.sellerName,
        })
        .select('id').single()

      if (convErr || !conv) {
        console.error('Failed to create conversation:', convErr)
        setIsSending(false)
        return
      }

      // Send the product inquiry card first
      if (pendingProduct.productId) {
        await supabase.from('messages').insert({
          conversation_id: conv.id,
          sender_id:       user.id,
          content:         `Hi! I'm interested in "${pendingProduct.productName}". Is it available?`,
          message_type:    'product_inquiry',
          attachment_url:  pendingProduct.productImage || null,
          attachment_meta: {
            product_id:    pendingProduct.productId,
            product_name:  pendingProduct.productName,
            product_price: pendingProduct.productPrice,
            product_image: pendingProduct.productImage,
          },
        })
      }

      // Send the user's typed message
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id:       user.id,
        content,
      })

      setPendingProduct(null)
      setIsSending(false)
      await loadConversations()
      selectConversation(conv.id)
      return
    }

    // ── NORMAL: send in active conversation ──
    if (!activeConvId) { setIsSending(false); return }

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
    setIsSending(false)
    loadConversations()
  }

  /* ── Send image (only in active conversation) ── */
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
    setImgUploading(false)
    loadConversations()
  }

  /* ── Group messages by day ── */
  const grouped: { day: string; msgs: MsgWithSender[] }[] = []
  for (const msg of messages) {
    const day = dayLabel(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  }

  /* ── Filtered conversation list ── */
  const filteredConvs = conversations.filter(c => {
    const name = c.seller_name ?? ''
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message_preview ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesUnread = !filterUnread || c.unread_buyer > 0
    return matchesSearch && matchesUnread
  })

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_buyer ?? 0), 0)

  const myName    = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Me'
  const otherName = activeConv?.seller_name ?? pendingProduct?.sellerName ?? 'Seller'

  /* ── Render ── */
  return (
    <div className="h-screen flex flex-col pt-16 bg-space-900">
      <div className="flex flex-1 overflow-hidden">

        {/* ════ Left Panel: Conversation List ════ */}
        <div className={`
          w-full sm:w-[320px] shrink-0 flex flex-col border-r border-white/8 bg-space-800
          ${mobileThread ? 'hidden sm:flex' : 'flex'}
        `}>
          <div className="px-4 pt-5 pb-3 border-b border-white/8">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-display text-xl font-bold text-white">Messages</h1>
              {totalUnread > 0 && (
                <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalUnread > 99 ? '99+' : totalUnread} unread
                </span>
              )}
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/8 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Unread'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setFilterUnread(tab === 'Unread')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    (tab === 'Unread') === filterUnread
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                  {tab === 'Unread' && totalUnread > 0 && (
                    <span className="ml-1.5 bg-brand-500/30 text-brand-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {convLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-white/20 px-6 text-center">
                <MessageSquare size={32} className="opacity-30" />
                <p className="text-sm">
                  {search || filterUnread
                    ? 'No matching conversations'
                    : 'No conversations yet. Go to any product and tap "Chat with Seller" to start.'}
                </p>
              </div>
            ) : filteredConvs.map(conv => {
              const isActive  = conv.id === activeConvId
              const name      = conv.seller_name ?? 'Seller'
              const initials  = name[0]?.toUpperCase() ?? 'S'
              const hasUnread = conv.unread_buyer > 0
              return (
                <button key={conv.id} type="button" onClick={() => selectConversation(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all ${
                    isActive ? 'bg-brand-500/10 border-l-2 border-brand-500' : 'hover:bg-white/3 border-l-2 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/30 to-space-600 flex items-center justify-center text-white font-bold text-sm border border-white/10">
                      {initials}
                    </div>
                    {hasUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-500 rounded-full border-2 border-space-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-white/25 shrink-0">{relativeTime(conv.last_message_at)}</span>
                    </div>
                    {conv.product && (
                      <p className="text-[11px] text-brand-400/70 truncate mb-0.5">{conv.product.name}</p>
                    )}
                    <p className={`text-xs truncate ${hasUnread ? 'text-white/70' : 'text-white/30'}`}>
                      {conv.last_message_preview ?? ''}
                    </p>
                  </div>
                  {conv.unread_buyer > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                      {conv.unread_buyer > 9 ? '9+' : conv.unread_buyer}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ════ Right Panel: Thread ════ */}
        <div className={`flex-1 flex flex-col min-w-0 bg-space-900 ${!mobileThread ? 'hidden sm:flex' : 'flex'}`}>

          {/* ── Pending: compose first message ── */}
          {pendingProduct && !activeConvId ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 bg-space-800 shrink-0">
                <button type="button" onClick={() => { setMobileThread(false); setPendingProduct(null) }}
                  className="sm:hidden text-white/50 hover:text-white p-1">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/30 to-space-600 flex items-center justify-center text-white font-bold text-sm border border-white/10 shrink-0">
                  {pendingProduct.sellerName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{pendingProduct.sellerName}</p>
                  {pendingProduct.productName && (
                    <p className="text-xs text-brand-400/70 truncate">{pendingProduct.productName}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-end">
                {pendingProduct.productId && (
                  <div className="max-w-sm">
                    <Link to={`/product/${pendingProduct.productId}`}
                      className="flex items-center gap-3 bg-space-700/60 border border-brand-500/25 rounded-xl overflow-hidden hover:border-brand-500/50 transition-colors group">
                      {pendingProduct.productImage ? (
                        <img src={pendingProduct.productImage} alt="" className="w-16 h-16 object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-brand-900/40 flex items-center justify-center text-2xl shrink-0">📦</div>
                      )}
                      <div className="py-2 pr-3 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{pendingProduct.productName}</p>
                        {pendingProduct.productPrice > 0 && (
                          <p className="text-brand-400 font-bold text-sm">₦{pendingProduct.productPrice.toLocaleString()}</p>
                        )}
                        <p className="text-[11px] text-brand-400/60 group-hover:text-brand-400">View Product →</p>
                      </div>
                    </Link>
                    <p className="text-xs text-white/25 mt-3 text-center">
                      Type your message below — this will also send the product card to the seller
                    </p>
                  </div>
                )}
              </div>

              <InputBar
                input={input} setInput={setInput} onSend={sendMessage}
                isSending={isSending} imgUploading={false} onImage={() => {}}
                fileRef={fileRef} inputRef={inputRef} emojiRef={emojiRef}
                showEmoji={showEmoji} setShowEmoji={setShowEmoji}
                placeholder="Write your first message…"
              />
            </>

          /* ── Empty state (no conv selected, no pending) ── */
          ) : !activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/20 p-8">
              <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center">
                <MessageSquare size={36} className="text-brand-500/40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-white/40 mb-1">Your conversations</p>
                <p className="text-sm text-white/20 max-w-xs">
                  Select a conversation or go to any product and tap "Chat with Seller".
                </p>
              </div>
            </div>

          /* ── Active conversation thread ── */
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 bg-space-800 shrink-0">
                <button type="button" onClick={() => setMobileThread(false)}
                  className="sm:hidden text-white/50 hover:text-white p-1 transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500/30 to-space-600 flex items-center justify-center text-white font-bold text-sm border border-white/10 shrink-0">
                  {otherName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-sm truncate">{otherName}</p>
                  {activeConv?.product && (
                    <p className="text-xs text-brand-400/70 truncate">{activeConv.product.name}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {msgLoading ? (
                  <div className="flex justify-center py-12"><Spinner /></div>
                ) : grouped.length === 0 ? (
                  <div className="text-center py-12 text-white/20 text-sm">No messages yet.</div>
                ) : grouped.map(({ day, msgs }) => (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-white/6" />
                      <span className="text-[11px] text-white/20 shrink-0 px-2">{day}</span>
                      <div className="flex-1 h-px bg-white/6" />
                    </div>
                    {msgs.map(msg => {
                      const isMine = msg.sender_id === user!.id
                      return (
                        <MessageBubble key={msg.id} msg={msg} isMine={isMine}
                          senderName={isMine ? myName : otherName} />
                      )
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <InputBar
                input={input} setInput={setInput} onSend={sendMessage}
                isSending={isSending} imgUploading={imgUploading} onImage={sendImage}
                fileRef={fileRef} inputRef={inputRef} emojiRef={emojiRef}
                showEmoji={showEmoji} setShowEmoji={setShowEmoji}
                placeholder="Type a message…"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
