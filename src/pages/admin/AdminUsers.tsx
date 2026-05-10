import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Ban, CheckCircle, User, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type Profile = {
  id:            string
  full_name:     string | null
  role:          string
  phone:         string | null
  country:       string | null
  is_banned:     boolean
  banned_reason: string | null
  created_at:    string
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('all')
  const [confirmBan,  setConfirmBan]  = useState<{ id: string; name: string; ban: boolean } | null>(null)
  const [banReason,   setBanReason]   = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (roleFilter !== 'all') q = q.eq('role', roleFilter)
      const { data } = await q
      return (data ?? []) as Profile[]
    },
  })

  const filtered = users.filter(u =>
    !search || (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggleBan = useMutation({
    mutationFn: async ({ id, ban, reason }: { id: string; ban: boolean; reason?: string }) => {
      await supabase.from('profiles').update({
        is_banned:     ban,
        banned_reason: ban ? (reason || null) : null,
        banned_at:     ban ? new Date().toISOString() : null,
      }).eq('id', id)
      if (ban) {
        await supabase.from('shops').update({ status: 'suspended' }).eq('seller_id', id)
      } else {
        await supabase.from('shops').update({ status: 'active' }).eq('seller_id', id)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setConfirmBan(null)
      setBanReason('')
    },
  })

  const makeAdmin = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const roleBadge = (role: string) => {
    if (role === 'admin')  return <Badge variant="gold">Admin</Badge>
    if (role === 'seller') return <Badge variant="blue">Seller</Badge>
    return <Badge variant="gray">Buyer</Badge>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">User Management</h1>
        <p className="text-white/40 text-sm mt-1">Ban scammers, manage roles, track suspicious accounts</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'buyer', 'seller', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                roleFilter === r
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <User size={32} className="mx-auto mb-3 opacity-30" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs">
                  <th className="px-5 py-3.5 text-left font-medium">User</th>
                  <th className="px-5 py-3.5 text-left font-medium">Role</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden md:table-cell">Country</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3.5 text-left font-medium">Status</th>
                  <th className="px-5 py-3.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(user => (
                  <tr key={user.id} className={`hover:bg-white/2 transition-colors ${user.is_banned ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 font-bold text-xs shrink-0">
                          {(user.full_name?.[0] ?? '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.full_name ?? '(unnamed)'}</p>
                          <p className="text-xs text-white/25 font-mono">{user.id.slice(0, 8)}…</p>
                          {user.is_banned && user.banned_reason && (
                            <p className="text-xs text-red-400/70 mt-0.5">Ban reason: {user.banned_reason}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{roleBadge(user.role)}</td>
                    <td className="px-5 py-4 text-white/40 hidden md:table-cell">{user.country ?? '—'}</td>
                    <td className="px-5 py-4 text-white/40 text-xs hidden lg:table-cell">
                      {new Date(user.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {user.is_banned
                        ? <Badge variant="red">Banned</Badge>
                        : <Badge variant="green">Active</Badge>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmBan({ id: user.id, name: user.full_name ?? 'this user', ban: !user.is_banned })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                            user.is_banned
                              ? 'bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                          }`}
                        >
                          {user.is_banned ? <><CheckCircle size={11} /> Unban</> : <><Ban size={11} /> Ban</>}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => makeAdmin.mutate(user.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-all"
                          >
                            <ShieldCheck size={11} /> Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ban confirm modal */}
      {confirmBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmBan(null)}>
          <div className="glass-dark rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg">
              {confirmBan.ban ? '🚫 Ban' : '✅ Unban'} {confirmBan.name}?
            </h3>
            {confirmBan.ban ? (
              <div className="space-y-3">
                <p className="text-sm text-white/55">
                  This will ban the account and suspend their shop. They will lose access to seller features.
                </p>
                <textarea
                  value={banReason} onChange={e => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for ban (scam, fraud, policy violation…)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:border-brand-500"
                />
              </div>
            ) : (
              <p className="text-sm text-white/55">
                This will restore their account and reactivate their shop.
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                isLoading={toggleBan.isPending}
                onClick={() => toggleBan.mutate({ id: confirmBan.id, ban: confirmBan.ban, reason: banReason })}
                className={`flex-1 ${confirmBan.ban ? '!bg-red-600 hover:!bg-red-700' : ''}`}
              >
                {confirmBan.ban ? 'Confirm Ban' : 'Unban User'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmBan(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
