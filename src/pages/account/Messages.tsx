import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Spinner }  from '@/components/ui/Spinner'
import type { Conversation as ConversationRow, Message as MessageRow } from '@/types'

type Conv = ConversationRow & {
  seller:  { full_name: string | null } | null
  product: { name: string; images: string[] } | null
}
type MsgWithSender = MessageRow & { sender: { full_name: string | null } | null }

function formatTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function BuyerMessages() {
  const { user, profile }  = useAuth()
  const qc                  = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages,     setMessages]     = useState<MsgWithSender[]>([])
  const [input,        setInput]        = useState('')
  const [isSending,    setIsSending]    = useState(false)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [mobileThread, setMobileThread] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['buyer-conversations', user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, seller:profiles!seller_id(full_name), product:products(name, images)')
        .eq('buyer_id', user!.id)
        .order('last_message_at', { ascending: false })
      return (data ?? []) as unknown as Conv[]
    },
  })

  useEffect(() => {
    if (!activeConvId || !user) return
    let cancelled = false

    async function loadMessages() {
      setLoadingMsgs(true)
      setMessages([])

      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(full_name)')
        .eq('conversation_id', activeConvId!)
        .order('created_at', { ascending: true })

      if (!cancelled) { setMessages((data ?? []) as unknown as MsgWithSender[]); setLoadingMsgs(false) }

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', activeConvId!)
        .neq('sender_id', user!.id)
        .eq('is_read', false)

      if (channelRef.current) supabase.removeChannel(channelRef.current)
      const ch = supabase
        .channel(`buyer-chat-${activeConvId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`,
        }, async (payload) => {
          const { data: sp } = await supabase
            .from('profiles').select('full_name').eq('id', (payload.new as MessageRow).sender_id).maybeSingle()
          const newMsg: MsgWithSender = { ...(payload.new as MessageRow), sender: sp }
          setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
          qc.invalidateQueries({ queryKey: ['buyer-conversations'] })
        })
        .subscribe()
      channelRef.current = ch
    }

    loadMessages()
    return () => {
      cancelled = true
      if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null }
    }
  }, [activeConvId, user, qc])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || !user || isSending) return
    const content = input.trim()
    setInput('')
    setIsSending(true)

    const tempMsg: MsgWithSender = {
      id: `temp-${Date.now()}`, conversation_id: activeConvId,
      sender_id: user.id, content, is_read: false,
      created_at: new Date().toISOString(),
      sender: { full_name: profile?.full_name ?? 'You' },
    }
    setMessages(prev => [...prev, tempMsg])

    const { data: inserted } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConvId, sender_id: user.id, content })
      .select('id').single()

    if (inserted) setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, id: inserted.id } : m))
    setIsSending(false)
    qc.invalidateQueries({ queryKey: ['buyer-conversations'] })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <h1 className="font-display text-4xl font-bold text-white">Messages</h1>

      <div className="glass-dark rounded-2xl overflow-hidden border border-white/5 flex h-[calc(100vh-220px)] min-h-[480px]">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 shrink-0 border-r border-white/8 flex flex-col ${mobileThread ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-white/8">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Your Conversations</p>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center"><Spinner /></div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-white/20 p-6 text-center">
              <MessageSquare size={32} className="opacity-30" />
              <p className="text-sm">No messages yet.<br />Chat with a seller from any product page.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {conversations.map(conv => {
                const isActive   = conv.id === activeConvId
                const sellerName = conv.seller?.full_name ?? 'Seller'
                const initials   = sellerName[0]?.toUpperCase() ?? '?'

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => { setActiveConvId(conv.id); setMobileThread(true); setTimeout(() => inputRef.current?.focus(), 300) }}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive ? 'bg-brand-500/10 border-l-2 border-brand-500' : 'hover:bg-white/3'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-space-600 flex items-center justify-center text-white/60 font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-white truncate">{sellerName}</span>
                        <span className="text-[10px] text-white/25 shrink-0">{formatTime(conv.last_message_at)}</span>
                      </div>
                      {conv.product && <p className="text-[11px] text-brand-400/70 truncate">{conv.product.name}</p>}
                      <p className="text-xs text-white/35 truncate mt-0.5">{conv.last_message_preview ?? '…'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Thread panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${!mobileThread ? 'hidden sm:flex' : 'flex'}`}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20">
              <MessageSquare size={40} className="opacity-20" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
                <button type="button" onClick={() => setMobileThread(false)} className="sm:hidden text-white/50 hover:text-white p-1">
                  <ArrowLeft size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-space-600 flex items-center justify-center text-white/60 font-bold text-sm">
                  {(activeConv?.seller?.full_name ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{activeConv?.seller?.full_name ?? 'Seller'}</p>
                  {activeConv?.product && <p className="text-xs text-white/35 truncate">{activeConv.product.name}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-white/25 text-sm">No messages yet.</div>
                ) : messages.map(msg => {
                  const isMine   = msg.sender_id === user!.id
                  const initials = (msg.sender?.full_name ?? '?')[0]?.toUpperCase()
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 ${isMine ? 'bg-brand-500/30 text-brand-300' : 'bg-space-600 text-white/60'}`}>
                        {initials}
                      </div>
                      <div className={`max-w-[72%] rounded-2xl px-3.5 py-2.5 ${isMine ? 'bg-brand-500/25 border border-brand-500/30 rounded-tr-sm' : 'bg-white/5 border border-white/8 rounded-tl-sm'}`}>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-400/60 text-right' : 'text-white/25'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="px-4 py-3 border-t border-white/8 shrink-0">
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
                    className="w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
                  >
                    {isSending ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
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
