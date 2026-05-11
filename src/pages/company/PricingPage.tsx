import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Check, Zap, ShoppingBag } from 'lucide-react'
import { Button }             from '@/components/ui/Button'
import { UniverseBackground } from '@/components/three/UniverseBackground'
import { CursorSparkle }      from '@/components/three/CursorSparkle'

const FREE_FEATURES = [
  'Unlimited product listings',
  'Your own shop page & custom URL',
  'MTN MoMo, OPay & Bank Transfer',
  'Order management dashboard',
  'Real-time customer messaging',
  'In-app & email notifications',
  'Country-targeted marketplace listing',
  'Sales analytics & reports',
  'Customer reviews & ratings',
  'Free forever — no credit card',
]

export default function PricingPage() {
  const navigate = useNavigate()

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <>
      <UniverseBackground />
      <CursorSparkle />

      <div className="relative z-10 min-h-screen pt-28 pb-24 px-4 flex flex-col items-center">

        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-brand-700/12 blur-[100px]" />
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto space-y-6 relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium">
            <Sparkles size={14} className="text-brand-400" />
            Pricing Plans
          </span>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05]">
            Simple,
            <span className="text-gold-gradient"> Honest </span>
            Pricing
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            We believe every African beauty seller deserves a chance to grow online without financial barriers.
            That's why VestaHairHub is — and will always be — free to start.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: -8 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="glass-dark rounded-3xl p-8 flex flex-col gap-6 border border-brand-500/30"
          >
            {/* Plan header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-brand-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/25">
                  Current Plan
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Starter</h2>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="font-display text-5xl font-bold text-brand-400">Free</span>
              </div>
              <p className="mt-1 text-sm text-white/35">Forever free · No credit card</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                  <Check size={15} className="text-brand-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={17} />}
              onClick={() => navigate('/auth/register')} className="w-full">
              Start Selling Free
            </Button>
          </motion.div>

          {/* Pro — Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateY: 8 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-8 flex flex-col gap-6 border-2 border-brand-500/35 overflow-hidden"
            style={{ background: 'linear-gradient(145deg, rgba(26,9,0,0.95) 0%, rgba(40,16,0,0.9) 100%)' }}
          >
            {/* Glow effect inside card */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
            <div className="absolute inset-0 bg-brand-900/5 pointer-events-none" />

            {/* Coming soon badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="px-4 py-1.5 rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/30"
              >
                🚀 Coming Soon
              </motion.span>
            </div>

            <div className="relative z-10 flex flex-col gap-6 flex-1 pt-2">
              {/* Header */}
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Pro Seller</h2>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-display text-5xl font-bold text-brand-400">TBD</span>
                </div>
                <p className="mt-1 text-sm text-white/35">Launching when the community is ready</p>
              </div>

              {/* What's coming */}
              <div className="space-y-3 flex-1">
                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">What's planned:</p>
                {[
                  'Priority placement in marketplace search',
                  'Custom domain for your shop',
                  'Advanced analytics & revenue reports',
                  'Bulk product upload via CSV',
                  'Featured seller badge & verified checkmark',
                  'Dedicated account manager',
                  'Early access to new features',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-white/35">
                    <Zap size={14} className="text-brand-500/50 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Message */}
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 text-center">
                <p className="text-sm text-white/50 leading-relaxed">
                  We're focused on growing the community first.{' '}
                  <span className="text-brand-400 font-semibold">Get everything free</span>{' '}
                  while we build. Paid plans will only add extra features — your free plan stays free.
                </p>
              </div>

              <Button variant="outline" size="lg" onClick={() => navigate('/auth/register')} className="w-full">
                Join Free Now — Be Ready When Pro Launches
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-14 text-center max-w-xl mx-auto space-y-4"
        >
          <p className="text-white/30 text-sm leading-relaxed">
            Have questions about pricing or want to be notified when Pro launches?{' '}
            <a href="/support" className="text-brand-400 hover:text-brand-300 transition-colors">
              Contact us
            </a>
            .
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/how-it-works')}
              className="text-sm text-white/35 hover:text-white/60 transition-colors flex items-center gap-1"
            >
              <ShoppingBag size={13} /> How It Works
            </button>
            <span className="text-white/10">·</span>
            <button
              type="button"
              onClick={() => navigate('/auth/register')}
              className="text-sm text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1"
            >
              Start Free <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>

      </div>
    </>
  )
}
