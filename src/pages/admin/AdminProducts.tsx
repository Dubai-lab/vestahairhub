import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Package, EyeOff, Eye, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

export default function AdminProducts() {
  const qc = useQueryClient()
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('id, name, price, stock, status, images, shop_id, created_at, shops(name, slug)')
        .order('created_at', { ascending: false })
        .limit(300)
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return (data ?? []) as any[]
    },
  })

  const filtered = products.filter((p: any) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.shops?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('products').update({ status }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('products').delete().eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      setConfirmDelete(null)
    },
  })

  const statusBadge = (s: string) => {
    if (s === 'active')       return <Badge variant="green">Active</Badge>
    if (s === 'draft')        return <Badge variant="gray">Draft</Badge>
    if (s === 'out_of_stock') return <Badge variant="red">Out of Stock</Badge>
    return <Badge variant="gray">{s}</Badge>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Product Moderation</h1>
        <p className="text-white/40 text-sm mt-1">Hide or remove listings that violate platform policy</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by product or shop…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'draft', 'out_of_stock'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>

      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs">
                  <th className="px-5 py-3.5 text-left font-medium">Product</th>
                  <th className="px-5 py-3.5 text-left font-medium">Shop</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden md:table-cell">Price</th>
                  <th className="px-5 py-3.5 text-left font-medium hidden md:table-cell">Stock</th>
                  <th className="px-5 py-3.5 text-left font-medium">Status</th>
                  <th className="px-5 py-3.5 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((product: any) => (
                  <tr key={product.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-space-700 shrink-0 border border-white/5">
                          {product.images?.[0]
                            ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-white line-clamp-1">{product.name}</span>
                            <Link to={`/product/${product.id}`} target="_blank"
                              className="text-white/20 hover:text-brand-400 shrink-0 transition-colors">
                              <ExternalLink size={11} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/shop/${product.shops?.slug}`} target="_blank"
                        className="text-white/50 hover:text-brand-400 transition-colors text-xs">
                        {product.shops?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-brand-400 font-medium hidden md:table-cell">
                      ₦{product.price.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-white/40 hidden md:table-cell">{product.stock}</td>
                    <td className="px-5 py-4">{statusBadge(product.status)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {product.status === 'active' ? (
                          <button
                            onClick={() => updateStatus.mutate({ id: product.id, status: 'draft' })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                          >
                            <EyeOff size={11} /> Hide
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus.mutate({ id: product.id, status: 'active' })}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all"
                          >
                            <Eye size={11} /> Show
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete({ id: product.id, name: product.name })}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}>
          <div className="glass-dark rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white">Delete "{confirmDelete.name}"?</h3>
            <p className="text-sm text-white/50">This permanently removes the listing. This cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                isLoading={deleteProduct.isPending}
                onClick={() => deleteProduct.mutate(confirmDelete.id)}
                className="flex-1 !bg-red-600 hover:!bg-red-700"
              >
                Delete Permanently
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
