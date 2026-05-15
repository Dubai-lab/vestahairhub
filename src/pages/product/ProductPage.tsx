import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Store, Star, Play, ChevronLeft, ChevronRight, ZoomIn, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase }        from '@/lib/supabase'
import { formatPrice }     from '@/lib/currencies'
import { useCartStore }    from '@/store/cartStore'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { Spinner }         from '@/components/ui/Spinner'
import { ReviewSection }   from '@/components/ui/ReviewSection'
import type { Product }    from '@/types'

type SizeVariant = { name: string; price_add: number }

type MediaItem = { type: 'image'; src: string } | { type: 'video'; src: string }

function buildMedia(images: string[], videoUrl: string | null): MediaItem[] {
  const items: MediaItem[] = (images ?? []).map(src => ({ type: 'image', src }))
  if (videoUrl) items.push({ type: 'video', src: videoUrl })
  return items
}

/* ── Media Viewer ─────────────────────────────────────────────────────────── */
function MediaViewer({ media }: { media: MediaItem[] }) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const current = media[active] ?? null
  const prev = () => { setZoomed(false); setActive(i => (i - 1 + media.length) % media.length) }
  const next = () => { setZoomed(false); setActive(i => (i + 1) % media.length) }

  if (!current) {
    return (
      <div className="aspect-square glass-dark rounded-3xl flex items-center justify-center text-[120px]">📦</div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative aspect-square glass-dark rounded-3xl overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full"
          >
            {current.type === 'image' ? (
              <img
                src={current.src}
                alt="Product"
                className={`w-full h-full object-cover transition-transform duration-500 ${zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-105'}`}
                onClick={() => setZoomed(z => !z)}
              />
            ) : (
              <video
                src={current.src}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {current.type === 'image' && !zoomed && (
          <div className="absolute bottom-3 right-3 bg-black/50 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <ZoomIn size={14} className="text-white/70" />
          </div>
        )}

        {media.length > 1 && (
          <>
            <button type="button" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-brand-500/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-brand-500/80 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {media.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
            {active + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {media.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActive(i); setZoomed(false) }}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-brand-500 scale-105' : 'border-white/10 hover:border-white/30'
              }`}
            >
              {item.type === 'image' ? (
                <img src={item.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center relative">
                  <video src={item.src} className="w-full h-full object-cover opacity-60" muted />
                  <Play size={20} className="absolute text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Product Page ──────────────────────────────────────────────────────────── */
export default function ProductPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem  = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)

  // Variant selections
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize,  setSelectedSize]  = useState<SizeVariant | null>(null)

  const { data: ratingData } = useQuery({
    queryKey: ['product-rating', id],
    queryFn: async () => {
      const { data } = await supabase.from('reviews').select('rating').eq('product_id', id!)
      return (data ?? []) as { rating: number }[]
    },
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn:  async () => {
      const { data } = await supabase
        .from('products')
        .select('*, shops(*), categories(*)')
        .eq('id', id!)
        .maybeSingle()
      return data as (Product & {
        shops:      { id: string; name: string; slug: string; seller_id: string; whatsapp_number: string | null; currency: string; kyc_status: string } | null
        categories: { name: string } | null
      }) | null
    },
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pt-24"><Spinner size="lg" /></div>
  )

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
      <p className="text-white/50">Product not found</p>
      <Link to="/marketplace" className="text-brand-400 hover:underline">Back to marketplace</Link>
    </div>
  )

  if (product.shops && product.shops.kyc_status !== 'approved') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24 text-center px-4">
      <p className="text-white/50 text-lg">This shop is pending verification</p>
      <p className="text-white/30 text-sm max-w-sm">This seller is currently completing identity verification. Products will be visible once their shop is approved.</p>
      <Link to="/marketplace" className="text-brand-400 hover:underline text-sm">Browse other products</Link>
    </div>
  )

  const colors = (product.colors as string[] | null) ?? []
  const sizes  = (product.sizes  as SizeVariant[] | null) ?? []

  const media    = buildMedia(product.images ?? [], product.video_url ?? null)
  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : null

  // Dynamic total = base price + selected size's extra price
  const totalPrice = product.price + (selectedSize?.price_add ?? 0)

  // Add to cart is disabled if there are variants the buyer hasn't chosen yet
  const needsColor = colors.length > 0 && !selectedColor
  const needsSize  = sizes.length  > 0 && !selectedSize
  const canAddToCart = product.stock > 0 && !needsColor && !needsSize

  const waNumber = product.shops?.whatsapp_number?.replace(/[^0-9]/g, '')
  const waText   = encodeURIComponent(
    `Hi! I'm interested in "${product.name}" from ${product.shops?.name}. Is it still available?`
  )
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/30 mb-6">
        <Link to="/marketplace" className="hover:text-brand-400 transition-colors">Marketplace</Link>
        <span>/</span>
        {product.categories && <span>{product.categories.name}</span>}
        {product.categories && <span>/</span>}
        <span className="text-white/60 truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Left: media gallery ── */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <MediaViewer media={media} />
        </motion.div>

        {/* ── Right: product details ── */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
          {product.categories && <Badge variant="gold">{product.categories.name}</Badge>}

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">{product.name}</h1>

          {/* Stars summary */}
          {ratingData && ratingData.length > 0 ? (() => {
            const avg = ratingData.reduce((s, r) => s + r.rating, 0) / ratingData.length
            const rounded = Math.round(avg)
            return (
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className={i <= rounded ? 'fill-brand-400 text-brand-400' : 'fill-transparent text-white/20'} />
                ))}
                <span className="text-sm font-medium text-brand-400">{avg.toFixed(1)}</span>
                <span className="text-sm text-white/40">({ratingData.length} review{ratingData.length !== 1 ? 's' : ''}) · See below</span>
              </div>
            )
          })() : (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="fill-transparent text-white/20" />)}
              <span className="text-sm text-white/40">No reviews yet</span>
            </div>
          )}

          {/* Price — updates dynamically when size selected */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-brand-400">{formatPrice(totalPrice, product.shops?.currency)}</span>
            {selectedSize && selectedSize.price_add > 0 && (
              <span className="text-sm text-white/40">
                Base {formatPrice(product.price, product.shops?.currency)} + {formatPrice(selectedSize.price_add, product.shops?.currency)} ({selectedSize.name})
              </span>
            )}
            {product.compare_price && (
              <>
                <span className="text-white/30 text-xl line-through">{formatPrice(product.compare_price, product.shops?.currency)}</span>
                <Badge variant="red">{discount}% OFF</Badge>
              </>
            )}
          </div>

          {/* Stock */}
          <div>
            {product.stock > 0
              ? <Badge variant="green">In Stock ({product.stock} available)</Badge>
              : <Badge variant="red">Out of Stock</Badge>
            }
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-white/55 leading-relaxed text-sm">{product.description}</p>
          )}

          {/* ── Color swatches ── */}
          {colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/70">Color</span>
                {selectedColor ? (
                  <span className="text-xs text-white/40">{selectedColor}</span>
                ) : (
                  <span className="text-xs text-amber-400/80">— select a color</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map(hex => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setSelectedColor(hex === selectedColor ? null : hex)}
                    title={hex}
                    className={`w-9 h-9 rounded-lg border-2 transition-all ${
                      selectedColor === hex
                        ? 'border-brand-400 scale-110 shadow-lg shadow-brand-400/30'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Size grid ── */}
          {sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/70">Size</span>
                {selectedSize ? (
                  <span className="text-xs text-white/40">{selectedSize.name}</span>
                ) : (
                  <span className="text-xs text-amber-400/80">— select a size</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setSelectedSize(s.name === selectedSize?.name ? null : s)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedSize?.name === s.name
                        ? 'bg-brand-500/20 border-brand-400 text-brand-400 scale-105'
                        : 'bg-white/5 border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    <span>{s.name}</span>
                    {s.price_add > 0 && (
                      <span className={`ml-1.5 text-xs ${selectedSize?.name === s.name ? 'text-brand-300' : 'text-white/40'}`}>
                        +{formatPrice(s.price_add, product.shops?.currency)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/50">Quantity:</span>
              <div className="flex items-center glass-dark rounded-xl border border-white/10 overflow-hidden">
                <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-lg font-medium">−</button>
                <span className="px-5 py-2 text-white font-semibold min-w-[3rem] text-center">{qty}</span>
                <button type="button" onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-lg font-medium">+</button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              variant="primary"
              leftIcon={<ShoppingBag size={18} />}
              disabled={!canAddToCart}
              onClick={() => {
                for (let i = 0; i < qty; i++) {
                  addItem(product, 1, selectedColor, selectedSize)
                }
              }}
              className="flex-1"
            >
              {product.stock === 0
                ? 'Out of Stock'
                : needsColor
                  ? 'Select a Color'
                  : needsSize
                    ? 'Select a Size'
                    : `Add to Cart · ${formatPrice(totalPrice, product.shops?.currency)}`
              }
            </Button>
          </div>

          {/* Contact buttons */}
          {product.shops && (
            <div className="flex gap-2 flex-wrap">
              {/* In-app Chat */}
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams({
                    seller:       product.shops!.seller_id,
                    shop:         product.shops!.id,
                    product:      product.id,
                    productName:  product.name,
                    productImage: product.images?.[0] ?? '',
                    productPrice: String(product.price),
                  })
                  navigate(`/messages?${params.toString()}`)
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/15 hover:bg-brand-500/25 border border-brand-500/30 text-brand-400 text-sm font-medium transition-all"
              >
                <MessageCircle size={16} />
                Chat with Seller
              </button>

              {/* WhatsApp */}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 text-sm font-medium transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          )}

          {/* Shop card */}
          {product.shops && (
            <Link
              to={`/shop/${product.shops.slug}`}
              className="flex items-center gap-3 glass-dark rounded-2xl px-4 py-3 hover:border-brand-500/30 border border-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                <Store size={16} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{product.shops.name}</p>
                <p className="text-xs text-white/40">Visit Shop →</p>
              </div>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Reviews section */}
      <div className="mt-14">
        <ReviewSection productId={product.id} productName={product.name} />
      </div>

    </div>
  )
}
