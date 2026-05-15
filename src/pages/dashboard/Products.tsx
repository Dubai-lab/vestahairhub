import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Package, Edit2, Trash2, X, Video, Palette, Ruler } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { useAuth }    from '@/context/AuthContext'
import { Button }     from '@/components/ui/Button'
import { Input }      from '@/components/ui/Input'
import { Badge }      from '@/components/ui/Badge'
import { Spinner }    from '@/components/ui/Spinner'
import { ProductMediaUploader } from '@/components/ui/ProductMediaUploader'
import type { Product } from '@/types'

type SizeVariant = { name: string; price_add: number }

const schema = z.object({
  name:          z.string().min(2, 'Product name required'),
  description:   z.string().optional(),
  price:         z.coerce.number().min(0.01, 'Price must be greater than 0'),
  compare_price: z.coerce.number().optional(),
  stock:         z.coerce.number().int().min(0),
  category_id:   z.string().min(1, 'Select a category'),
  status:        z.enum(['active', 'draft', 'out_of_stock']),
})
type FormData = z.infer<typeof schema>

const STATUS_BADGE = {
  active:       { label: 'Active',       variant: 'green' as const },
  draft:        { label: 'Draft',        variant: 'gray'  as const },
  out_of_stock: { label: 'Out of Stock', variant: 'red'   as const },
}

