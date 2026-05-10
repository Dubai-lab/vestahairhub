import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="section relative z-10">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center"
          style={{
            background: 'linear-gradient(135deg, #3D1A08 0%, #1E0B00 30%, #050510 60%, #0D0D2E 100%)',
            border: '1px solid rgba(200,133,26,0.2)',
          }}
        >
          {/* Glow orbs */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-brand-700/25 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md rounded-full bg-brand-600/10 blur-[80px] pointer-events-none" />

          {/* Twinkling stars decoration */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-brand-300 animate-twinkle"
              style={{
                top:              `${Math.random() * 100}%`,
                left:             `${Math.random() * 100}%`,
                animationDelay:   `${Math.random() * 3}s`,
                animationDuration:`${2 + Math.random() * 2}s`,
                opacity:          Math.random() * 0.8 + 0.2,
              }}
            />
          ))}

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
            <span className="text-4xl animate-float">🌍</span>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Ready to Grow Your
              <br />
              <span className="text-gold-gradient">Beauty Business?</span>
            </h2>

            <p className="text-white/55 text-lg leading-relaxed">
              Join thousands of African beauty entrepreneurs who chose VestaHairHub.
              Start for free today — no credit card, no risk.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <Button
                size="lg"
                variant="primary"
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/auth/register')}
                className="animate-pulse-glow min-w-[220px]"
              >
                Start Selling Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/marketplace')}
                className="min-w-[180px]"
              >
                Explore Marketplace
              </Button>
            </div>

            <p className="text-xs text-white/30 mt-2">
              Free forever • Set up in 5 minutes • No credit card
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
