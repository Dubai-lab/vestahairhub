import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp,
  User, FileText, Camera, AlertCircle, Loader2,
} from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import { useAuth }   from '@/context/AuthContext'
import { Button }    from '@/components/ui/Button'
import { Badge }     from '@/components/ui/Badge'
import { Spinner }   from '@/components/ui/Spinner'
import { sendNotification } from '@/lib/notify'
import type { KYCVerificationRow } from '@/types/database'

type KYC = KYCVerificationRow & {
  shops?: { name: string; slug: string } | null
}

const STATUS_BADGE: Record<string, { label: string; variant: 'gold' | 'green' | 'red' | 'blue' | 'gray' }> = {
  draft:     { label: 'Draft',        variant: 'gray'  },
  submitted: { label: 'Pending',      variant: 'gold'  },
  approved:  { label: 'Approved',     variant: 'green' },
  rejected:  { label: 'Rejected',     variant: 'red'   },
}

const ID_TYPE_LABELS: Record<string, string> = {
  national_id:      'National ID',
  passport:         'Passport',
  drivers_license:  "Driver's License",
}

function SignedImage({ bucket, path, className }: { bucket: string; path: string; className?: string }) {
  const { data: url } = useQuery({
    queryKey: ['signed-url', bucket, path],
    enabled:  !!path,
    staleTime: 50 * 60 * 1000, // 50 min
    queryFn:  async () => {
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
      return data?.signedUrl ?? null
    },
  })
  if (!url) return <div className={`bg-white/5 flex items-center justify-center text-white/20 ${className}`}><Loader2 size={18} className="animate-spin" /></div>
  return <img src={url} alt="KYC document" className={`object-cover ${className}`} />
}

