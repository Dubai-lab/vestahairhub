import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using VestaHairHub ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Platform. These terms apply to all visitors, buyers, sellers, and administrators.',
  },
  {
    title: '2. The Platform',
    body: 'VestaHairHub is an online marketplace connecting sellers of African hair, nail, eyelash, and beauty products with buyers. We provide the technology platform only — we are not a party to transactions between buyers and sellers, and we do not hold, process, or guarantee payments.',
  },
  {
    title: '3. Accounts',
    items: [
      'You must provide accurate, complete information when registering.',
      'You are responsible for maintaining the security of your account credentials.',
      'You must be at least 18 years old to register as a seller.',
      'One person may not maintain multiple accounts. Duplicate accounts may be suspended.',
      'You may not transfer your account to another person without our written permission.',
    ],
  },
  {
    title: '4. Seller Responsibilities',
    items: [
      'Sellers must only list products they genuinely own or have the right to sell.',
      'All product descriptions, images, and prices must be accurate and not misleading.',
      'Sellers must fulfil orders promptly and communicate with buyers in good faith.',
      'Sellers must not use the platform to commit fraud, collect payment without delivering goods, or misrepresent products.',
      'Sellers are solely responsible for the quality and authenticity of their products.',
      'Sellers must provide accurate payment account details (MoMo/OPay) for buyers to send payments.',
      'VestaHairHub reserves the right to suspend or permanently ban any seller found to be acting in bad faith.',
    ],
  },
  {
    title: '5. Buyer Responsibilities',
    items: [
      'Buyers are responsible for verifying seller details before making payment.',
      'Payments are made directly to sellers via mobile money or bank transfer. VestaHairHub does not process payments.',
      'Buyers must submit accurate payment references via the platform after paying.',
      'Buyers must report any suspected scam or fraudulent seller to VestaHairHub immediately via the reporting system.',
      'Buyers must not attempt to chargeback or reverse legitimate payments for goods received.',
    ],
  },
  {
    title: '6. Payments',
    body: 'VestaHairHub facilitates a manual payment model. Buyers pay sellers directly via mobile money (MoMo), OPay, or bank transfer. VestaHairHub does not hold, escrow, or guarantee any funds. We are not responsible for payments sent to incorrect accounts. Always verify the seller\'s payment details before transferring funds. Disputes relating to payments must be reported within 14 days of the order date.',
  },
  {
    title: '7. Prohibited Conduct',
    items: [
      'Listing counterfeit, stolen, or prohibited products.',
      'Collecting payment without any intention of delivering goods ("exit scam").',
      'Harassment, threats, or abusive communication toward other users.',
      'Attempting to circumvent our platform (e.g. directing buyers off-platform to avoid accountability).',
      'Creating fake reviews or manipulating the rating system.',
      'Using automated tools to scrape, spam, or abuse the platform.',
      'Impersonating VestaHairHub staff or other users.',
    ],
  },
  {
    title: '8. Intellectual Property',
    body: 'The VestaHairHub name, logo, and platform design are the property of VestaHairHub. Sellers retain ownership of their product images and descriptions but grant VestaHairHub a non-exclusive licence to display this content on the platform for the purpose of operating the marketplace.',
  },
  {
    title: '9. Disclaimers & Limitation of Liability',
    body: 'VestaHairHub is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, error-free operation, or the accuracy of any seller-provided content. To the maximum extent permitted by law, VestaHairHub shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including losses from fraudulent sellers. Our total liability to any user shall not exceed the amount paid in subscription fees in the preceding 12 months.',
  },
  {
    title: '10. Termination',
    body: 'We reserve the right to suspend or terminate any account at our discretion if we believe these Terms have been violated. Users may close their accounts at any time by contacting support@vestahairhub.com. Termination does not affect any obligations already incurred (e.g. outstanding orders).',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Nigeria, unless otherwise agreed in writing.',
  },
  {
    title: '12. Changes to Terms',
    body: 'We may modify these Terms at any time. Significant changes will be communicated via email or platform notice. Continued use of VestaHairHub after changes constitutes acceptance of the revised Terms.',
  },
]

export default function TermsPage() {
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
            <FileText size={26} className="text-brand-400" />
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white/45 text-sm">Last updated: May 2026</p>
          <p className="text-white/55 mt-4 leading-relaxed">
            Please read these terms carefully before using VestaHairHub. They govern your rights
            and responsibilities as a buyer, seller, or visitor on our platform.
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto space-y-5"
        >
          {sections.map(({ title, body, items }) => (
            <div key={title} className="glass-dark rounded-2xl border border-white/5 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-white mb-4">{title}</h2>
              {body && <p className="text-sm text-white/55 leading-relaxed">{body}</p>}
              {items && (
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-white/55 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="glass-dark rounded-2xl border border-brand-500/20 p-6 text-center">
            <p className="text-sm text-white/50">
              Questions about our Terms?{' '}
              <a href="mailto:legal@vestahairhub.com" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                legal@vestahairhub.com
              </a>
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
