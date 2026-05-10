import { motion } from 'framer-motion'
import { UserPlus, Store, TrendingUp } from 'lucide-react'

const STEPS = [
  {
    step:        '01',
    Icon:        UserPlus,
    title:       'Create Your Account',
    description: 'Sign up for free in under 2 minutes. Choose the seller option and fill in your basic details — no credit card required.',
    color:       'text-amber-400',
    bg:          'bg-amber-400/10 border-amber-400/20',
  },
  {
    step:        '02',
    Icon:        Store,
    title:       'Set Up Your Shop',
    description: 'Customize your store with your brand colours and logo. Add your MTN MoMo or OPay number so customers can pay you directly.',
    color:       'text-brand-400',
    bg:          'bg-brand-400/10 border-brand-400/20',
  },
  {
    step:        '03',
    Icon:        TrendingUp,
    title:       'List & Start Selling',
    description: 'Upload your products with photos, prices and descriptions. Go live instantly and start receiving orders from across Africa.',
    color:       'text-emerald-400',
    bg:          'bg-emerald-400/10 border-emerald-400/20',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section relative z-10">
      <div className="container-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-16"
        >
          <span className="text-brand-400 text-sm font-semibold tracking-widest uppercase">For Sellers</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold text-white">
            Start Selling in
            <span className="text-gold-gradient"> 3 Simple Steps</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            No tech skills needed. VestaHairHub is built for African beauty entrepreneurs — simple, fast, powerful.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[22%] right-[22%] h-px bg-gradient-to-r from-amber-400/30 via-brand-400/30 to-emerald-400/30" />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 rounded-2xl border ${s.bg} flex items-center justify-center`}>
                  <s.Icon size={28} className={s.color} />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-space-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                  {s.step}
                </span>
              </div>

              {/* Content */}
              <div className="glass-dark rounded-2xl p-6 w-full">
                <h3 className="font-display text-xl font-bold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
