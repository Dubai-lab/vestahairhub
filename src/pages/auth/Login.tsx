import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase }   from '@/lib/supabase'
import { Button }     from '@/components/ui/Button'
import { Input }      from '@/components/ui/Input'
import { UniverseBackground } from '@/components/three/UniverseBackground'
import { CursorSparkle }      from '@/components/three/CursorSparkle'
import logoSrc        from '@images/logo.png'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [showPwd,  setShowPwd]  = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })
    if (error) { setApiError(error.message); return }
    // onAuthStateChange will update context; navigate after
    navigate(from, { replace: true })
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

            <h1 className="font-display text-3xl font-bold text-white text-center mb-1">Welcome back</h1>
            <p className="text-white/45 text-sm text-center mb-8">Sign in to your VestaHairHub account</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  placeholder="••••••••"
                  leftIcon={<Lock size={16} />}
                  error={errors.password?.message}
                  autoComplete="current-password"
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

              <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full mt-2">
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/40">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}
