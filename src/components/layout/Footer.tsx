import { Link } from 'react-router-dom'
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react'
import logoSrc from '@images/logo.png'

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-space-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={logoSrc} alt="VestaHairHub" className="h-10 w-auto mb-4" />
            <p className="text-sm text-white/50 leading-relaxed">
              Africa's premier marketplace for authentic hair, nails, eyelashes and beauty products.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[
                { Icon: Instagram, href: '#', label: 'Instagram' },
                { Icon: Twitter,   href: '#', label: 'Twitter' },
                { Icon: Facebook,  href: '#', label: 'Facebook' },
                { Icon: Mail,      href: 'mailto:hello@vestahairhub.com', label: 'Email' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center text-white/50 hover:text-brand-400 hover:border-brand-500/40 transition-colors border border-white/8"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Marketplace</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Browse Products', to: '/marketplace' },
                { label: 'Hair',            to: '/marketplace?category=hair' },
                { label: 'Nails',           to: '/marketplace?category=nails' },
                { label: 'Hair Products',   to: '/marketplace?category=hair-products' },
                { label: 'Eyelashes',       to: '/marketplace?category=eyelashes' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/50 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Sellers</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Start Selling',    to: '/auth/register' },
                { label: 'Seller Dashboard', to: '/dashboard' },
                { label: 'How It Works',     to: '/how-it-works' },
                { label: 'Pricing Plans',    to: '/pricing' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/50 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'About Us',         to: '/about' },
                { label: 'Privacy Policy',   to: '/privacy' },
                { label: 'Terms of Service', to: '/terms' },
                { label: 'Support',          to: '/support' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/50 hover:text-brand-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} VestaHairHub. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            Made with ♥ for Africa
          </p>
        </div>
      </div>
    </footer>
  )
}
