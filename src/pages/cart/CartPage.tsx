import { useNavigate, Link } from 'react-router-dom'
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import { useAuth }      from '@/context/AuthContext'
import { Button }       from '@/components/ui/Button'

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCartStore()
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const handleCheckout = () => {
    if (!user) { navigate('/auth/login', { state: { from: { pathname: '/checkout' } } }); return }
    navigate('/checkout')
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="font-display text-4xl font-bold text-white mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-5">
          <ShoppingBag size={60} className="text-white/15" />
          <p className="text-white/40 text-lg">Your cart is empty</p>
          <Button onClick={() => navigate('/marketplace')}>Browse Products</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{   opacity: 0, x: -20, height: 0 }}
                  className="glass-dark rounded-2xl p-4 flex items-center gap-4"
                >
                  <Link to={`/product/${item.product.id}`} className="w-16 h-16 rounded-xl bg-brand-900/40 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {item.product.images?.[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /> : '📦'}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product.id}`} className="font-medium text-white hover:text-brand-400 transition-colors truncate block">
                      {item.product.name}
                    </Link>
                    <p className="text-brand-400 font-bold mt-1">₦{item.product.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white border border-white/10">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white border border-white/10">
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-white">₦{(item.product.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.product.id)} className="text-white/30 hover:text-red-400 transition-colors mt-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="glass-dark rounded-2xl p-6 flex flex-col gap-4 h-fit">
            <h2 className="font-semibold text-white text-lg">Order Summary</h2>
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>₦{totalPrice().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Shipping</span>
              <span className="text-brand-400">Agreed with seller</span>
            </div>
            <hr className="border-white/5" />
            <div className="flex justify-between font-bold text-white text-lg">
              <span>Total</span>
              <span className="text-brand-400">₦{totalPrice().toLocaleString()}</span>
            </div>
            <Button size="lg" className="w-full mt-2" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
            <p className="text-xs text-white/30 text-center">
              You'll pay the seller directly via MoMo or OPay
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
