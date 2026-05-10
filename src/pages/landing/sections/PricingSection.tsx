import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const PLANS = [
  {
    name:     'Starter',
    price:    'Free',
    sub:      'Forever free',
    highlight: false,
    badge:    null,
    features: [
      'Up to 20 products',
      'Your own shop page',
      'MTN MoMo & OPay payments',
      'Order management',
      'Basic analytics',
      'Email support',
    ],
    cta:      'Get Started Free',
    note:     'No credit card required',
  },
  {
    name:     'Pro Seller',
    price:    'Coming Soon',
    sub:      'Advanced tools for growing sellers',
    highlight: true,
    badge:    '🚀 Launching Soon',
    features: [
      'Unlimited products',
      'Custom domain support',
      'Priority listing in marketplace',
      'Advanced analytics & reports',
      'Bulk product upload',
      'Priority support',
      'Featured seller badge',
    ],
    cta:      'Join Waitlist',
    note:     'Be first when we launch',
  },
]

export function PricingSection() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="section relative z-10">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-brand-400 text-sm font-semibold tracking-widest uppercase">Pricing</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold text-white">
            Simple, <span className="text-gold-gradient">Transparent</span> Pricing
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Start completely free. Grow your business first — upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className={`relative rounded-3xl p-8 flex flex-col gap-6 ${
                plan.highlight
                  ? 'border-2 border-brand-500/50 bg-gradient-to-b from-brand-900/30 to-space-900'
                  : 'glass-dark'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-brand-400' : 'text-white'}`}>
                    {plan.price}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/40">{plan.sub}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check size={16} className="text-brand-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                <Button
                  variant={plan.highlight ? 'secondary' : 'primary'}
                  size="lg"
                  leftIcon={plan.highlight ? <Zap size={17} /> : undefined}
                  onClick={() => navigate('/auth/register')}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
                {plan.note && (
                  <p className="text-center text-xs text-white/30">{plan.note}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
