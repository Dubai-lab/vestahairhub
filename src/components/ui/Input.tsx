import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  leftIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-white/70">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={[
            'w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm',
            'placeholder:text-white/25',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error
              ? 'border-red-500/70'
              : 'border-white/10 hover:border-white/20',
            leftIcon ? 'pl-10' : '',
            className,
          ].join(' ')}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
