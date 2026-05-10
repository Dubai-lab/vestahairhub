import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        sub: 'Account Information',
        body: 'When you register, we collect your full name, email address, and chosen role (buyer or seller). Sellers additionally provide shop details including shop name, location, and payment account information (e.g. MoMo or OPay numbers) for order fulfilment.',
      },
      {
        sub: 'Transaction Data',
        body: 'We record order details, payment references submitted by buyers, and order statuses. We do not process card payments directly — all payments are made via mobile money or bank transfer outside our platform.',
      },
      {
        sub: 'Usage Data',
        body: 'We collect standard web analytics such as pages visited, time on site, browser type, and device type to improve the platform. This data is aggregated and not linked to individuals.',
      },
      {
        sub: 'Communications',
        body: 'Messages sent between buyers and sellers through our platform are stored to support dispute resolution and platform safety moderation.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      { sub: 'Platform Operation', body: 'To create and manage your account, display your shop and products, process orders, and facilitate buyer-seller communication.' },
      { sub: 'Safety & Fraud Prevention', body: 'To detect scams, resolve disputes, investigate reports, and take action against sellers or buyers who violate our Terms of Service.' },
      { sub: 'Communications', body: 'To send you transactional emails (order updates, account notifications). We will not send marketing emails without your explicit consent.' },
      { sub: 'Platform Improvement', body: 'To analyse usage patterns and improve the marketplace experience for all users.' },
    ],
  },
  {
    title: '3. Sharing Your Information',
    content: [
      { sub: 'Buyer–Seller Transactions', body: 'When you place an order, your shipping name and address are shared with the seller to fulfil your order. Sellers\' shop details and contact information are visible to buyers.' },
      { sub: 'Service Providers', body: 'We use Supabase for database and authentication services. These providers process data on our behalf under strict confidentiality agreements.' },
      { sub: 'Legal Requirements', body: 'We may disclose information if required by law, court order, or to protect the rights and safety of VestaHairHub and its users.' },
      { sub: 'No Data Sales', body: 'We will never sell, rent, or trade your personal information to third parties for their marketing purposes.' },
    ],
  },
  {
    title: '4. Data Security',
    content: [
      { sub: 'Encryption', body: 'All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text. Authentication is handled by Supabase Auth with industry-standard security practices.' },
      { sub: 'Access Controls', body: 'Row-level security ensures users can only access their own data. Admin access is restricted to authorised VestaHairHub staff only.' },
      { sub: 'No System is Perfect', body: 'While we take reasonable precautions, no internet transmission is 100% secure. We encourage you to use a strong, unique password and report any suspicious activity to support@vestahairhub.com.' },
    ],
  },
  {
    title: '5. Cookies',
    content: [
      { sub: 'Essential Cookies', body: 'We use cookies strictly necessary to keep you logged in and maintain your session. These cannot be disabled without logging you out.' },
      { sub: 'Analytics', body: 'We may use anonymous analytics cookies to understand how the platform is used. You can opt out via your browser settings.' },
      { sub: 'No Advertising Cookies', body: 'We do not use third-party advertising or tracking cookies.' },
    ],
  },
  {
    title: '6. Your Rights',
    content: [
      { sub: 'Access & Correction', body: 'You may view and update your personal information at any time via Account → Profile.' },
      { sub: 'Deletion', body: 'You may request deletion of your account and associated data by contacting support@vestahairhub.com. Note that some data may be retained for legal or fraud-prevention purposes.' },
      { sub: 'Data Portability', body: 'You may request a copy of your personal data in a machine-readable format by contacting us.' },
    ],
  },
  {
    title: '7. Changes to This Policy',
    content: [
      { sub: '', body: 'We may update this Privacy Policy from time to time. When we make significant changes, we will notify you via email or a prominent notice on the platform. Your continued use of VestaHairHub after changes constitutes acceptance of the updated policy.' },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center mx-auto mb-6">
            <Shield size={26} className="text-brand-400" />
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/45 text-sm">Last updated: May 2026</p>
          <p className="text-white/55 mt-4 leading-relaxed">
            Your privacy matters to us. This policy explains what data VestaHairHub collects,
            why we collect it, and how we protect it.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto space-y-6"
        >
          {sections.map(({ title, content }) => (
            <div key={title} className="glass-dark rounded-2xl border border-white/5 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-white mb-5">{title}</h2>
              <div className="space-y-4">
                {content.map(({ sub, body }) => (
                  <div key={sub || body.slice(0, 20)}>
                    {sub && <p className="text-sm font-semibold text-brand-400 mb-1">{sub}</p>}
                    <p className="text-sm text-white/55 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="glass-dark rounded-2xl border border-brand-500/20 p-6 text-center">
            <p className="text-sm text-white/50">
              Questions about this policy?{' '}
              <a href="mailto:privacy@vestahairhub.com" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                privacy@vestahairhub.com
              </a>
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
