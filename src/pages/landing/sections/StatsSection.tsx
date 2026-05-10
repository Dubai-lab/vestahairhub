import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  { value: 5000,  suffix: '+', label: 'Active Sellers',    prefix: '' },
  { value: 50000, suffix: '+', label: 'Products Listed',   prefix: '' },
  { value: 15,    suffix: '+', label: 'African Countries',  prefix: '' },
  { value: 98,    suffix: '%', label: 'Seller Satisfaction', prefix: '' },
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
  return (
    <section className="section relative z-10">
      <div className="container-xl">
        <div className="glass-dark rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
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
