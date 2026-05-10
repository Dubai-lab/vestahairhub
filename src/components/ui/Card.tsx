import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'dark'
  hover?:   boolean
}

export function Card({ children, variant = 'default', hover = false, className = '', ...rest }: CardProps) {
  const base: Record<string, string> = {
    default: 'bg-space-800 border border-white/8',
    glass:   'glass',
    dark:    'glass-dark',
  }

  return (
    <div
      className={[
        'rounded-2xl overflow-hidden',
        base[variant],
        hover ? 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
