import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, ArrowLeft, CheckCircle, LogOut, AlertTriangle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth }  from '@/context/AuthContext'
import { Button }   from '@/components/ui/Button'
import { Input }    from '@/components/ui/Input'

const pwSchema = z.object({
  new_password:     z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})
type PwForm = z.infer<typeof pwSchema>

export default function SettingsPage() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()
  const [pwSaved, setPwSaved]           = useState(false)
  const [pwError, setPwError]           = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  const onChangePassword = async (data: PwForm) => {
    setPwError(null)
    const { error } = await supabase.auth.updateUser({ password: data.new_password })
    if (error) { setPwError(error.message); return }
    setPwSaved(true)
    reset()
    setTimeout(() => setPwSaved(false), 3000)
  }

  const handleSignOut = () => {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      <Link to="/account" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Account
      </Link>

      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/15 flex items-center justify-center">
          <Settings size={28} className="text-brand-400" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/40 text-sm mt-0.5">Account preferences & security</p>
        </div>
      </div>

      {/* Change password */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-2xl p-6 space-y-5"
      >
        <h2 className="font-semibold text-white">Change Password</h2>

        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            {...register('new_password')}
            label="New password"
            type="password"
            placeholder="At least 8 characters"
            error={errors.new_password?.message}
          />
          <Input
            {...register('confirm_password')}
            label="Confirm new password"
            type="password"
            placeholder="Repeat new password"
            error={errors.confirm_password?.message}
          />

          {pwError && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{pwError}</p>
          )}

          {pwSaved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-green-400 bg-green-500/10 rounded-xl px-4 py-3 text-sm"
            >
              <CheckCircle size={16} /> Password updated successfully!
            </motion.div>
          )}

          <Button type="submit" isLoading={isSubmitting}>Update Password</Button>
        </form>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-dark rounded-2xl p-6 flex items-center justify-between gap-4"
      >
        <div>
          <p className="font-semibold text-white">Sign Out</p>
          <p className="text-sm text-white/40 mt-0.5">Sign out of your VestaHairHub account</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          leftIcon={<LogOut size={16} />}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-dark rounded-2xl p-6 border border-red-500/20 space-y-4"
      >
        <h2 className="font-semibold text-red-400 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger Zone
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">Delete Account</p>
            <p className="text-xs text-white/35 mt-0.5">Permanently remove your account and all data</p>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-300">
                  This action is <strong>permanent and cannot be undone</strong>. All your orders, data, and account will be deleted.
                </p>
                <p className="text-sm text-white/50">
                  To delete your account, please contact support at{' '}
                  <span className="text-brand-400">support@vestahairhub.com</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs text-white/40 hover:text-white underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
