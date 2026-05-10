import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

const SLIDES = [
  {
    title:    'Premium African Hair',
    subtitle: 'Virgin, remy and synthetic collections from top African hair sellers.',
    badge:    '🔥 Best Seller',
    gradient: 'from-amber-900 via-brand-800 to-brand-950',
    icon:     '💇',
    cta:      'hair',
  },
  {
    title:    'Nail Art Kits',
    subtitle: 'Everything you need for stunning nail art — from acrylics to press-ons.',
    badge:    '✨ Trending',
    gradient: 'from-pink-900 via-rose-800 to-brand-950',
    icon:     '💅',
    cta:      'nails',
  },
  {
    title:    'Natural Hair Care',
    subtitle: 'Authentic shea butter, black castor oil and African hair treatment products.',
    badge:    '🌿 Natural',
    gradient: 'from-emerald-900 via-teal-800 to-brand-950',
    icon:     '🧴',
    cta:      'hair-products',
  },
  {
    title:    'Mink Eyelashes',
    subtitle: 'Dramatic, natural and everything in between — handcrafted lash collections.',
    badge:    '💎 Luxury',
    gradient: 'from-purple-900 via-violet-800 to-brand-950',
    icon:     '👁️',
    cta:      'eyelashes',
  },
]

export function BannerSliderSection() {
  const navigate = useNavigate()

  return (
    <section className="section relative z-10 overflow-hidden">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-400 text-sm font-semibold tracking-widest uppercase">Featured Collections</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold text-white">
            Shop Our <span className="text-gold-gradient">Hottest</span> Collections
          </h2>
        </motion.div>

        <Swiper
          modules={[Autoplay, EffectCoverflow, Pagination]}
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          coverflowEffect={{ rotate: 20, stretch: 0, depth: 120, modifier: 1.5, slideShadows: false }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          className="pb-12"
        >
          {SLIDES.map((slide) => (
            <SwiperSlide key={slide.cta} style={{ width: 340, maxWidth: '85vw' }}>
              <div
                onClick={() => navigate(`/marketplace?category=${slide.cta}`)}
                className={`relative overflow-hidden rounded-3xl p-8 cursor-pointer min-h-[320px]
                            flex flex-col justify-between bg-gradient-to-br ${slide.gradient}
                            border border-white/10 group hover:border-brand-500/40 transition-all duration-300`}
              >
                {/* Glow blob */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brand-500/20 blur-3xl" />

                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-semibold text-white/80 self-start border border-white/10">
                  {slide.badge}
                </span>

                {/* Icon */}
                <div className="text-[80px] leading-none text-center my-4 group-hover:scale-110 transition-transform duration-300">
                  {slide.icon}
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">{slide.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{slide.subtitle}</p>
                  <div className="mt-4 text-brand-400 text-sm font-semibold flex items-center gap-1.5 group-hover:gap-3 transition-all">
                    Shop Now →
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
