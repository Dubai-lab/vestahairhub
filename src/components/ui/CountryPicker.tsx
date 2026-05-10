import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AFRICAN_COUNTRIES, flagUrl } from '@/lib/currencies'
import { useCountryStore }   from '@/store/countryStore'

export function CountryPicker() {
  const { selectedCountry, setCountry } = useCountryStore()
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active   = AFRICAN_COUNTRIES.find(c => c.name === selectedCountry)
  const filtered = search
    ? AFRICAN_COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : AFRICAN_COUNTRIES

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white glass hover:glass-dark transition-all border border-white/8"
      >
        {active
          ? <img src={flagUrl(active.code)} alt={active.name} className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
          : <span className="text-base leading-none">🌍</span>
        }
        <span className="hidden sm:inline max-w-[80px] truncate text-xs">
          {active?.name ?? 'All'}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{  opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-60 glass-dark rounded-2xl border border-brand-900/50 shadow-2xl z-[60] overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-white/5">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country…"
                  autoFocus
                  className="w-full pl-7 pr-3 py-2 bg-white/5 rounded-lg text-xs text-white placeholder:text-white/25 focus:outline-none"
                />
              </div>
            </div>

            {/* All option */}
            <button
              type="button"
              onClick={() => { setCountry(''); setOpen(false); setSearch('') }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                !selectedCountry
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="w-5 text-center text-base">🌍</span>
              <span>All Countries</span>
            </button>

            <div className="h-px bg-white/5" />

            {/* Country list */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-4">No results</p>
              ) : (
                filtered.map(c => (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => { setCountry(c.name); setOpen(false); setSearch('') }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      selectedCountry === c.name
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <img
                      src={flagUrl(c.code)}
                      alt={c.name}
                      className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0"
                    />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
