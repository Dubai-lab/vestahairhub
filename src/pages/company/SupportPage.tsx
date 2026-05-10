import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageCircle, ChevronDown, ShoppingBag, Store, CreditCard, ShieldAlert, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    category: 'Buying',
    Icon: ShoppingBag,
    questions: [
      {
        q: 'How do I place an order?',
        a: 'Browse the marketplace, add items to your cart, and proceed to checkout. You\'ll be given the seller\'s payment details (MoMo or OPay). Transfer the amount, then submit your payment reference on the platform so the seller can confirm.',
      },
      {
        q: 'Is it safe to buy on VestaHairHub?',
        a: 'We verify sellers and monitor all activity. Every seller has a public rating and review history. If something goes wrong, our reporting system lets you flag the seller directly and our admin team will investigate.',
      },
      {
        q: 'What if my order never arrives?',
        a: 'First, message the seller directly through the platform. If you don\'t get a resolution within 48 hours, use the Report function on the order page. Our team will review within 24 hours.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Contact the seller as soon as possible via the messages feature. Cancellations are at the seller\'s discretion before the item ships. Once shipped, you\'ll need to arrange a return directly with the seller.',
      },
    ],
  },
  {
    category: 'Selling',
    Icon: Store,
    questions: [
      {
        q: 'Is it really free to sell?',
        a: 'Yes. Creating a shop and listing products on VestaHairHub is completely free. There are no monthly fees or listing charges. We only ask that you sell honestly and treat buyers with respect.',
      },
      {
        q: 'How do I receive payment?',
        a: 'Set up your payment details (MoMo or OPay number) in your Dashboard → Payment Settings. Buyers pay you directly to this account. Once they submit a payment reference, confirm it in your dashboard and mark the order as confirmed.',
      },
      {
        q: 'How do I add products?',
        a: 'Go to Dashboard → Products → Add Product. Upload up to 5 images, set your price, category, stock quantity, and description. Your listing goes live immediately.',
      },
      {
        q: 'Can I run my own shop and also buy products?',
        a: 'Seller accounts are for selling only. To shop, use a separate buyer account or browse while logged out. We keep roles separate to prevent abuse of the review system.',
      },
    ],
  },
  {
    category: 'Payments',
    Icon: CreditCard,
    questions: [
      {
        q: 'What payment methods are supported?',
        a: 'Buyers pay sellers directly via Mobile Money (MoMo) or OPay. Sellers enter their payment account details in their dashboard, and buyers transfer the order total to that account.',
      },
      {
        q: 'Does VestaHairHub hold my money?',
        a: 'No. VestaHairHub does not process, hold, or escrow any funds. All payments go directly between buyer and seller. We are a marketplace platform, not a payment processor.',
      },
      {
        q: 'What if I sent money to the wrong account?',
        a: 'Always double-check the payment details before transferring. VestaHairHub is not liable for payments sent incorrectly. If you suspect fraud, report it immediately via the platform and contact your mobile money provider.',
      },
    ],
  },
  {
    category: 'Safety & Reports',
    Icon: ShieldAlert,
    questions: [
      {
        q: 'How do I report a scam seller?',
        a: 'Go to the seller\'s shop page or the order in question and click "Report". Provide as much detail as possible. Our admin team reviews all reports and takes action — including banning sellers — within 24–48 hours.',
      },
      {
        q: 'What happens to reported sellers?',
        a: 'Our admin team investigates every report. If a seller is found to have acted fraudulently, their shop is suspended immediately and their account is banned. Repeat offenders are permanently removed.',
      },
      {
        q: 'My account was banned — what can I do?',
        a: 'If you believe your account was banned in error, email appeals@vestahairhub.com with your account email and a description of the situation. We review all appeals within 5 business days.',
      },
    ],
  },
  {
    category: 'Account',
    Icon: User,
    questions: [
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'On the Sign In page, click "Forgot password?" and enter your email. You\'ll receive a reset link within a few minutes. Check your spam folder if you don\'t see it.',
      },
      {
        q: 'How do I update my profile or email?',
        a: 'Go to Account → Profile to update your full name and other details. To change your email address, contact support@vestahairhub.com as this requires identity verification.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Email support@vestahairhub.com with the subject "Account Deletion Request". We\'ll process your request within 7 business days. Note that some data may be retained for legal or fraud-prevention purposes.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-white/80">{q}</span>
        <ChevronDown size={16} className={`flex-shrink-0 text-white/30 transition-transform mt-0.5 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-white/50 leading-relaxed pb-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SupportPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 text-xs font-semibold tracking-wider uppercase mb-6">
            Help Centre
          </span>
          <h1 className="font-display text-5xl font-bold text-white mb-4">How Can We Help?</h1>
          <p className="text-white/55 leading-relaxed">
            Find answers to common questions below, or reach out to our team directly.
            We're here for buyers and sellers alike.
          </p>
        </motion.div>
      </section>

      {/* Contact cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <a href="mailto:support@vestahairhub.com"
            className="glass-dark rounded-2xl border border-white/5 hover:border-brand-500/30 p-6 flex gap-4 items-start transition-all hover:-translate-y-0.5 duration-300">
            <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-0.5">Email Support</p>
              <p className="text-xs text-white/45 mb-2">We respond within 24 hours on business days.</p>
              <p className="text-sm text-brand-400 font-medium">support@vestahairhub.com</p>
            </div>
          </a>

          <a href="https://wa.me/2348000000000?text=Hi%20VestaHairHub%20Support%2C%20I%20need%20help%20with..."
            target="_blank" rel="noopener noreferrer"
            className="glass-dark rounded-2xl border border-white/5 hover:border-green-500/30 p-6 flex gap-4 items-start transition-all hover:-translate-y-0.5 duration-300">
            <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-0.5">WhatsApp Support</p>
              <p className="text-xs text-white/45 mb-2">Chat with us directly for urgent issues.</p>
              <p className="text-sm text-green-400 font-medium">Chat on WhatsApp →</p>
            </div>
          </a>
        </motion.div>
      </section>

      {/* FAQs */}
      <section className="px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display text-3xl font-bold text-white text-center mb-10"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-5">
            {faqs.map(({ category, Icon, questions }, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                className="glass-dark rounded-2xl border border-white/5 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <Icon size={15} className="text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{category}</h3>
                </div>
                <div>
                  {questions.map(({ q, a }) => (
                    <FAQItem key={q} q={q} a={a} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-8 glass-dark rounded-2xl border border-brand-500/20 p-6 text-center"
          >
            <p className="text-white/60 text-sm mb-3">Didn't find what you were looking for?</p>
            <p className="text-white/40 text-xs">
              Email us at{' '}
              <a href="mailto:support@vestahairhub.com" className="text-brand-400 hover:text-brand-300 transition-colors">
                support@vestahairhub.com
              </a>
              {' '}or check our{' '}
              <Link to="/terms" className="text-brand-400 hover:text-brand-300 transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors">Privacy Policy</Link>.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
