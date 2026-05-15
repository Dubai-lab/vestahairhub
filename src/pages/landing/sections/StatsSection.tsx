import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const STATIC_STATS = [
  { key: 'sellers',   suffix: '+', label: 'Active Sellers',     prefix: '' },
  { key: 'products',  suffix: '+', label: 'Products Listed',    prefix: '' },
  { key: 'countries', suffix: '+', label: 'African Countries',  prefix: '', static: 15 },
  { key: 'sat',       suffix: '%', label: 'Seller Satisfaction', prefix: '', static: 98 },
]

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count,  setCount]  = useState(0)
  const ref                  = useRef<HTMLSpanElement>(null)
  const inView               = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!inView) return
    let start   = 0
    const steps = 60
    const inc   = value / steps
    const timer = setInterval(() => {
      start += inc
      if (start >= value) { setCount(value); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export function StatsSection() {
  const { data: liveStats } = useQuery<{ sellers: number; products: number }>({
    queryKey: ['stats-section'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ count: sellers }, { count: products }] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }).eq('kyc_status', 'approved'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ])
      return { sellers: sellers ?? 0, products: products ?? 0 }
    },
  })

  const resolved = STATIC_STATS.map(s => ({
    ...s,
    value: s.static ?? (liveStats ? (liveStats as any)[s.key] : 0),
  }))

  return (
    <section className="section relative z-10">
      <div className="container-xl">
        <div className="glass-dark rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {resolved.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-bold text-gold-gradient font-display">
                  <Counter value={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <p className="mt-2 text-sm text-white/50">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
