import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, ToggleLeft, ToggleRight, Smartphone, Building2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase }           from '@/lib/supabase'
import { useAuth }            from '@/context/AuthContext'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import { Badge }              from '@/components/ui/Badge'
import { Spinner }            from '@/components/ui/Spinner'
import type { ShopPayment, PaymentMethodType } from '@/types'

const METHODS: { type: PaymentMethodType; label: string; icon: string; hint: string }[] = [
  { type: 'mtn_momo',      label: 'MTN MoMo',      icon: '📱', hint: 'Pan-African Mobile Money' },
  { type: 'opay',          label: 'OPay',           icon: '💳', hint: 'Nigerian digital payment' },
  { type: 'bank_transfer', label: 'Bank Transfer',  icon: '🏦', hint: 'Direct bank account' },
]

const schema = z.object({
  method_type:    z.enum(['mtn_momo', 'opay', 'bank_transfer']),
  account_name:   z.string().min(2, 'Enter your account name'),
  account_number: z.string().min(5, 'Enter your phone/account number'),
  bank_name:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function PaymentSettings() {
  const { user }   = useAuth()
  const qc         = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: shop } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['payment-methods', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase
        .from('shop_payment_methods')
        .select('*')
        .eq('shop_id', shop!.id)
        .order('created_at')
      return (data ?? []) as ShopPayment[]
    },
  })

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method_type: 'mtn_momo' },
  })
  const selectedType = watch('method_type')

  const addMethod = useMutation({
    mutationFn: async (data: FormData) => {
      await supabase.from('shop_payment_methods').insert({ shop_id: shop!.id, ...data })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-methods'] }); setShowForm(false) },
  })

  const toggleMethod = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('shop_payment_methods').update({ is_active }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('shop_payment_methods').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })

  if (!shop) return (
    <div className="glass-dark rounded-2xl p-10 text-center text-white/40">
      Set up your shop in Shop Settings before adding payment methods.
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Payment Methods</h1>
          <p className="text-white/45 mt-1 text-sm">
            Customers will see these details on checkout. They pay you directly — you confirm receipt.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} leftIcon={<Plus size={16} />}>
          Add Method
        </Button>
      </div>

      {/* How it works callout */}
      <div className="glass rounded-2xl p-5 border border-brand-500/20">
        <h3 className="text-sm font-semibold text-brand-400 mb-2">How payments work</h3>
        <ol className="text-sm text-white/55 space-y-1 list-decimal list-inside">
          <li>Customer places an order and sees your payment details</li>
          <li>Customer sends money to your MoMo/OPay number externally</li>
          <li>Customer enters the payment reference and clicks "I Have Paid"</li>
          <li>You receive a notification — review and click "Confirm Payment"</li>
          <li>Order status updates and you process the shipment</li>
        </ol>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{  opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit((d) => addMethod.mutateAsync(d))}
              className="glass-dark rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-semibold text-white">Add Payment Method</h3>

              {/* Method type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Payment type</label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <label
                      key={m.type}
                      className={[
                        'flex flex-col items-center gap-1 p-3 rounded-xl border cursor-pointer text-center transition-all',
                        selectedType === m.type
                          ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                          : 'border-white/10 text-white/50 hover:border-white/20',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        value={m.type}
                        {...register('method_type')}
                        className="sr-only"
                      />
                      <span className="text-2xl">{m.icon}</span>
                      <span className="text-xs font-semibold">{m.label}</span>
                      <span className="text-[10px] text-white/30">{m.hint}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                {...register('account_name')}
                label="Account / Name"
                placeholder="e.g. Amara Beauty Store"
                error={errors.account_name?.message}
              />
              <Input
                {...register('account_number')}
                label={selectedType === 'bank_transfer' ? 'Account Number' : 'Phone Number'}
                placeholder={selectedType === 'bank_transfer' ? '0123456789' : '+234 812 345 6789'}
                error={errors.account_number?.message}
              />
              {selectedType === 'bank_transfer' && (
                <Input
                  {...register('bank_name')}
                  label="Bank Name"
                  placeholder="e.g. First Bank Nigeria"
                />
              )}

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>Save Method</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Methods list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : methods.length === 0 ? (
        <div className="glass-dark rounded-2xl p-12 text-center text-white/30 text-sm">
          No payment methods yet. Add your first method above.
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => {
            const def = METHODS.find((x) => x.type === m.method_type)
            return (
              <div key={m.id} className="glass-dark rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{def?.icon ?? '💳'}</span>
                  <div>
                    <p className="font-semibold text-white">{def?.label ?? m.method_type}</p>
                    <p className="text-sm text-white/50">{m.account_name} · {m.account_number}</p>
                    {m.bank_name && <p className="text-xs text-white/30">{m.bank_name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'Active' : 'Disabled'}</Badge>
                  <button
                    onClick={() => toggleMethod.mutate({ id: m.id, is_active: !m.is_active })}
                    className="text-white/40 hover:text-brand-400 transition-colors"
                  >
                    {m.is_active ? <ToggleRight size={24} className="text-brand-400" /> : <ToggleLeft size={24} />}
                  </button>
                  <button
                    onClick={() => deleteMethod.mutate(m.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