function KYCRow({ kyc }: { kyc: KYC }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [notes,    setNotes]    = useState(kyc.admin_notes ?? '')
  const [acting,   setActing]   = useState<'approve' | 'reject' | null>(null)

  const decide = useMutation({
    mutationFn: async ({ action }: { action: 'approve' | 'reject' }) => {
      const now    = new Date().toISOString()
      const status = action === 'approve' ? 'approved' : 'rejected'

      // Update KYC record
      const { error: kycErr } = await supabase
        .from('kyc_verifications')
        .update({ status, admin_notes: notes, reviewed_at: now, reviewed_by: user!.id, updated_at: now })
        .eq('id', kyc.id)
      if (kycErr) throw kycErr

      // Update shop kyc_status
      const { error: shopErr } = await supabase
        .from('shops')
        .update({ kyc_status: status, updated_at: now })
        .eq('id', kyc.shop_id)
      if (shopErr) throw shopErr

      // Notify seller
      await sendNotification({
        type:        action === 'approve' ? 'kyc_approved' : 'kyc_rejected',
        seller_id:   kyc.seller_id,
        seller_name: kyc.full_name ?? 'Seller',
        shop_name:   kyc.shops?.name ?? '',
        notes:       notes,
      } as never)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-kyc'] }); setActing(null) },
    onError:   () => setActing(null),
  })

  const badge = STATUS_BADGE[kyc.status] ?? { label: kyc.status, variant: 'gray' as const }

  return (
    <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
          {(kyc.full_name?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {kyc.full_name ?? '—'}
          </p>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {kyc.shops?.name ?? '—'} · {kyc.submitted_at ? new Date(kyc.submitted_at).toLocaleDateString() : new Date(kyc.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {expanded ? <ChevronUp size={16} className="text-white/40 shrink-0" /> : <ChevronDown size={16} className="text-white/40 shrink-0" />}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-6">

              {/* Personal Info */}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                  <User size={12} /> Personal Info
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Full Name',  value: kyc.full_name },
                    { label: 'DOB',        value: kyc.date_of_birth },
                    { label: 'Country',    value: kyc.country },
                    { label: 'City',       value: kyc.city },
                    { label: 'Address',    value: kyc.address },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/3 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm text-white truncate">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ID Document */}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                  <FileText size={12} /> ID Document
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Type',    value: ID_TYPE_LABELS[kyc.id_type ?? ''] ?? kyc.id_type },
                    { label: 'Number',  value: kyc.id_number },
                    { label: 'Expiry',  value: kyc.id_expiry_date },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/3 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm text-white truncate">{value || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {kyc.id_front_path && (
                    <div>
                      <p className="text-xs text-white/40 mb-2">Front</p>
                      <div className="rounded-xl overflow-hidden aspect-video bg-white/5">
                        <SignedImage bucket="kyc-documents" path={kyc.id_front_path} className="w-full h-full" />
                      </div>
                    </div>
                  )}
                  {kyc.id_back_path && (
                    <div>
                      <p className="text-xs text-white/40 mb-2">Back</p>
                      <div className="rounded-xl overflow-hidden aspect-video bg-white/5">
                        <SignedImage bucket="kyc-documents" path={kyc.id_back_path} className="w-full h-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
                  <Camera size={12} /> Selfie
                </p>
                {kyc.selfie_path ? (
                  <div className="w-48 rounded-xl overflow-hidden aspect-square bg-white/5">
                    <SignedImage bucket="kyc-selfies" path={kyc.selfie_path} className="w-full h-full" />
                  </div>
                ) : (
                  <p className="text-white/30 text-sm">No selfie captured yet</p>
                )}
              </div>

              {/* Admin decision */}
              {(kyc.status === 'submitted' || kyc.status === 'approved' || kyc.status === 'rejected') && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-semibold">Admin Notes</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes (required for rejection)…"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
                  />

                  {kyc.status === 'submitted' && (
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={() => { setActing('approve'); decide.mutate({ action: 'approve' }) }}
                        isLoading={acting === 'approve' && decide.isPending}
                        leftIcon={<CheckCircle2 size={15} />}
                        className="flex-1 bg-green-600 hover:bg-green-700 border-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!notes.trim()) { alert('Please add a note explaining the rejection reason.'); return }
                          setActing('reject'); decide.mutate({ action: 'reject' })
                        }}
                        isLoading={acting === 'reject' && decide.isPending}
                        leftIcon={<XCircle size={15} />}
                        className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10"
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {(kyc.status === 'approved' || kyc.status === 'rejected') && (
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <AlertCircle size={13} />
                      Reviewed {kyc.reviewed_at ? new Date(kyc.reviewed_at).toLocaleDateString() : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminKYC() {
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-kyc', filter],
    queryFn:  async () => {
      let q = supabase
        .from('kyc_verifications')
        .select('*, shops(name, slug)')
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (filter !== 'all') q = q.eq('status', filter)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as unknown as KYC[]
    },
  })

  const counts = {
    submitted: records.filter(r => r.status === 'submitted').length,
    approved:  records.filter(r => r.status === 'approved').length,
    rejected:  records.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
          <Shield size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">KYC Verifications</h1>
          <p className="text-white/40 text-sm">Review and approve seller identity verifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', count: counts.submitted, color: 'text-amber-400',  bg: 'bg-amber-400/10',  Icon: Clock },
          { label: 'Approved',       count: counts.approved,  color: 'text-green-400',  bg: 'bg-green-400/10',  Icon: CheckCircle2 },
          { label: 'Rejected',       count: counts.rejected,  color: 'text-red-400',    bg: 'bg-red-400/10',    Icon: XCircle },
        ].map(({ label, count, color, bg, Icon }) => (
          <div key={label} className="glass-dark rounded-2xl p-4 border border-white/5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={17} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-white/40">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-white/5">
        {([
          { key: 'submitted', label: 'Pending' },
          { key: 'approved',  label: 'Approved' },
          { key: 'rejected',  label: 'Rejected' },
          { key: 'all',       label: 'All' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              filter === key ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
            {filter === key && (
              <motion.div layoutId="kyc-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-white/25">
          <Eye size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {filter === 'all' ? '' : filter} submissions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => <KYCRow key={r.id} kyc={r} />)}
        </div>
      )}
    </div>
  )
}
