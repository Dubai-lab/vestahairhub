import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  isLoading?: boolean
  leftIcon?:  ReactNode
  rightIcon?: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-brand-500 hover:bg-brand-400 text-white border border-brand-500 hover:border-brand-400 hover:glow-gold shadow-lg',
  secondary:
    'bg-brand-900 hover:bg-brand-800 text-brand-300 border border-brand-800 hover:border-brand-600',
  outline:
    'bg-transparent hover:bg-brand-500/10 text-brand-300 border border-brand-500 hover:border-brand-400',
  ghost:
    'bg-transparent hover:bg-white/5 text-white/70 hover:text-white border border-transparent',
  danger:
    'bg-red-600 hover:bg-red-500 text-white border border-red-600 hover:border-red-500',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg  gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl  gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, className = '', disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-space-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  ),
)
Button.displayName = 'Button'
