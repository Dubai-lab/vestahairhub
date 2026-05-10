import type { ReactNode } from 'react'

type Variant = 'gold' | 'green' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  children: ReactNode
  variant?: Variant
  className?: string
}

const styles: Record<Variant, string> = {
  gold:  'bg-brand-500/15 text-brand-300 border border-brand-500/30',
  green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  red:   'bg-red-500/15   text-red-300   border border-red-500/30',
  blue:  'bg-blue-500/15  text-blue-300  border border-blue-500/30',
  gray:  'bg-white/5      text-white/60  border border-white/10',
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
