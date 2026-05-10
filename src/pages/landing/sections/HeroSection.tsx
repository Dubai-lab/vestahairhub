import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const TRUSTS = [
  '🇳🇬 Nigeria', '🇬🇭 Ghana', '🇰🇪 Kenya', '🇿🇦 South Africa', '🇸🇳 Senegal', '🇪🇹 Ethiopia',
]

export function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Subtle radial glow beneath content */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-brand-700/10 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-900/8 blur-[80px]" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-6"
      >
        {/* Tag */}
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium animate-pulse-glow">
            <Sparkles size={14} className="text-brand-400" />
            Africa's #1 Beauty Marketplace
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-balance"
        >
          Your African
          <br />
          <span className="text-gold-gradient">Beauty Business,</span>
          <br />
          Online.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-white/55 max-w-2xl leading-relaxed text-balance"
        >
          Join thousands of African beauty entrepreneurs selling hair,&nbsp;nails,
          lashes&nbsp;&amp;&nbsp;more to customers worldwide — all from one powerful platform.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <Button
            size="lg"
            variant="primary"
            rightIcon={<ArrowRight size={18} />}
            onClick={() => navigate('/auth/register')}
            className="animate-pulse-glow min-w-[200px]"
          >
            Start Selling Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            leftIcon={<ShoppingBag size={18} />}
            onClick={() => navigate('/marketplace')}
            className="min-w-[200px]"
          >
            Browse Products
          </Button>
        </motion.div>

        {/* Trust flags */}
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mt-4">
          {TRUSTS.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full glass text-xs text-white/50 border border-white/5">
              {t}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/30 tracking-widest uppercase">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-brand-500/50 to-transparent animate-pulse" />
      </motion.div>
    </section>
  )
}
