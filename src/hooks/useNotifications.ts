import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'

export type AppNotification = {
  id:         string
  user_id:    string
  type:       string
  title:      string
  body:       string
  data:       Record<string, unknown>
  read_at:    string | null
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data as AppNotification[])
      setUnread(data.filter((n) => !n.read_at).length)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchAll()

    const channel = supabase
      .channel(`notifs-${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as AppNotification
          setNotifications((prev) => [n, ...prev].slice(0, 50))
          setUnread((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAll])

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
      .is('read_at', null)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)),
      )
      setUnread((prev) => Math.max(0, prev - 1))
    }
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (unreadIds.length === 0) return

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .in('id', unreadIds)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
      setUnread(0)
    }
  }, [user, notifications])

  const deleteOne = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id)
      if (removed && !removed.read_at) setUnread((u) => Math.max(0, u - 1))
      return prev.filter((n) => n.id !== id)
    })
  }, [])

  return { notifications, unread, loading, markRead, markAllRead, deleteOne, refetch: fetchAll }
}
