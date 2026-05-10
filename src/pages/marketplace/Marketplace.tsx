import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { Spinner }    from '@/components/ui/Spinner'
import { Badge }      from '@/components/ui/Badge'
import type { Product, Category } from '@/types'

export default function Marketplace() {
  const [search, setSearch]         = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(search.get('q') ?? '')
  const categorySlug                 = search.get('category') ?? ''

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return (data ?? []) as Category[]
    },
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['marketplace-products', categorySlug, searchTerm],
    queryFn:  async () => {
      let q = supabase
        .from('products')
        .select('*, shops!inner(name, slug, status)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60)

      if (searchTerm) q = q.ilike('name', `%${searchTerm}%`)

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug)
        if (cat) q = q.eq('category_id', cat.id)
      }

      const { data } = await q
      return (data ?? []) as unknown as (Product & { shops: { name: string; slug: string; status: string } | null })[]
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    search.set('q', searchTerm)
    setSearch(search)
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-white mb-2">Marketplace</h1>
        <p className="text-white/50">Browse authentic African beauty products from trusted sellers</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </form>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { search.delete('category'); setSearch(search) }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !categorySlug ? 'bg-brand-500 text-white' : 'glass text-white/60 hover:text-white border border-white/10'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => { search.set('category', c.slug); setSearch(search) }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              categorySlug === c.slug ? 'bg-brand-500 text-white' : 'glass text-white/60 hover:text-white border border-white/10'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-white/30">No products found. Try a different search.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.6) }}
            >
              <Link to={`/product/${p.id}`} className="block group">
                <div className="glass-dark rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
                  {/* Image placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-brand-900/40 to-space-800 flex items-center justify-center text-5xl">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : '📦'}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-white/40 truncate mt-0.5">{p.shops?.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-brand-400 font-bold text-sm">₦{p.price.toLocaleString()}</span>
                      {p.compare_price && (
                        <span className="text-white/30 text-xs line-through">₦{p.compare_price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
