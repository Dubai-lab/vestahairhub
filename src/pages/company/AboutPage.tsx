import { Link } from 'react-router-dom'
import { Heart, ShieldCheck, Globe, Zap, Users, Store, Star, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

const values = [
  {
    Icon: Heart,
    title: 'Passion for Beauty',
    body: 'We celebrate African beauty in all its forms — natural hair, bold nails, stunning lashes. Every product on our platform tells a story of culture, craft, and confidence.',
  },
  {
    Icon: ShieldCheck,
    title: 'Trust & Safety',
    body: 'We verify sellers, moderate listings, and give buyers real tools to report issues. Every transaction on VestaHairHub is backed by our buyer protection promise.',
  },
  {
    Icon: Globe,
    title: 'Pan-African Vision',
    body: 'Built in Africa, for Africa. We connect sellers from Lagos to Nairobi with buyers across the continent and the diaspora — no borders, just beautiful products.',
  },
  {
    Icon: Zap,
    title: 'Free to Sell Forever',
    body: 'We believe every entrepreneur deserves a fair shot. That\'s why opening a shop on VestaHairHub costs nothing. No listing fees, no monthly charges.',
  },
]

const stats = [
  { value: '10,000+', label: 'Products Listed' },
  { value: '500+',    label: 'Active Sellers' },
  { value: '15+',     label: 'Countries Reached' },
  { value: '4.8★',   label: 'Average Seller Rating' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fade(0)} className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 text-xs font-semibold tracking-wider uppercase mb-6">
            Our Story
          </span>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Built for African<br />Beauty & Pride
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            VestaHairHub was born from a simple belief — that African beauty entrepreneurs
            deserve a world-class marketplace to showcase their products without paying
            a fortune to get started. We built the platform we wished existed.
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div {...fade(0.1)} className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass-dark rounded-2xl border border-white/5 p-6 text-center">
              <p className="font-display text-3xl font-bold text-brand-400 mb-1">{value}</p>
              <p className="text-sm text-white/45">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Mission */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div {...fade(0.15)} className="max-w-4xl mx-auto glass-dark rounded-3xl border border-white/5 p-8 sm:p-12 flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1">
            <h2 className="font-display text-3xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-white/55 leading-relaxed mb-4">
              Africa is home to some of the most vibrant beauty markets in the world. Yet authentic
              African hair, nail, and lash products have been hard to find, hard to trust, and hard
              to buy safely online — until now.
            </p>
            <p className="text-white/55 leading-relaxed">
              VestaHairHub gives every seller a professional storefront, every buyer a curated
              marketplace, and the whole community a space to celebrate African beauty with confidence.
              We handle the platform; you handle the passion.
            </p>
          </div>
          <div className="flex-shrink-0 grid grid-cols-2 gap-3">
            {[
              { Icon: Users,  label: 'Community First' },
              { Icon: Store,  label: 'Seller Friendly' },
              { Icon: Star,   label: 'Quality Products' },
              { Icon: Globe,  label: 'Pan-African' },
            ].map(({ Icon, label }) => (
              <div key={label} className="w-32 h-28 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex flex-col items-center justify-center gap-2">
                <Icon size={24} className="text-brand-400" />
                <span className="text-xs text-white/60 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fade(0.2)} className="font-display text-3xl font-bold text-white text-center mb-10">
            What We Stand For
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map(({ Icon, title, body }, i) => (
              <motion.div key={title} {...fade(0.2 + i * 0.06)}
                className="glass-dark rounded-2xl border border-white/5 p-6 hover:border-brand-500/20 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-28">
        <motion.div {...fade(0.3)} className="max-w-2xl mx-auto text-center glass-dark rounded-3xl border border-brand-500/20 p-10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to Join Us?</h2>
          <p className="text-white/50 mb-8">Start selling your beauty products for free, or discover authentic African hair & beauty today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
              Start Selling Free <ArrowRight size={16} />
            </Link>
            <Link to="/marketplace"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 text-white/80 hover:text-white font-semibold text-sm transition-colors">
              Browse Marketplace
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
