import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  UserPlus, Store, CreditCard, Package, TrendingUp,
  ShoppingBag, MapPin, ShoppingCart, Smartphone, CheckCircle,
  Sparkles, ArrowRight, Zap, Shield, Globe, MessageSquare,
  BarChart3, Star, Clock, Truck, Bell,
} from 'lucide-react'
import { Button }             from '@/components/ui/Button'
import { UniverseBackground } from '@/components/three/UniverseBackground'
import { CursorSparkle }      from '@/components/three/CursorSparkle'

/* ── Animation variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

/* ── Data ───────────────────────────────────────────────────────────────── */
const SELLER_STEPS = [
  {
    n: '01', Icon: UserPlus,
    title: 'Create Your Free Account',
    body:  'Sign up in under 60 seconds. Choose "I want to sell," enter your name, email and password — no credit card, no fees, ever.',
    color: 'text-amber-400', glow: 'shadow-amber-500/20', border: 'border-amber-400/25', bg: 'bg-amber-400/10',
    tag:   '60 seconds',
  },
  {
    n: '02', Icon: Store,
    title: 'Set Up Your Shop',
    body:  'Give your shop a name and URL. Pick your country, city and currency. Add a logo and brand colour to make it yours.',
    color: 'text-brand-400', glow: 'shadow-brand-500/20', border: 'border-brand-400/25', bg: 'bg-brand-400/10',
    tag:   '5 minutes',
  },
  {
    n: '03', Icon: CreditCard,
    title: 'Add Your Payment Details',
    body:  'Enter your MTN MoMo number, OPay number or bank account details. Customers will pay you directly — zero platform fees.',
    color: 'text-emerald-400', glow: 'shadow-emerald-500/20', border: 'border-emerald-400/25', bg: 'bg-emerald-400/10',
    tag:   '2 minutes',
  },
  {
    n: '04', Icon: Package,
    title: 'List Your Products',
    body:  'Upload photos, set your price, add a description and choose a category. You can list hair, nails, lashes, wigs — anything beauty.',
    color: 'text-blue-400', glow: 'shadow-blue-500/20', border: 'border-blue-400/25', bg: 'bg-blue-400/10',
    tag:   'Unlimited products',
  },
  {
    n: '05', Icon: TrendingUp,
    title: 'Receive Orders & Get Paid',
    body:  'Customers find your shop, place an order and pay you directly via MoMo/OPay/Bank. You confirm the payment and ship the order.',
    color: 'text-purple-400', glow: 'shadow-purple-500/20', border: 'border-purple-400/25', bg: 'bg-purple-400/10',
    tag:   'Keep 100% revenue',
  },
]

const BUYER_STEPS = [
  {
    n: '01', Icon: Globe,
    title: 'Browse the Marketplace',
    body:  'Explore hair, nails, lashes and more from sellers across Africa. Filter by country to find sellers near you.',
    color: 'text-brand-400', bg: 'bg-brand-400/10', border: 'border-brand-400/20',
  },
  {
    n: '02', Icon: ShoppingCart,
    title: 'Add to Cart & Checkout',
    body:  'Select your products, add them to cart and fill in your delivery address. It takes under 2 minutes.',
    color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20',
  },
  {
    n: '03', Icon: Smartphone,
    title: 'Pay the Seller Directly',
    body:  "Send payment via MTN MoMo, OPay or bank transfer to the seller's account. Enter your transaction reference.",
    color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20',
  },
  {
    n: '04', Icon: Truck,
    title: 'Track Your Order',
    body:  'Get notified when your payment is confirmed, when your order ships and when it arrives. Real-time updates every step.',
    color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20',
  },
]

