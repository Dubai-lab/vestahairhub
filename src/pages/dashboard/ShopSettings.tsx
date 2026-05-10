import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { useAuth }    from '@/context/AuthContext'
import { Button }     from '@/components/ui/Button'
import { Input }      from '@/components/ui/Input'
import { Spinner }    from '@/components/ui/Spinner'

const schema = z.object({
  name:             z.string().min(2, 'Shop name must be at least 2 characters'),
  slug:             z.string().min(2).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  description:      z.string().optional(),
  country:          z.string().optional(),
  city:             z.string().optional(),
  theme_color:      z.string().optional(),
  whatsapp_number:  z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ShopSettings() {
  const { user } = useAuth()
  const qc       = useQueryClient()

  const { data: shop, isLoading } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (shop) reset({
      name:            shop.name,
      slug:            shop.slug,
      description:     shop.description ?? '',
      country:         shop.country ?? '',
      city:            shop.city ?? '',
      theme_color:     shop.theme_color,
      whatsapp_number: shop.whatsapp_number ?? '',
    })
  }, [shop, reset])

  const save = useMutation({
    mutationFn: async (data: FormData) => {
      if (shop) {
        await supabase.from('shops').update(data).eq('id', shop.id)
      } else {
        await supabase.from('shops').insert({ seller_id: user!.id, ...data, status: 'active' })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-shop'] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Shop Settings</h1>
        <p className="text-white/45 mt-1 text-sm">
          {shop ? 'Update your shop details' : 'Create your shop to start selling'}
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit((d) => save.mutateAsync(d))}
        className="glass-dark rounded-2xl p-6 space-y-5"
      >
        <Input
          {...register('name')}
          label="Shop name"
          placeholder="e.g. Amara's Hair Collection"
          error={errors.name?.message}
        />
        <Input
          {...register('slug')}
          label="Shop URL slug"
          placeholder="e.g. amaras-hair"
          error={errors.slug?.message}
          className="lowercase"
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe your shop and the products you sell…"
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input {...register('country')} label="Country" placeholder="e.g. Nigeria" />
          <Input {...register('city')}    label="City"    placeholder="e.g. Lagos" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <MessageCircle size={14} className="text-green-400" /> WhatsApp Number
          </label>
          <Input
            {...register('whatsapp_number')}
            placeholder="e.g. 2348012345678 (with country code, no +)"
          />
          <p className="text-xs text-white/25">Customers will use this to contact you on WhatsApp. Include country code without the + sign.</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/70">Theme colour</label>
          <div className="flex items-center gap-3">
            <input
              {...register('theme_color')}
              type="color"
              defaultValue="#C8851A"
              className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-sm text-white/40">Choose your shop's brand colour</span>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isDirty && !!shop}
          leftIcon={<Save size={16} />}
        >
          {shop ? 'Save Changes' : 'Create Shop'}
        </Button>
      </motion.form>

      {shop && (
        <div className="glass rounded-2xl p-5 border border-brand-500/20">
          <p className="text-sm text-white/50">
            Your shop URL:{' '}
            <span className="text-brand-400 font-mono">
              vestahairhub.com/shop/{shop.slug}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