export default function Products() {
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [showForm, setShowForm]    = useState(false)
  const [editing,  setEditing]     = useState<Product | null>(null)
  const [mediaImages, setMediaImages] = useState<string[]>([])
  const [mediaVideo,  setMediaVideo]  = useState<string | null>(null)

  // Color state
  const [colorList,   setColorList]   = useState<string[]>([])
  const [colorInput,  setColorInput]  = useState('#8B4513')
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Size variants state
  const [sizeList,    setSizeList]    = useState<SizeVariant[]>([])
  const [sizeName,    setSizeName]    = useState('')
  const [sizePriceAdd, setSizePriceAdd] = useState('')

  const { data: shop } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      return data ?? []
    },
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase.from('products').select('*').eq('shop_id', shop!.id).order('created_at', { ascending: false })
      return (data ?? []) as Product[]
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', stock: 0 },
  })

  const openNew  = () => {
    setEditing(null)
    setMediaImages([])
    setMediaVideo(null)
    setColorList([])
    setColorInput('#8B4513')
    setSizeList([])
    setSizeName('')
    setSizePriceAdd('')
    reset({ status: 'active', stock: 0 })
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setMediaImages(p.images ?? [])
    setMediaVideo(p.video_url ?? null)
    setColorList((p.colors as string[] | null) ?? [])
    setColorInput('#8B4513')
    setSizeList((p.sizes as SizeVariant[] | null) ?? [])
    setSizeName('')
    setSizePriceAdd('')
    reset({
      name:          p.name,
      description:   p.description ?? '',
      price:         p.price,
      compare_price: p.compare_price ?? undefined,
      stock:         p.stock,
      category_id:   p.category_id,
      status:        p.status as 'active' | 'draft' | 'out_of_stock',
    })
    setShowForm(true)
  }

  const addColor = () => {
    if (!colorList.includes(colorInput)) {
      setColorList(prev => [...prev, colorInput])
    }
  }

  const removeColor = (hex: string) => {
    setColorList(prev => prev.filter(c => c !== hex))
  }

  const addSize = () => {
    const name     = sizeName.trim()
    const priceAdd = parseFloat(sizePriceAdd)
    if (!name || isNaN(priceAdd) || priceAdd < 0) return
    if (sizeList.some(s => s.name === name)) return
    setSizeList(prev => [...prev, { name, price_add: priceAdd }])
    setSizeName('')
    setSizePriceAdd('')
  }

  const removeSize = (name: string) => {
    setSizeList(prev => prev.filter(s => s.name !== name))
  }

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const saveProduct = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        images:    mediaImages,
        video_url: mediaVideo ?? null,
        colors:    colorList.length   > 0 ? colorList : [],
        sizes:     sizeList.length    > 0 ? sizeList  : [],
      }
      if (editing) {
        await supabase.from('products').update(payload).eq('id', editing.id)
      } else {
        await supabase.from('products').insert({ ...payload, shop_id: shop!.id, slug: slugify(data.name) })
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowForm(false) },
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => { await supabase.from('products').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  if (!shop) return (
    <div className="glass-dark rounded-2xl p-10 text-center text-white/40">
      Create your shop in Shop Settings first.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Products</h1>
          <p className="text-white/45 mt-1 text-sm">{products.length} product{products.length !== 1 ? 's' : ''} in your shop</p>
        </div>
        <Button onClick={openNew} leftIcon={<Plus size={16} />}>Add Product</Button>
      </div>

      {/* Form drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{  opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit((d) => saveProduct.mutateAsync(d))}
              className="glass-dark rounded-2xl p-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-lg">{editing ? 'Edit Product' : 'New Product'}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Media uploader — full width, at top */}
              <ProductMediaUploader
                shopId={shop.id}
                initialImages={editing?.images ?? []}
                initialVideo={editing?.video_url ?? null}
                onImagesChange={setMediaImages}
                onVideoChange={setMediaVideo}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input {...register('name')} label="Product name" placeholder="e.g. Brazilian Wave Hair Bundle" error={errors.name?.message} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Category</label>
                  <select
                    {...register('category_id')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-space-800">{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-xs text-red-400">{errors.category_id.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Describe your product…"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input {...register('price')}         label="Base price" type="number" step="0.01" min="0" placeholder="0.00" error={errors.price?.message} />
                <Input {...register('compare_price')} label="Old price (optional)" type="number" step="0.01" min="0" placeholder="0.00" />
                <Input {...register('stock')}         label="Stock qty" type="number" min="0" placeholder="0" error={errors.stock?.message} />
              </div>

              {/* ── Color swatches ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette size={15} className="text-brand-400" />
                  <span className="text-sm font-medium text-white/70">Hair Colors</span>
                  <span className="text-xs text-white/30">(optional — add each color available)</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {colorList.map(hex => (
                    <div key={hex} className="relative group">
                      <div
                        className="w-9 h-9 rounded-lg border-2 border-white/20 cursor-default"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(hex)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Color picker trigger */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg border-2 border-dashed border-white/20 cursor-pointer relative overflow-hidden hover:border-brand-500 transition-colors"
                      style={{ backgroundColor: colorInput }}
                      onClick={() => colorInputRef.current?.click()}
                      title="Pick color"
                    >
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={colorInput}
                        onChange={e => setColorInput(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addColor}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Plus size={12} /> Add color
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Size variants ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ruler size={15} className="text-brand-400" />
                  <span className="text-sm font-medium text-white/70">Size Variants</span>
                  <span className="text-xs text-white/30">(optional — each size can have an extra price)</span>
                </div>

                {/* Existing sizes */}
                {sizeList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sizeList.map(s => (
                      <div key={s.name} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                        <span className="text-sm font-medium text-white">{s.name}</span>
                        {s.price_add > 0 && (
                          <span className="text-xs text-brand-400">+{s.price_add}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSize(s.name)}
                          className="text-white/30 hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add size row */}
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs text-white/50">Size name</label>
                    <input
                      type="text"
                      value={sizeName}
                      onChange={e => setSizeName(e.target.value)}
                      placeholder='e.g. 16 inch'
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }}
                    />
                  </div>
                  <div className="w-36 space-y-1.5">
                    <label className="text-xs text-white/50">Extra price (+)</label>
                    <input
                      type="number"
                      value={sizePriceAdd}
                      onChange={e => setSizePriceAdd(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSize() } }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSize}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 border border-brand-500/30 rounded-xl px-3 py-2 transition-colors whitespace-nowrap"
                  >
                    <Plus size={12} /> Add size
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Status</label>
                <select
                  {...register('status')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="active"       className="bg-space-800">Active — visible to buyers</option>
                  <option value="draft"        className="bg-space-800">Draft — hidden</option>
                  <option value="out_of_stock" className="bg-space-800">Out of Stock</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>{editing ? 'Save Changes' : 'Add Product'}</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : products.length === 0 ? (
        <div className="glass-dark rounded-2xl p-16 text-center">
          <Package size={48} className="text-white/15 mx-auto mb-4" />
          <p className="text-white/40">No products yet. Add your first product above.</p>
        </div>
      ) : (
        <div className="glass-dark rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {products.map((p) => {
              const badge    = STATUS_BADGE[p.status as keyof typeof STATUS_BADGE] ?? STATUS_BADGE.draft
              const colors   = (p.colors as string[] | null) ?? []
              const sizes    = (p.sizes  as SizeVariant[] | null) ?? []
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-900/40 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-white/40">Stock: {p.stock}</p>
                      {(p.images?.length ?? 0) > 0 && (
                        <span className="text-xs text-white/25">{p.images.length} photo{p.images.length !== 1 ? 's' : ''}</span>
                      )}
                      {p.video_url && (
                        <span className="flex items-center gap-0.5 text-xs text-brand-500/60">
                          <Video size={10} /> video
                        </span>
                      )}
                      {/* Color dots */}
                      {colors.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          {colors.slice(0, 5).map(hex => (
                            <span key={hex} className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{ backgroundColor: hex }} />
                          ))}
                          {colors.length > 5 && <span className="text-xs text-white/25">+{colors.length - 5}</span>}
                        </span>
                      )}
                      {/* Size count */}
                      {sizes.length > 0 && (
                        <span className="text-xs text-white/25">{sizes.length} size{sizes.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-brand-400">₦{p.price.toLocaleString()}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    <button type="button" onClick={() => openEdit(p)} className="text-white/30 hover:text-brand-400 transition-colors"><Edit2 size={16} /></button>
                    <button type="button" onClick={() => deleteProduct.mutate(p.id)} className="text-white/30 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
