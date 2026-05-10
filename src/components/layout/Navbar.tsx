import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, ChevronDown, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }        from '@/context/AuthContext'
import { useCartStore }   from '@/store/cartStore'
import { Button }         from '@/components/ui/Button'
import { CountryPicker }  from '@/components/ui/CountryPicker'
import logoSrc            from '@images/logo.png'

export function Navbar() {
  const { user, profile, role, isLoading, signOut } = useAuth()
  const totalItems = useCartStore((s) => s.totalItems())
  const navigate   = useNavigate()

  const [scrolled,     setScrolled]     = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Marketplace', to: '/marketplace' },
    { label: 'Hair',        to: '/marketplace?category=hair' },
    { label: 'Nails',       to: '/marketplace?category=nails' },
    { label: 'Lashes',      to: '/marketplace?category=eyelashes' },
  ]

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'glass-dark border-b border-brand-900/50 py-2'
          : 'bg-transparent border-b border-transparent py-4',
      ].join(' ')}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src={logoSrc} alt="VestaHairHub" className="h-10 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'text-brand-400' : 'text-white/70 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* Country picker — desktop */}
          <div className="hidden lg:block">
            <CountryPicker />
          </div>

          {/* Messages icon (logged-in only) */}
          {user && (
            <Link to="/messages" className="p-2 text-white/70 hover:text-white transition-colors">
              <MessageSquare size={20} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative p-2 text-white/70 hover:text-white transition-colors">
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {user ? (
            /* User menu */
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white glass hover:glass-dark transition-all"
              >
                <User size={16} />
                <span className="max-w-[100px] truncate">
                  {isLoading
                    ? <span className="inline-block w-14 h-3 bg-white/10 rounded animate-pulse" />
                    : (profile?.full_name?.split(' ')[0] ?? 'Account')
                  }
                </span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{  opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-dark rounded-2xl overflow-hidden border border-brand-900/50"
                  >
                    {(role === 'seller' || role === 'admin') && (
                      <Link
                        to={role === 'admin' ? '/admin' : '/dashboard'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-brand-500/10 transition-colors"
                      >
                        <LayoutDashboard size={15} /> {role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                      </Link>
                    )}
                    <Link
                      to="/account"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <User size={15} /> My Account
                    </Link>
                    <hr className="border-white/5 mx-3" />
                    <button
                      type="button"
                      onClick={() => { signOut(); setUserMenuOpen(false); navigate('/') }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/auth/register')}>
                Start Selling Free
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{  opacity: 0, height: 0 }}
            className="lg:hidden glass-dark border-t border-white/5 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">

              {/* Country picker — mobile */}
              <div className="px-1 pb-1">
                <p className="text-xs text-white/30 mb-2 px-3">Filter by country</p>
                <CountryPicker />
              </div>

              <hr className="border-white/5" />

              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-500/15 text-brand-400' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <hr className="border-white/5 my-1" />

              {user ? (
                <>
                  {(role === 'seller' || role === 'admin') && (
                    <Link to={role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                      <LayoutDashboard size={15} /> {role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                    </Link>
                  )}
                  <Link to="/messages" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                    <MessageSquare size={15} /> Messages
                  </Link>
                  <Link to="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl">
                    <User size={15} /> My Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => { signOut(); setMobileOpen(false); navigate('/') }}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="ghost" onClick={() => { navigate('/auth/login'); setMobileOpen(false) }}>Sign In</Button>
                  <Button variant="primary" onClick={() => { navigate('/auth/register'); setMobileOpen(false) }}>Start Selling Free</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
