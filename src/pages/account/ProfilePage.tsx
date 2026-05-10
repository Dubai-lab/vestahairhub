import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { profile, user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone:     (profile as any)?.phone ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name })
      .eq('id', user!.id)

    if (error) { setServerError(error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <Link to="/account" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center">
          <User size={28} className="text-brand-400" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Profile</h1>
          <p className="text-white/40 text-sm mt-0.5">{user?.email}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-2xl p-6 space-y-5"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            {...register('full_name')}
            label="Full name"
            placeholder="Your full name"
            error={errors.full_name?.message}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Email address</label>
            <input
              disabled
              value={user?.email ?? ''}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 text-sm cursor-not-allowed"
            />
            <p className="text-xs text-white/25">Email cannot be changed here. Contact support if needed.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Role</label>
            <input
              disabled
              value={profile?.role ?? ''}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/40 text-sm capitalize cursor-not-allowed"
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{serverError}</p>
          )}

          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-green-400 bg-green-500/10 rounded-xl px-4 py-3 text-sm"
            >
              <CheckCircle size={16} /> Profile updated successfully!
            </motion.div>
          )}

          <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
        </form>
      </motion.div>
    </div>
  )
}
