import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/pagination'

const TESTIMONIALS = [
  {
    name:    'Chioma Okafor',
    role:    'Hair seller, Lagos Nigeria',
    flag:    '🇳🇬',
    text:    'I started my shop on VestaHairHub with just 10 products. Within 3 months I had over 200 orders. The platform made it so easy to set up and my MTN MoMo number works perfectly for receiving payments.',
    rating:  5,
  },
  {
    name:    'Akosua Mensah',
    role:    'Nail artist, Accra Ghana',
    flag:    '🇬🇭',
    text:    'My nail art kit business grew 300% after joining VestaHairHub. The dashboard is clean and I can see all my orders in one place. OPay integration is smooth — customers trust it.',
    rating:  5,
  },
  {
    name:    'Fatima Diallo',
    role:    'Beauty seller, Dakar Senegal',
    flag:    '🇸🇳',
    text:    "As a natural hair product seller, finding the right marketplace was difficult. VestaHairHub understands African beauty. My shea butter products reach customers in 5 countries now.",
    rating:  5,
  },
  {
    name:    'Blessing Eze',
    role:    'Lash vendor, Abuja Nigeria',
    flag:    '🇳🇬',
    text:    'The eyelash category is growing so fast on this platform. I love that my shop has its own page and my customers can see all my collections. Best investment for my lash business.',
    rating:  5,
  },
  {
    name:    'Amara Kouamé',
    role:    'Hair seller, Abidjan Côte d\'Ivoire',
    flag:    '🇨🇮',
    text:    'VestaHairHub is the African version of Shopify we always needed. Setting up was free, delivery confirmation is easy, and my revenue doubled in the first month.',
    rating:  5,
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-brand-400 text-brand-400" />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="section relative z-10 overflow-hidden">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-brand-400 text-sm font-semibold tracking-widest uppercase">Success Stories</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold text-white">
            Sellers <span className="text-gold-gradient">Love</span> VestaHairHub
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Real African sellers, real results. Join thousands who are already growing their beauty businesses.
          </p>
        </motion.div>

        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          spaceBetween={24}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          breakpoints={{
            640:  { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="pb-12"
        >
          {TESTIMONIALS.map((t) => (
            <SwiperSlide key={t.name}>
              <div className="glass-dark rounded-2xl p-6 flex flex-col gap-4 h-full min-h-[220px]">
                <Stars count={t.rating} />
                <p className="text-sm text-white/65 leading-relaxed flex-1 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-xl">
                    {t.flag}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
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
