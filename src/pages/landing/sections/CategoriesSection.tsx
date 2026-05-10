import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    name:        'Hair',
    slug:        'hair',
    icon:        '💇',
    description: 'Natural hair, wigs, weaves, braids and extensions from authentic African sellers.',
    gradient:    'from-amber-900/60 via-brand-800/40 to-brand-900/60',
    glow:        'rgba(200,133,26,0.3)',
    count:       '12,000+',
  },
  {
    name:        'Nails',
    slug:        'nails',
    icon:        '💅',
    description: 'Press-on nails, nail art kits, gels, acrylics and all nail accessories.',
    gradient:    'from-pink-900/60 via-rose-800/30 to-brand-900/60',
    glow:        'rgba(236,72,153,0.25)',
    count:       '8,500+',
  },
  {
    name:        'Hair Products',
    slug:        'hair-products',
    icon:        '🧴',
    description: 'Shea butter, hair oils, creams, relaxers and natural African hair care.',
    gradient:    'from-emerald-900/50 via-teal-800/30 to-brand-900/60',
    glow:        'rgba(52,211,153,0.2)',
    count:       '5,200+',
  },
  {
    name:        'Eyelashes',
    slug:        'eyelashes',
    icon:        '👁️',
    description: 'Mink lashes, synthetic lashes, lash glue, strips and full lash kits.',
    gradient:    'from-purple-900/50 via-violet-800/30 to-brand-900/60',
    glow:        'rgba(167,139,250,0.2)',
    count:       '3,800+',
  },
]

export function CategoriesSection() {
  const navigate = useNavigate()

  return (
    <section id="categories" className="section relative z-10">
      <div className="container-xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-14"
        >
          <span className="text-brand-400 text-sm font-semibold tracking-widest uppercase">Shop by Category</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold text-white">
            Everything Beauty,
            <span className="text-gold-gradient"> One Place</span>
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Browse thousands of authentic African beauty products across four core categories.
          </p>
        </motion.div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
              className="group relative tilt-card cursor-pointer"
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-white/8 p-7 flex flex-col gap-4 min-h-[260px]
                            bg-gradient-to-br ${cat.gradient}
                            transition-all duration-300 group-hover:border-white/20`}
                style={{
                  boxShadow: `0 0 0 0 ${cat.glow}`,
                  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px ${cat.glow}`
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${cat.glow}`
                }}
              >
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

                {/* Icon */}
                <span className="text-5xl">{cat.icon}</span>

                {/* Count badge */}
                <span className="absolute top-4 right-4 text-xs text-white/40 font-medium">
                  {cat.count} products
                </span>

                {/* Content */}
                <div className="mt-auto">
                  <h3 className="text-xl font-bold text-white font-display">{cat.name}</h3>
                  <p className="mt-1.5 text-sm text-white/55 leading-relaxed line-clamp-2">{cat.description}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-brand-400 mt-1 group-hover:gap-3 transition-all duration-200">
                  Shop Now <ArrowRight size={15} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
