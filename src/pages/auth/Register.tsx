import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }           from '@/lib/supabase'
import { sendNotification }   from '@/lib/notify'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import { UniverseBackground } from '@/components/three/UniverseBackground'
import { CursorSparkle }      from '@/components/three/CursorSparkle'
import logoSrc                from '@images/logo.png'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(['buyer', 'seller']),
})
type FormData = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: 'buyer',  label: 'I want to shop',  icon: '🛍️', sub: 'Browse and buy beauty products' },
  { value: 'seller', label: 'I want to sell',  icon: '🏪', sub: 'Open your beauty shop for free' },
] as const

export default function Register() {
  const navigate  = useNavigate()
  const [showPwd,  setShowPwd]  = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'buyer' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setApiError('')
    const { error, data: signUpData } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  {
        data: {
          full_name: data.fullName,
          role:      data.role,
        },
      },
    })
    if (error) { setApiError(error.message); return }

    // Fire welcome notification using the session token from signUp response
    // (avoids a race condition with onAuthStateChange not yet updating the store)
    if (signUpData?.session?.access_token) {
      sendNotification(
        { type: 'welcome', user_name: data.fullName, role: data.role, email_to: data.email },
        signUpData.session.access_token,
      ).catch(() => {})
    }

    // onAuthStateChange handles profile creation via DB trigger
    const dest = data.role === 'seller' ? '/dashboard' : '/marketplace'
    navigate(dest, { replace: true })
  }

  return (
    <>
      <UniverseBackground />
      <CursorSparkle />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass-dark rounded-3xl p-8 sm:p-10">
            {/* Back button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/80 transition-colors mb-6"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link to="/">
                <img src={logoSrc} alt="VestaHairHub" className="h-12 w-auto" />
              </Link>
            </div>

            <h1 className="font-display text-3xl font-bold text-white text-center mb-1">Create your account</h1>
            <p className="text-white/45 text-sm text-center mb-8">Join Africa's premier beauty marketplace — free forever</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Role picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">I am joining as…</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('role', opt.value)}
                      className={[
                        'flex flex-col items-center gap-1 p-4 rounded-2xl border text-center transition-all duration-200',
                        selectedRole === opt.value
                          ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                          : 'border-white/10 bg-white/3 text-white/50 hover:border-white/20 hover:text-white/70',
                      ].join(' ')}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-[11px] text-white/40">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                {...register('fullName')}
                type="text"
                label="Full name"
                placeholder="Your full name"
                leftIcon={<User size={16} />}
                error={errors.fullName?.message}
                autoComplete="name"
              />

              <Input
                {...register('email')}
                type="email"
                label="Email address"
                placeholder="you@example.com"
                leftIcon={<Mail size={16} />}
                error={errors.email?.message}
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  label="Password"
                  placeholder="Min. 6 characters"
                  leftIcon={<Lock size={16} />}
                  error={errors.password?.message}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-[38px] text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {apiError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {apiError}
                </div>
              )}

              <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full">
                {selectedRole === 'seller' ? 'Create Seller Account — Free' : 'Create Account'}
              </Button>

              <p className="text-center text-xs text-white/30">
                By registering you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}
