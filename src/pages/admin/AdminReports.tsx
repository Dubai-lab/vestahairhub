import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type Report = {
  id:                string
  reporter_id:       string | null
  reported_user_id:  string | null
  reported_shop_id:  string | null
  reported_order_id: string | null
  reason:            string
  details:           string | null
  status:            'pending' | 'investigating' | 'resolved' | 'dismissed'
  admin_notes:       string | null
  created_at:        string
  resolved_at:       string | null
}

const STATUS_BADGE: Record<string, 'gold' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending:       'gray',
  investigating: 'blue',
  resolved:      'green',
  dismissed:     'red',
}

export default function AdminReports() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [activeReport, setActiveReport] = useState<Report | null>(null)
  const [adminNotes,   setAdminNotes]   = useState('')
  const [resolveAs,    setResolveAs]    = useState<'investigating' | 'resolved' | 'dismissed'>('resolved')

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return (data ?? []) as Report[]
    },
  })

  const updateReport = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      await supabase.from('reports').update({
        status,
        admin_notes: notes || null,
        resolved_at: ['resolved', 'dismissed'].includes(status) ? new Date().toISOString() : null,
      }).eq('id', id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      qc.invalidateQueries({ queryKey: ['admin-report-count'] })
      setActiveReport(null)
      setAdminNotes('')
    },
  })

  const openReport = (report: Report) => {
    setActiveReport(report)
    setAdminNotes(report.admin_notes ?? '')
    setResolveAs('resolved')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Reports & Fraud</h1>
        <p className="text-white/40 text-sm mt-1">User-submitted fraud and scam reports</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'investigating', 'resolved', 'dismissed', 'all'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${
              statusFilter === s
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
            }`}
          >{s}</button>
        ))}
      </div>

      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Flag size={32} className="mx-auto mb-3 opacity-30" />
            <p>No {statusFilter !== 'all' ? statusFilter : ''} reports</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {reports.map(report => (
              <div key={report.id} className="px-5 py-4 hover:bg-white/2 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={STATUS_BADGE[report.status] ?? 'gray'}>{report.status}</Badge>
                      <span className="text-xs text-white/30">
                        {new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {report.reported_user_id && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                          User flagged
                        </span>
                      )}
                      {report.reported_shop_id && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Shop flagged
                        </span>
                      )}
                      {report.reported_order_id && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Order flagged
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <p className="font-medium text-white">{report.reason}</p>
                    {report.details && (
                      <p className="text-sm text-white/50 line-clamp-2">{report.details}</p>
                    )}

                    {/* IDs */}
                    <div className="flex gap-3 flex-wrap">
                      {report.reported_user_id && (
                        <p className="text-xs text-white/25 font-mono">User: {report.reported_user_id.slice(0, 8)}</p>
                      )}
                      {report.reported_shop_id && (
                        <p className="text-xs text-white/25 font-mono">Shop: {report.reported_shop_id.slice(0, 8)}</p>
                      )}
                      {report.reported_order_id && (
                        <p className="text-xs text-white/25 font-mono">Order: {report.reported_order_id.slice(0, 8)}</p>
                      )}
                    </div>

                    {/* Admin notes */}
                    {report.admin_notes && (
                      <p className="text-xs text-brand-400/70 italic bg-brand-500/5 px-3 py-1.5 rounded-lg">
                        Admin: {report.admin_notes}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  {(report.status === 'pending' || report.status === 'investigating') ? (
                    <button
                      onClick={() => openReport(report)}
                      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-500/15 text-brand-400 border border-brand-500/25 hover:bg-brand-500/25 transition-all"
                    >
                      Review
                    </button>
                  ) : (
                    <CheckCircle size={15} className="text-white/15 shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setActiveReport(null)}>
          <div className="glass-dark rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg">Review Report</h3>

            <div className="space-y-1.5 bg-white/3 rounded-xl p-4">
              <p className="text-sm font-medium text-white">{activeReport.reason}</p>
              {activeReport.details && (
                <p className="text-sm text-white/50">{activeReport.details}</p>
              )}
              <div className="flex gap-3 pt-1">
                {activeReport.reported_user_id && (
                  <span className="text-xs text-white/30 font-mono">User: {activeReport.reported_user_id.slice(0, 8)}</span>
                )}
                {activeReport.reported_shop_id && (
                  <span className="text-xs text-white/30 font-mono">Shop: {activeReport.reported_shop_id.slice(0, 8)}</span>
                )}
                {activeReport.reported_order_id && (
                  <span className="text-xs text-white/30 font-mono">Order: {activeReport.reported_order_id.slice(0, 8)}</span>
                )}
              </div>
            </div>

            <textarea
              value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Admin notes — what action did you take? (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none focus:border-brand-500"
            />

            {/* Status selector */}
            <div className="flex gap-2">
              {(['investigating', 'resolved', 'dismissed'] as const).map(s => (
                <button key={s} onClick={() => setResolveAs(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                    resolveAs === s
                      ? 'bg-brand-500/20 text-brand-400 border-brand-500/30'
                      : 'bg-white/5 text-white/40 border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                isLoading={updateReport.isPending}
                onClick={() => updateReport.mutate({ id: activeReport.id, status: resolveAs, notes: adminNotes })}
                className="flex-1"
              >
                Update Status
              </Button>
              <Button variant="ghost" onClick={() => setActiveReport(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
