import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Package, MessageCircle, Star, ShieldCheck, CalendarDays, Phone } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { useAuth }    from '@/context/AuthContext'
import { Spinner }    from '@/components/ui/Spinner'
import type { Product } from '@/types'

type Tab = 'products' | 'about'

function memberSince(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { month: 'long', year: 'numeric' })
}

export default function ShopPage() {
  const { slug }   = useParams<{ slug: string }>()
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [tab, setTab] = useState<Tab>('products')

  /* ── Shop ── */
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', slug],
    queryFn:  async () => {
      const { data } = await supabase
        .from('shops').select('*')
        .eq('slug', slug!)
        .eq('status', 'active')
        .eq('kyc_status', 'approved')
        .maybeSingle()
      return data
    },
  })

  /* ── Products ── */
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['shop-products', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase
        .from('products').select('*')
        .eq('shop_id', shop!.id).eq('status', 'active')
        .order('created_at', { ascending: false })
      return (data ?? []) as Product[]
    },
  })

  /* ── Shop rating (avg of all product reviews) ── */
  const { data: ratingData } = useQuery({
    queryKey: ['shop-rating', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase
        .from('reviews')
        .select('rating, products!inner(shop_id)')
        .eq('products.shop_id', shop!.id)
      if (!data || data.length === 0) return null
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length
      return { avg: Math.round(avg * 10) / 10, count: data.length }
    },
  })

  if (shopLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg" /></div>
  )
  if (!shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
      <p className="text-white/50 text-lg">Shop not found</p>
      <Link to="/marketplace" className="text-brand-400 hover:underline">Browse marketplace</Link>
    </div>
  )

  const waNumber    = shop.whatsapp_number?.replace(/[^0-9]/g, '')
  const waUrl       = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi! I found your shop "${shop.name}" on VestaHairHub. I'd like to make an enquiry.`)}` : null
  const isSelfShop  = user?.id === shop.seller_id

  function openChat() {
    const params = new URLSearchParams({ seller: shop!.seller_id, shop: shop!.id })
    navigate(`/messages?${params.toString()}`)
  }

  return (
    <div className="pt-16 pb-20 min-h-screen bg-space-900">

      {/* ═══ Banner ═══ */}
      <div className="relative w-full h-52 sm:h-72 overflow-hidden">
        {shop.banner_url ? (
          <img src={shop.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900 via-brand-800/60 to-space-900" />
        )}
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-space-900 via-space-900/30 to-transparent" />
      </div>

      {/* ═══ Shop Identity Card ═══ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 relative z-10 flex flex-col sm:flex-row sm:items-end gap-5 mb-6">

          {/* Logo */}
          <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-space-900 shadow-2xl overflow-hidden flex items-center justify-center bg-brand-700">
            {shop.logo_url
              ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-3xl">{shop.name[0]?.toUpperCase()}</span>
            }
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">{shop.name}</h1>
              <span className="flex items-center gap-1 text-xs bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
              {/* Rating */}
              {ratingData && (
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-brand-400 text-brand-400" />
                  <span className="text-brand-400 font-semibold">{ratingData.avg}</span>
                  <span className="text-white/35">({ratingData.count} reviews)</span>
                </span>
              )}
              {/* Location */}
              {(shop.city || shop.country) && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {[shop.city, shop.country].filter(Boolean).join(', ')}
                </span>
              )}
              {/* Member since */}
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                Since {memberSince(shop.created_at)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {!isSelfShop && (
            <div className="flex gap-2 shrink-0 pb-1">
              <button
                type="button"
                onClick={openChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-brand-500/20"
              >
                <MessageCircle size={16} />
                Chat Now
              </button>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* ═══ Stats bar ═══ */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Products',    value: products.length },
            { label: 'Reviews',     value: ratingData?.count ?? 0 },
            { label: 'Rating',      value: ratingData ? `${ratingData.avg} / 5` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="glass-dark rounded-2xl px-4 py-3 text-center border border-white/5">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ═══ Tabs ═══ */}
        <div className="flex gap-1 mb-6 border-b border-white/8">
          {(['products', 'about'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors relative ${
                tab === t ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'products' ? `Products (${products.length})` : 'About'}
              {tab === t && (
                <motion.div layoutId="shop-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ═══ Products Tab ═══ */}
        {tab === 'products' && (
          productsLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-white/25">
              <Package size={44} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block">
                  <div className="glass-dark rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/30 transition-all hover:-translate-y-1 duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-square bg-gradient-to-br from-brand-900/30 to-space-800 overflow-hidden relative">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                      }
                      {p.compare_price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          SALE
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      <p className="text-sm font-medium text-white/90 line-clamp-2 leading-snug">{p.name}</p>
                      <div className="mt-auto pt-1">
                        <p className="text-brand-400 font-bold text-sm">₦{p.price.toLocaleString()}</p>
                        {p.compare_price && (
                          <p className="text-white/30 text-xs line-through">₦{p.compare_price.toLocaleString()}</p>
                        )}
                        <p className="text-white/30 text-[11px] mt-0.5">
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* ═══ About Tab ═══ */}
        {tab === 'about' && (
          <div className="max-w-2xl space-y-5">
            {shop.description && (
              <div className="glass-dark rounded-2xl p-5 border border-white/5">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">About this shop</h3>
                <p className="text-white/70 leading-relaxed">{shop.description}</p>
              </div>
            )}

            <div className="glass-dark rounded-2xl p-5 border border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Shop details</h3>

              {(shop.city || shop.country) && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Location</p>
                    <p className="text-white">{[shop.city, shop.country].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                  <CalendarDays size={15} className="text-brand-400" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Member since</p>
                  <p className="text-white">{memberSince(shop.created_at)}</p>
                </div>
              </div>

              {ratingData && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                    <Star size={15} className="text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Customer rating</p>
                    <p className="text-white">{ratingData.avg} / 5 from {ratingData.count} reviews</p>
                  </div>
                </div>
              )}

              {shop.whatsapp_number && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">WhatsApp</p>
                    <p className="text-white">{shop.whatsapp_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact CTA */}
            {!isSelfShop && (
              <div className="flex gap-3">
                <button type="button" onClick={openChat}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors">
                  <MessageCircle size={17} /> Chat with Seller
                </button>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
