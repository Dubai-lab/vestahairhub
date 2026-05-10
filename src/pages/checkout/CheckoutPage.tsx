import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Smartphone, Building2 } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase }      from '@/lib/supabase'
import { useAuth }       from '@/context/AuthContext'
import { useCartStore }  from '@/store/cartStore'
import { Button }        from '@/components/ui/Button'
import { Input }         from '@/components/ui/Input'
import { Spinner }       from '@/components/ui/Spinner'
import type { ShopPayment, PaymentMethodType } from '@/types'

const schema = z.object({
  shipping_name:    z.string().min(2, 'Enter your name'),
  shipping_phone:   z.string().min(7, 'Enter a valid phone number'),
  shipping_address: z.string().min(5, 'Enter your delivery address'),
  shipping_city:    z.string().min(2, 'Enter your city'),
  shipping_country: z.string().min(2, 'Enter your country'),
  payment_method:   z.enum(['mtn_momo', 'opay', 'bank_transfer']),
  payment_reference: z.string().min(3, 'Enter your payment reference after sending money'),
  notes:            z.string().optional(),
})
type FormData = z.infer<typeof schema>

const METHOD_ICONS: Record<PaymentMethodType, string> = {
  mtn_momo:      '📱',
  opay:          '💳',
  bank_transfer: '🏦',
}
const METHOD_LABELS: Record<PaymentMethodType, string> = {
  mtn_momo:      'MTN MoMo',
  opay:          'OPay',
  bank_transfer: 'Bank Transfer',
}

export default function CheckoutPage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { items, totalPrice, clearCart } = useCartStore()
  const [step, setStep] = useState<'details' | 'payment' | 'done'>('details')
  const [orderId, setOrderId] = useState<string | null>(null)

  // Get the shop from the first item
  const shopId = items[0]?.shopId

  const { data: paymentMethods = [], isLoading: pmLoading } = useQuery({
    queryKey: ['shop-payment-methods', shopId],
    enabled:  !!shopId,
    queryFn:  async () => {
      const { data } = await supabase
        .from('shop_payment_methods')
        .select('*')
        .eq('shop_id', shopId!)
        .eq('is_active', true)
      return (data ?? []) as ShopPayment[]
    },
  })

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: 'mtn_momo' },
  })

  const selectedMethod = watch('payment_method')
  const selectedPayment = paymentMethods.find((m) => m.method_type === selectedMethod)

  const placeOrder = useMutation({
    mutationFn: async (data: FormData) => {
      const total = totalPrice()
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          buyer_id:         user!.id,
          shop_id:          shopId!,
          status:           'payment_submitted',
          total_amount:     total,
          payment_method:   data.payment_method,
          payment_reference: data.payment_reference,
          shipping_name:    data.shipping_name,
          shipping_phone:   data.shipping_phone,
          shipping_address: data.shipping_address,
          shipping_city:    data.shipping_city,
          shipping_country: data.shipping_country,
          notes:            data.notes,
        })
        .select('id')
        .single()

      if (error) throw error

      // Insert order items
      await supabase.from('order_items').insert(
        items.map((i) => ({
          order_id:      order.id,
          product_id:    i.product.id,
          product_name:  i.product.name,
          product_image: i.product.images?.[0] ?? null,
          quantity:      i.quantity,
          unit_price:    i.product.price,
        })),
      )

      return order.id
    },
    onSuccess: (id) => {
      setOrderId(id)
      clearCart()
      setStep('done')
    },
  })

  if (items.length === 0 && step !== 'done') {
    navigate('/cart')
    return null
  }

  if (step === 'done') return (
    <div className="pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <CheckCircle size={72} className="text-emerald-400 animate-float" />
      <h1 className="font-display text-4xl font-bold text-white">Order Placed!</h1>
      <p className="text-white/55 max-w-md">
        Your order has been submitted. The seller will confirm your payment shortly.
        Order ID: <span className="text-brand-400 font-mono">{orderId?.slice(0, 8).toUpperCase()}</span>
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/account/orders')}>View My Orders</Button>
        <Button variant="outline" onClick={() => navigate('/marketplace')}>Continue Shopping</Button>
      </div>
    </div>
  )

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit((d) => placeOrder.mutateAsync(d))} className="space-y-6">

            {/* Shipping details */}
            <div className="glass-dark rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">Delivery Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input {...register('shipping_name')}    label="Full Name"    placeholder="Your full name" error={errors.shipping_name?.message} />
                <Input {...register('shipping_phone')}   label="Phone Number" placeholder="+234 812 345 6789" error={errors.shipping_phone?.message} />
              </div>
              <Input {...register('shipping_address')} label="Delivery Address" placeholder="Street, Area" error={errors.shipping_address?.message} />
              <div className="grid grid-cols-2 gap-4">
                <Input {...register('shipping_city')}    label="City"    placeholder="Lagos" error={errors.shipping_city?.message} />
                <Input {...register('shipping_country')} label="Country" placeholder="Nigeria" error={errors.shipping_country?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">Notes (optional)</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Any special delivery instructions…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="glass-dark rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold text-white">Payment Method</h2>
              <p className="text-sm text-white/50">
                Select how you'll pay the seller. Send the money directly, then enter your reference below.
              </p>

              {pmLoading ? <Spinner /> : paymentMethods.length === 0 ? (
                <p className="text-sm text-white/40">This seller has not configured payment methods yet. Contact them directly.</p>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((pm) => (
                    <label
                      key={pm.id}
                      className={[
                        'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                        selectedMethod === pm.method_type
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/10 hover:border-white/20',
                      ].join(' ')}
                    >
                      <input type="radio" value={pm.method_type} {...register('payment_method')} className="sr-only" />
                      <span className="text-2xl">{METHOD_ICONS[pm.method_type as PaymentMethodType]}</span>
                      <div>
                        <p className="font-semibold text-white text-sm">{METHOD_LABELS[pm.method_type as PaymentMethodType]}</p>
                        <p className="text-sm text-brand-400 font-mono">{pm.account_number}</p>
                        <p className="text-xs text-white/40">{pm.account_name}{pm.bank_name ? ` · ${pm.bank_name}` : ''}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedPayment && (
                <div className="mt-4 glass rounded-xl p-4 border border-brand-500/20 space-y-2">
                  <p className="text-sm font-semibold text-brand-400">
                    Send ₦{totalPrice().toLocaleString()} to {METHOD_LABELS[selectedMethod as PaymentMethodType]}:
                  </p>
                  <p className="text-xl font-mono text-white">{selectedPayment.account_number}</p>
                  <p className="text-sm text-white/50">{selectedPayment.account_name}</p>
                </div>
              )}

              <Input
                {...register('payment_reference')}
                label="Payment Reference / Transaction ID"
                placeholder="e.g. MTN12345678 or screenshot ref"
                error={errors.payment_reference?.message}
              />
            </div>

            <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
              I Have Paid — Place Order
            </Button>
          </form>
        </div>

        {/* Order summary */}
        <div className="glass-dark rounded-2xl p-6 h-fit space-y-4">
          <h2 className="font-semibold text-white">Order Summary</h2>
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between text-sm">
              <span className="text-white/60 truncate flex-1 mr-2">{item.product.name} × {item.quantity}</span>
              <span className="text-white shrink-0">₦{(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <hr className="border-white/5" />
          <div className="flex justify-between font-bold text-white">
            <span>Total</span>
            <span className="text-brand-400">₦{totalPrice().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
