import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Store, ShieldOff, ShieldCheck, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

type ShopRow = {
  id:         string
  seller_id:  string
  name:       string
  slug:       string
  status:     string
  country:    string | null
  city:       string | null
  created_at: string
}

export default function AdminShops() {
  const qc = useQueryClient()
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; newStatus: string } | null>(null)

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['admin-shops', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return (data ?? []) as ShopRow[]
    },
  })

  const filtered = shops.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  )

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('shops').update({ status }).eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-shops'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setConfirmAction(null)
    },
  })

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Shop Management</h1>
        <p className="text-white/40 text-sm mt-1">Suspend scam shops or reactivate legitimate sellers</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search shops…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'suspended'].map(s => (
            <button type="button" key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                statusFilter === s
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >{s === 'all' ? 'All' : s}</button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">{filtered.length} shop{filtered.length !== 1 ? 's' : ''}</p>

      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Store size={32} className="mx-auto mb-3 opacity-30" />
            <p>No shops found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs">
                  <th className="px-5 py-3.5 text-left font-medium">Shop</th>
                  <th className="px-5 py-3.5 text-left font-medium">Owner</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden md:table-cell">Location</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden lg:table-cell">Created</th>
                  <th className="px-5 py-3.5 text-left font-medium">Status</th>
                  <th className="px-5 py-3.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(shop => (
                  <tr key={shop.id} className={`hover:bg-white/2 transition-colors ${shop.status === 'suspended' ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-white">{shop.name}</span>
                          <Link to={`/shop/${shop.slug}`} target="_blank"
                            className="text-white/20 hover:text-brand-400 transition-colors">
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                        <p className="text-xs text-white/25">/{shop.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/40 font-mono text-xs">{shop.seller_id.slice(0, 8)}…</td>
                    <td className="px-5 py-4 text-white/40 hidden md:table-cell">
                      {[shop.city, shop.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-4 text-white/40 text-xs hidden lg:table-cell">
                      {new Date(shop.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      {shop.status === 'active'
                        ? <Badge variant="green">Active</Badge>
                        : <Badge variant="red">Suspended</Badge>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setConfirmAction({
                          id: shop.id, name: shop.name,
                          newStatus: shop.status === 'active' ? 'suspended' : 'active',
                        })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          shop.status === 'active'
                            ? 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20'
                        }`}
                      >
                        {shop.status === 'active'
                          ? <><ShieldOff size={11} /> Suspend</>
                          : <><ShieldCheck size={11} /> Reactivate</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmAction(null)}>
          <div className="glass-dark rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white">
              {confirmAction.newStatus === 'suspended' ? 'Suspend' : 'Reactivate'} "{confirmAction.name}"?
            </h3>
            <p className="text-sm text-white/50">
              {confirmAction.newStatus === 'suspended'
                ? 'The shop will be hidden from the marketplace and buyers cannot place new orders.'
                : 'The shop will become visible on the marketplace again.'
              }
            </p>
            <div className="flex gap-3">
              <Button
                isLoading={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: confirmAction.id, status: confirmAction.newStatus })}
                className={`flex-1 ${confirmAction.newStatus === 'suspended' ? '!bg-red-600 hover:!bg-red-700' : ''}`}
              >
                Confirm
              </Button>
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