const FEATURES = [
  { Icon: Shield,       title: 'Verified Sellers',      body: 'All sellers go through our onboarding process. Shop with confidence.',         color: 'text-emerald-400' },
  { Icon: Globe,        title: '54 African Countries',  body: 'Filter by country and discover beauty sellers from across the continent.',       color: 'text-brand-400'   },
  { Icon: MessageSquare,title: 'Direct Messaging',      body: 'Chat with sellers before buying. Ask about custom orders, availability, sizes.', color: 'text-blue-400'    },
  { Icon: Bell,         title: 'Real-time Notifications',body: 'Get instant alerts on orders, messages and status updates in your bell.',       color: 'text-amber-400'   },
  { Icon: BarChart3,    title: 'Seller Analytics',      body: 'Track your sales, views and top products from your seller dashboard.',           color: 'text-purple-400'  },
  { Icon: Star,         title: 'Reviews & Ratings',     body: 'Buyers leave honest reviews. Build trust and grow your reputation over time.',   color: 'text-yellow-400'  },
  { Icon: Zap,          title: 'Instant Shop Setup',    body: 'Your shop page is live the moment you finish setup. No waiting, no approvals.',  color: 'text-brand-400'   },
  { Icon: Clock,        title: 'Free Forever',          body: 'Start selling at zero cost. No monthly fees, no commission taken.',              color: 'text-emerald-400' },
]

/* ── Dashboard Mockup (3D "coming out of screen") ───────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-3xl mx-auto px-4">
      {/* Glow behind */}
      <div className="absolute inset-0 rounded-3xl bg-brand-500/10 blur-[80px] pointer-events-none" />

      {/* Outer perspective wrapper */}
      <div style={{ perspective: '1400px' }}>
        <motion.div
          initial={{ opacity: 0, y: 80, rotateX: -22 }}
          whileInView={{ opacity: 1, y: 0, rotateX: -6 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative rounded-2xl overflow-hidden border border-brand-500/30 shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_60px_rgba(200,133,26,0.12)]"
        >
          {/* Browser chrome bar */}
          <div className="bg-space-800 border-b border-white/8 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white/5 border border-white/8 rounded-lg px-3 py-1 flex items-center gap-2 max-w-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-white/30 font-mono">vestahairhub.vercel.app/dashboard</span>
              </div>
            </div>
          </div>

          {/* Dashboard body */}
          <div className="bg-space-900 flex" style={{ minHeight: 380 }}>

            {/* Sidebar */}
            <div className="w-14 sm:w-48 bg-space-950/80 border-r border-white/5 flex flex-col py-5 gap-1 shrink-0">
              {[
                { icon: BarChart3, label: 'Overview',  active: true  },
                { icon: Package,   label: 'Products',  active: false },
                { icon: ShoppingBag, label: 'Orders',  active: false },
                { icon: MessageSquare, label: 'Messages', active: false },
                { icon: Store,     label: 'Settings',  active: false },
              ].map((item) => (
                <div key={item.label}
                  className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-xs font-medium transition-colors ${
                    item.active
                      ? 'bg-brand-500/20 text-brand-400'
                      : 'text-white/30'
                  }`}
                >
                  <item.icon size={15} />
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 space-y-4 overflow-hidden">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Sales',   val: '₦248,500', delta: '+12%', color: 'text-emerald-400' },
                  { label: 'Orders',        val: '34',        delta: '+5',   color: 'text-brand-400'   },
                  { label: 'Products',      val: '18',        delta: 'Live', color: 'text-blue-400'    },
                  { label: 'Shop Views',    val: '1,240',     delta: '+89',  color: 'text-purple-400'  },
                ].map((s) => (
                  <div key={s.label} className="bg-space-800 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
                    <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{s.delta}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-space-800 rounded-xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/70">Recent Orders</p>
                  <span className="text-[10px] text-brand-400">View all →</span>
                </div>
                {[
                  { id: 'ORD-A3F1', name: 'Adaeze Okafor', amount: '₦12,500', status: 'Confirmed', color: 'text-emerald-400' },
                  { id: 'ORD-B7C2', name: 'Aisha Musa',    amount: '₦8,200',  status: 'Shipped',   color: 'text-blue-400'    },
                  { id: 'ORD-D9E4', name: 'Fatima Diallo',  amount: '₦5,800',  status: 'Pending',   color: 'text-amber-400'   },
                ].map((o) => (
                  <div key={o.id} className="px-4 py-2.5 flex items-center justify-between border-b border-white/3 last:border-0">
                    <div>
                      <p className="text-xs text-white/70 font-medium">{o.name}</p>
                      <p className="text-[10px] text-white/25 font-mono">{o.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-brand-400 font-bold">{o.amount}</p>
                      <p className={`text-[10px] ${o.color}`}>{o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/10 via-transparent to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: -20 }}
        whileInView={{ opacity: 1, x: 0, y: -20 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="absolute -right-2 sm:right-0 top-16 glass border border-brand-500/30 rounded-2xl px-4 py-3 shadow-xl z-10"
      >
        <p className="text-xs text-white/50">New order received 🎊</p>
        <p className="text-sm font-bold text-brand-400 mt-0.5">₦12,500</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -40, y: 40 }}
        whileInView={{ opacity: 1, x: 0, y: 40 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="absolute -left-2 sm:left-4 bottom-16 glass border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-xl z-10"
      >
        <p className="text-xs text-white/50">Payment confirmed ✅</p>
        <p className="text-sm font-bold text-emerald-400 mt-0.5">Aisha Musa</p>
      </motion.div>
    </div>
  )
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  const navigate   = useNavigate()
  const heroRef    = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroY       = useTransform(scrollY, [0, 400], [0, -80])

  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <>
      <UniverseBackground />
      <CursorSparkle />

      <div className="relative z-10 min-h-screen">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative pt-32 pb-24 px-4 overflow-hidden">
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-brand-700/12 blur-[100px]" />
          </div>

          <motion.div
            style={{ y: heroY }}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto text-center space-y-6"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium">
                <Sparkles size={14} className="text-brand-400" />
                Simple. Transparent. Free.
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] text-balance"
            >
              How
              <span className="text-gold-gradient"> VestaHairHub </span>
              Works
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              Whether you're a beauty seller looking to grow your business online, or a buyer searching
              for authentic African beauty products — we've made every step beautifully simple.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/auth/register')} className="min-w-[200px]">
                Start Selling Free
              </Button>
              <Button size="lg" variant="outline" leftIcon={<ShoppingBag size={18} />}
                onClick={() => navigate('/marketplace')} className="min-w-[200px]">
                Browse Products
              </Button>
            </motion.div>

            {/* Quick stats */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 pt-4">
              {[
                { val: '100%', label: 'Free to sell' },
                { val: '0%',   label: 'Commission fees' },
                { val: '54',   label: 'African countries' },
                { val: '60s',  label: 'To go live' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-brand-400">{s.val}</p>
                  <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══ FOR SELLERS ═══════════════════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <span className="text-brand-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-brand-500/25 bg-brand-500/10">
                For Sellers
              </span>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl font-bold text-white">
                Sell Beauty Products Online
                <br />
                <span className="text-gold-gradient">in 5 Simple Steps</span>
              </h2>
              <p className="mt-4 text-white/45 max-w-xl mx-auto">
                No tech skills required. VestaHairHub is built specifically for African beauty entrepreneurs.
              </p>
            </motion.div>

            {/* Step cards */}
            <div className="space-y-5">
              {SELLER_STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                  className={`relative glass-dark rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border ${s.border} shadow-lg ${s.glow}`}
                  style={{ boxShadow: `0 8px 40px rgba(0,0,0,0.3)` }}
                >
                  {/* Step number */}
                  <div className="absolute top-4 right-4 sm:static shrink-0">
                    <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center relative`}>
                      <s.Icon size={24} className={s.color} />
                      <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-space-900 border border-white/10 flex items-center justify-center text-[9px] font-bold ${s.color}`}>
                        {s.n}
                      </span>
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.color} border ${s.border}`}>
                        {s.tag}
                      </span>
                    </div>
                    <p className="mt-2 text-white/50 leading-relaxed text-sm sm:text-base">{s.body}</p>
                  </div>

                  {/* Connector line below (except last) */}
                  {i < SELLER_STEPS.length - 1 && (
                    <div className="hidden sm:block absolute -bottom-3 left-[44px] w-px h-6 bg-gradient-to-b from-white/10 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-10"
            >
              <Button size="lg" variant="primary" rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/auth/register')}>
                Create Your Seller Account — Free
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ══ 3D DASHBOARD MOCKUP ═══════════════════════════════════════════ */}
        <section className="py-24 px-4 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-brand-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-brand-500/25 bg-brand-500/10">
                Your Dashboard
              </span>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl font-bold text-white">
                Everything You Need,
                <br />
                <span className="text-gold-gradient">In One Place</span>
              </h2>
              <p className="mt-4 text-white/45 max-w-xl mx-auto">
                Your seller dashboard gives you full control — manage products, process orders,
                track sales and message customers from a single beautiful interface.
              </p>
            </motion.div>

            <DashboardMockup />

            {/* Feature bullets below mockup */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 mt-20"
            >
              {[
                'Real-time order alerts',
                'Sales analytics',
                'Product management',
                'Customer messages',
                'Payment tracking',
                'Shop customisation',
              ].map((f) => (
                <span key={f}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-full text-sm text-white/60 border border-white/8">
                  <CheckCircle size={13} className="text-brand-400" /> {f}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ FOR BUYERS ════════════════════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10">
                For Buyers
              </span>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl font-bold text-white">
                Shop Authentic African
                <br />
                <span className="text-gold-gradient">Beauty Products</span>
              </h2>
              <p className="mt-4 text-white/45 max-w-xl mx-auto">
                Browse sellers from across Africa, chat directly with them, and get your order delivered.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BUYER_STEPS.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={`relative glass-dark rounded-2xl p-6 flex flex-col gap-4 border ${s.border} text-center`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center mx-auto relative`}>
                    <s.Icon size={22} className={s.color} />
                    <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-space-900 border border-white/10 flex items-center justify-center text-[9px] font-bold ${s.color}`}>
                      {s.n}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-white mb-2">{s.title}</h3>
                    <p className="text-sm text-white/45 leading-relaxed">{s.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mt-10"
            >
              <Button size="lg" variant="outline" leftIcon={<ShoppingBag size={18} />}
                onClick={() => navigate('/marketplace')}>
                Browse the Marketplace
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ══ PAYMENT METHODS ═══════════════════════════════════════════════ */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-dark rounded-3xl p-10 sm:p-14 text-center border border-brand-500/15"
            >
              <span className="text-brand-400 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-brand-500/25 bg-brand-500/10">
                Payments
              </span>
              <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold text-white">
                Pay Directly. Keep Everything.
              </h2>
              <p className="mt-4 text-white/45 max-w-xl mx-auto">
                Buyers pay sellers directly using their preferred African payment method.
                VestaHairHub charges <span className="text-brand-400 font-semibold">zero commission</span>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
                {[
                  { icon: '📱', name: 'MTN MoMo',      desc: 'Pan-African mobile money',         color: 'border-yellow-400/25 bg-yellow-400/8' },
                  { icon: '💳', name: 'OPay',           desc: 'Multi-country digital wallet',     color: 'border-emerald-400/25 bg-emerald-400/8' },
                  { icon: '🏦', name: 'Bank Transfer',  desc: 'Direct bank account payment',      color: 'border-blue-400/25 bg-blue-400/8' },
                ].map((m) => (
                  <motion.div
                    key={m.name}
                    whileHover={{ scale: 1.04, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border ${m.color} p-5 text-center`}
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <p className="font-bold text-white mt-2">{m.name}</p>
                    <p className="text-xs text-white/40 mt-1">{m.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ FEATURES GRID ═════════════════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
                Built for African
                <span className="text-gold-gradient"> Beauty</span>
              </h2>
              <p className="mt-4 text-white/45 max-w-xl mx-auto">
                Every feature designed with African sellers and buyers in mind.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: i * 0.06, duration: 0.6 }}
                  whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                  className="glass-dark rounded-2xl p-5 border border-white/5 hover:border-brand-500/25 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.color}`}>
                    <f.Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ═════════════════════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-3xl overflow-hidden text-center p-12 sm:p-16 border border-brand-500/25"
              style={{ background: 'linear-gradient(135deg, rgba(26,9,0,0.9) 0%, rgba(45,18,0,0.85) 50%, rgba(26,9,0,0.9) 100%)' }}
            >
              {/* Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-brand-600/15 blur-[80px] pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <span className="text-4xl">✨</span>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-white">
                  Ready to Start?
                </h2>
                <p className="text-white/50 max-w-md mx-auto text-lg">
                  Join thousands of African beauty entrepreneurs already selling on VestaHairHub — completely free.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <Button size="lg" variant="primary" rightIcon={<ArrowRight size={18} />}
                    onClick={() => navigate('/auth/register')} className="min-w-[200px] animate-pulse-glow">
                    Start Selling Free
                  </Button>
                  <Button size="lg" variant="outline" leftIcon={<ShoppingBag size={18} />}
                    onClick={() => navigate('/marketplace')} className="min-w-[200px]">
                    Browse Products
                  </Button>
                </div>
                <p className="text-xs text-white/25">No credit card required · Free forever · 60 second setup</p>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  )
}
