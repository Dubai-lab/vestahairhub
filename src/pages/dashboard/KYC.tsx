import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Webcam from 'react-webcam'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, XCircle, Camera, Upload, FileText, User, Shield,
  ChevronRight, Smartphone, Loader2, AlertCircle, RotateCcw,
} from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import { useAuth }   from '@/context/AuthContext'
import { Button }    from '@/components/ui/Button'
import { Spinner }   from '@/components/ui/Spinner'
import type { KYCVerificationRow } from '@/types/database'

type KYC = KYCVerificationRow

const STEPS = [
  { n: 1, label: 'Personal Info',  Icon: User },
  { n: 2, label: 'ID Document',    Icon: FileText },
  { n: 3, label: 'Face Capture',   Icon: Camera },
  { n: 4, label: 'Review',         Icon: Shield },
]

const ID_TYPES = [
  { value: 'national_id',       label: 'National ID Card' },
  { value: 'passport',          label: 'International Passport' },
  { value: 'drivers_license',   label: "Driver's License" },
]

function base64ToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(b64)
  const ab = new ArrayBuffer(bytes.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i)
  return new Blob([ab], { type: mime })
}

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/* ── Status Screens ────────────────────────────────────────────────────────── */
function SubmittedScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
        <Loader2 size={36} className="text-blue-400 animate-spin" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-white">Under Review</h2>
        <p className="text-white/50 mt-2 max-w-md">
          Your KYC submission is being reviewed by our team. This usually takes 1–3 business days.
          You'll receive a notification once a decision is made.
        </p>
      </div>
    </div>
  )
}

function ApprovedScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-green-400" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-white">Verification Complete!</h2>
        <p className="text-white/50 mt-2 max-w-md">
          Your identity has been verified. Your shop is now live on the marketplace.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-medium">
        <CheckCircle2 size={14} /> Verified Seller
      </div>
    </div>
  )
}

function RejectedScreen({ notes, onReapply }: { notes: string | null; onReapply: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-lg mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
        <XCircle size={40} className="text-red-400" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-white">Verification Rejected</h2>
        <p className="text-white/50 mt-2">Our team reviewed your submission and was unable to verify your identity.</p>
      </div>
      {notes && (
        <div className="w-full glass-dark rounded-2xl p-5 border border-red-500/20 text-left">
          <p className="text-xs text-red-400/70 uppercase tracking-wider font-semibold mb-2">Admin Feedback</p>
          <p className="text-white/70 text-sm leading-relaxed">{notes}</p>
        </div>
      )}
      <Button variant="primary" onClick={onReapply} leftIcon={<RotateCcw size={16} />}>
        Re-apply Now
      </Button>
    </div>
  )
}

/* ── Step Progress ─────────────────────────────────────────────────────────── */
function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              s.n < current  ? 'bg-green-500/20 border border-green-500/40' :
              s.n === current ? 'bg-brand-500/20 border border-brand-500/50' :
                               'bg-white/5 border border-white/10'
            }`}>
              {s.n < current
                ? <CheckCircle2 size={18} className="text-green-400" />
                : <s.Icon size={16} className={s.n === current ? 'text-brand-400' : 'text-white/30'} />
              }
            </div>
            <span className={`text-[11px] font-medium hidden sm:block ${
              s.n === current ? 'text-brand-400' : s.n < current ? 'text-green-400' : 'text-white/30'
            }`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
              s.n < current ? 'bg-green-500/40' : 'bg-white/10'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Step 1: Personal Info ─────────────────────────────────────────────────── */
function Step1({ kyc, profile, onNext }: {
  kyc: KYC | null
  profile: { full_name?: string | null; country?: string | null } | null
  onNext: (data: object) => Promise<void>
}) {
  const [form, setForm] = useState({
    full_name:     kyc?.full_name     ?? profile?.full_name  ?? '',
    date_of_birth: kyc?.date_of_birth ?? '',
    address:       kyc?.address       ?? '',
    city:          kyc?.city          ?? '',
    country:       kyc?.country       ?? profile?.country    ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleNext() {
    if (!form.full_name || !form.date_of_birth || !form.address || !form.city || !form.country) {
      setErr('All fields are required.'); return
    }
    setSaving(true)
    try { await onNext(form) } catch { setErr('Failed to save. Please try again.') }
    setSaving(false)
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white">Personal Information</h2>
        <p className="text-white/40 text-sm mt-1">Enter your personal details exactly as they appear on your ID.</p>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Full Name',      key: 'full_name',     type: 'text',  placeholder: 'As on your ID' },
          { label: 'Date of Birth',  key: 'date_of_birth', type: 'date',  placeholder: '' },
          { label: 'Home Address',   key: 'address',       type: 'text',  placeholder: 'Street address' },
          { label: 'City',           key: 'city',          type: 'text',  placeholder: 'Your city' },
          { label: 'Country',        key: 'country',       type: 'text',  placeholder: 'Your country' },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
            <input
              type={type}
              value={(form as Record<string, string>)[key]}
              onChange={set(key)}
              placeholder={placeholder}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        ))}
      </div>

      {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</p>}

      <Button variant="primary" size="lg" onClick={handleNext} isLoading={saving} rightIcon={<ChevronRight size={17} />}>
        Save & Continue
      </Button>
    </div>
  )
}

/* ── Step 2: ID Document ───────────────────────────────────────────────────── */
function Step2({ kyc, userId, onNext, onBack }: {
  kyc: KYC | null
  userId: string
  onNext: (data: object) => Promise<void>
  onBack: () => void
}) {
  const [idType,    setIdType]    = useState(kyc?.id_type      ?? '')
  const [idNumber,  setIdNumber]  = useState(kyc?.id_number    ?? '')
  const [idExpiry,  setIdExpiry]  = useState(kyc?.id_expiry_date ?? '')
  const [frontPath, setFrontPath] = useState(kyc?.id_front_path ?? '')
  const [backPath,  setBackPath]  = useState(kyc?.id_back_path  ?? '')
  const [uploading, setUploading] = useState<'front' | 'back' | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef  = useRef<HTMLInputElement>(null)

  async function uploadDoc(file: File, side: 'front' | 'back') {
    setUploading(side)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/id-${side}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert: true })
    setUploading(null)
    if (error) { setErr('Upload failed. Try again.'); return }
    if (side === 'front') setFrontPath(path)
    else                  setBackPath(path)
  }

  async function handleNext() {
    if (!idType || !idNumber || !idExpiry || !frontPath) {
      setErr('Please complete all required fields and upload the front of your ID.'); return
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(idExpiry) <= today) { setErr('Your ID has expired. Please use a valid document.'); return }
    setSaving(true)
    try { await onNext({ id_type: idType, id_number: idNumber, id_expiry_date: idExpiry, id_front_path: frontPath, id_back_path: backPath }) }
    catch { setErr('Failed to save. Please try again.') }
    setSaving(false)
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white">ID Document</h2>
        <p className="text-white/40 text-sm mt-1">Upload a valid government-issued ID. All documents are encrypted and stored securely.</p>
      </div>

      {/* ID Type */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1.5 block">Document Type</label>
        <select
          value={idType}
          onChange={e => setIdType(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        >
          <option value="" className="bg-space-900">Select document type…</option>
          {ID_TYPES.map(t => <option key={t.value} value={t.value} className="bg-space-900">{t.label}</option>)}
        </select>
      </div>

      {/* ID Number */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1.5 block">Document Number</label>
        <input
          value={idNumber} onChange={e => setIdNumber(e.target.value)}
          placeholder="Enter document number"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
      </div>

      {/* Expiry */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1.5 block">Expiry Date</label>
        <input
          type="date" value={idExpiry} onChange={e => setIdExpiry(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        />
      </div>

      {/* Document uploads */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { side: 'front' as const, label: 'Front of ID *', ref: frontRef, path: frontPath, required: true },
          { side: 'back'  as const, label: 'Back of ID',    ref: backRef,  path: backPath,  required: false },
        ].map(({ side, label, ref, path }) => (
          <div key={side}>
            <label className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
            <input ref={ref} type="file" accept="image/*,.pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(f, side) }} />
            <button
              type="button"
              onClick={() => ref.current?.click()}
              className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                path
                  ? 'border-green-500/40 bg-green-500/5 text-green-400'
                  : 'border-white/15 bg-white/3 text-white/30 hover:border-brand-500/40 hover:text-brand-400'
              }`}
            >
              {uploading === side
                ? <Loader2 size={22} className="animate-spin" />
                : path
                  ? <><CheckCircle2 size={22} /><span className="text-xs font-medium">Uploaded</span></>
                  : <><Upload size={22} /><span className="text-xs">Click to upload</span></>
              }
            </button>
          </div>
        ))}
      </div>

      {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</p>}

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>Back</Button>
        <Button variant="primary" size="lg" onClick={handleNext} isLoading={saving} rightIcon={<ChevronRight size={17} />} className="flex-1">
          Save & Continue
        </Button>
      </div>
    </div>
  )
}

/* ── Step 3: Face Capture ──────────────────────────────────────────────────── */
function Step3({ kyc, userId, onNext, onBack, onRealtimeCapture }: {
  kyc: KYC | null
  userId: string
  onNext: (data: object) => Promise<void>
  onBack: () => void
  onRealtimeCapture: (handler: () => void) => void
}) {
  const webcamRef           = useRef<Webcam>(null)
  const [isMobile]          = useState(() => isMobileDevice())
  const [captured,          setCaptured]  = useState(false)
  const [selfieBlob,        setSelfieBlob]  = useState<Blob | null>(null)
  const [selfiePreview,     setSelfiePreview] = useState<string | null>(null)
  const [countdown,         setCountdown] = useState<number | null>(null)
  const [uploading,         setUploading] = useState(false)
  const [err,               setErr]       = useState('')
  const [mobileCompleted,   setMobileCompleted] = useState(false)

  const faceUrl = `${window.location.origin}/kyc/face?token=${kyc?.face_token ?? ''}`

  // Register the handler that fires when mobile completes face capture via Realtime
  useEffect(() => {
    onRealtimeCapture(() => setMobileCompleted(true))
  }, [onRealtimeCapture])

  // Countdown then capture
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { doCapture(); return }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const doCapture = useCallback(() => {
    const imgSrc = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
    if (!imgSrc) { setErr('Camera capture failed. Please try again.'); return }
    const blob = base64ToBlob(imgSrc)
    setSelfieBlob(blob)
    setSelfiePreview(imgSrc)
    setCaptured(true)
    setCountdown(null)
  }, [])

  async function uploadAndNext() {
    if (!selfieBlob) return
    setUploading(true)
    const path = `${userId}/selfie-${Date.now()}.jpg`
    const { error } = await supabase.storage.from('kyc-selfies').upload(path, selfieBlob, { upsert: true })
    setUploading(false)
    if (error) { setErr('Upload failed. Please try again.'); return }
    await onNext({ selfie_path: path, face_captured_at: new Date().toISOString() })
  }

  if (mobileCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
        <CheckCircle2 size={52} className="text-green-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Face Captured!</h3>
          <p className="text-white/50 mt-1 text-sm">Your selfie was captured on your mobile device.</p>
        </div>
        <Button variant="primary" size="lg" rightIcon={<ChevronRight size={17} />}
          onClick={() => onNext({})}>
          Continue to Review
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white">Face Capture</h2>
        <p className="text-white/40 text-sm mt-1">
          {isMobile
            ? 'Position your face in the oval guide and take a clear selfie.'
            : 'Scan the QR code with your phone to complete the face capture step.'}
        </p>
      </div>

      {isMobile ? (
        /* ── Mobile: direct webcam ── */
        <div className="space-y-4">
          {!captured ? (
            <>
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                  className="w-full rounded-2xl"
                />
                {/* Oval overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 480" preserveAspectRatio="none">
                  <defs>
                    <mask id="face-mask">
                      <rect width="640" height="480" fill="white" />
                      <ellipse cx="320" cy="240" rx="180" ry="220" fill="black" />
                    </mask>
                  </defs>
                  <rect width="640" height="480" fill="rgba(0,0,0,0.55)" mask="url(#face-mask)" />
                  <ellipse cx="320" cy="240" rx="180" ry="220" fill="none" stroke="#C8851A" strokeWidth="3" strokeDasharray="12,6" />
                </svg>
                {/* Countdown overlay */}
                {countdown !== null && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-8xl font-bold text-white drop-shadow-2xl"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/40 text-center">Ensure good lighting · Face the camera · Remove glasses</p>
              <Button variant="primary" size="lg" className="w-full"
                onClick={() => setCountdown(3)} disabled={countdown !== null}>
                <Camera size={18} className="mr-2" />
                {countdown !== null ? 'Preparing…' : 'Take Selfie'}
              </Button>
            </>
          ) : (
            <>
              <div className="relative rounded-2xl overflow-hidden">
                <img src={selfiePreview!} alt="Selfie preview" className="w-full rounded-2xl" />
                <div className="absolute top-3 right-3 bg-green-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Captured ✓
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setCaptured(false); setSelfieBlob(null); setSelfiePreview(null) }}>
                  Retake
                </Button>
                <Button variant="primary" className="flex-1" isLoading={uploading}
                  rightIcon={<ChevronRight size={17} />} onClick={uploadAndNext}>
                  Use This Photo
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── Desktop: QR code ── */
        <div className="space-y-6">
          <div className="glass-dark rounded-2xl p-8 flex flex-col items-center gap-6 border border-brand-500/20">
            <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
              <Smartphone size={22} className="text-brand-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Scan with your phone</p>
              <p className="text-white/40 text-sm mt-1">Open the camera app and point it at this code</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-2xl">
              <QRCodeSVG
                value={faceUrl}
                size={200}
                level="M"
                marginSize={2}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <Loader2 size={13} className="animate-spin" />
              Waiting for mobile to complete…
            </div>
          </div>

          <div className="glass-dark rounded-xl p-4 border border-white/5">
            <p className="text-xs text-white/40 leading-relaxed">
              <strong className="text-white/60">How it works:</strong> Scan the QR code → log in if prompted →
              take a selfie → this page will automatically advance when complete.
            </p>
          </div>
        </div>
      )}

      {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</p>}

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>Back</Button>
      </div>
    </div>
  )
}

/* ── Step 4: Review & Submit ───────────────────────────────────────────────── */
function Step4({ kyc, onBack, onSubmit }: {
  kyc: KYC | null
  onBack: () => void
  onSubmit: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit() {
    if (!kyc?.selfie_path && !kyc?.face_captured_at) {
      setErr('Face capture is required before submitting.'); return
    }
    setSubmitting(true)
    try { await onSubmit() } catch { setErr('Submission failed. Please try again.') }
    setSubmitting(false)
  }

  const fields = [
    { label: 'Full Name',       value: kyc?.full_name },
    { label: 'Date of Birth',   value: kyc?.date_of_birth },
    { label: 'Address',         value: kyc?.address },
    { label: 'City',            value: kyc?.city },
    { label: 'Country',         value: kyc?.country },
    { label: 'Document Type',   value: ID_TYPES.find(t => t.value === kyc?.id_type)?.label ?? kyc?.id_type },
    { label: 'Document Number', value: kyc?.id_number },
    { label: 'Expiry Date',     value: kyc?.id_expiry_date },
    { label: 'ID Front',        value: kyc?.id_front_path ? '✓ Uploaded' : '✗ Missing' },
    { label: 'Face Selfie',     value: (kyc?.selfie_path || kyc?.face_captured_at) ? '✓ Captured' : '✗ Missing' },
  ]

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h2 className="text-xl font-bold text-white">Review & Submit</h2>
        <p className="text-white/40 text-sm mt-1">Verify that all information is correct before submitting.</p>
      </div>

      <div className="glass-dark rounded-2xl border border-white/5 divide-y divide-white/5">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">{label}</span>
            <span className={`text-sm font-medium ${
              value?.startsWith('✓') ? 'text-green-400' :
              value?.startsWith('✗') ? 'text-red-400'   : 'text-white'
            }`}>{value || '—'}</span>
          </div>
        ))}
      </div>

      <div className="glass-dark rounded-xl p-4 border border-brand-500/15 text-sm text-white/50 leading-relaxed">
        By submitting, you confirm that all information provided is accurate and the documents belong to you.
        Submitting false information may result in account suspension.
      </div>

      {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</p>}

      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack}>Back</Button>
        <Button variant="primary" size="lg" onClick={handleSubmit} isLoading={submitting}
          rightIcon={<Shield size={17} />} className="flex-1">
          Submit for Review
        </Button>
      </div>
    </div>
  )
}

/* ── Main KYC Page ─────────────────────────────────────────────────────────── */
export default function KYCPage() {
  const { user, profile } = useAuth()
  const qc = useQueryClient()
  const mobileHandlerRef = useRef<(() => void) | null>(null)

  const { data: shop } = useQuery({
    queryKey: ['seller-shop', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: kyc, isLoading, refetch } = useQuery({
    queryKey: ['kyc', shop?.id],
    enabled:  !!shop,
    queryFn:  async () => {
      const { data } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('seller_id', user!.id)
        .maybeSingle()
      return data as KYC | null
    },
  })

  const [step, setStep] = useState(1)

  // Sync step from DB on first load
  useEffect(() => {
    if (kyc && kyc.status === 'draft') {
      setStep(kyc.current_step ?? 1)
    }
  }, [kyc?.id])

  // Realtime subscription: desktop waiting for mobile face capture
  useEffect(() => {
    if (!kyc?.id) return
    const channel = supabase.channel(`kyc-${kyc.id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'kyc_verifications',
        filter: `id=eq.${kyc.id}`,
      }, (payload) => {
        const updated = payload.new as KYC
        if (updated.face_captured_at && !kyc.face_captured_at) {
          refetch()
          mobileHandlerRef.current?.()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [kyc?.id])

  function registerMobileHandler(fn: () => void) {
    mobileHandlerRef.current = fn
  }

  async function saveAndAdvance(nextStep: number, data: object) {
    const now = new Date().toISOString()
    if (kyc) {
      await supabase.from('kyc_verifications')
        .update({ ...data, current_step: nextStep, updated_at: now })
        .eq('id', kyc.id)
    } else {
      await supabase.from('kyc_verifications')
        .insert({ seller_id: user!.id, shop_id: shop!.id, current_step: nextStep, ...data })
    }
    await refetch()
    setStep(nextStep)
  }

  async function submitKYC() {
    const now = new Date().toISOString()
    await supabase.from('kyc_verifications')
      .update({ status: 'submitted', submitted_at: now, updated_at: now })
      .eq('id', kyc!.id)
    qc.invalidateQueries({ queryKey: ['kyc'] })
    await refetch()
  }

  async function reapply() {
    if (!kyc) return
    await supabase.from('kyc_verifications')
      .update({ status: 'draft', current_step: 1, admin_notes: null, updated_at: new Date().toISOString() })
      .eq('id', kyc.id)
    await refetch()
    setStep(1)
  }

  if (!shop) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <Shield size={40} className="text-white/20" />
      <p className="text-white/50">You need a shop before completing KYC verification.</p>
      <Button variant="primary" onClick={() => location.href = '/dashboard/settings'}>Create Shop</Button>
    </div>
  )

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
            <Shield size={16} className="text-brand-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">KYC Verification</h1>
        </div>
        <p className="text-white/40 text-sm ml-11">
          Verify your identity to list your shop on the marketplace.
        </p>
      </div>

      {/* Status-based rendering */}
      {kyc?.status === 'submitted' ? (
        <SubmittedScreen />
      ) : kyc?.status === 'approved' ? (
        <ApprovedScreen />
      ) : kyc?.status === 'rejected' ? (
        <RejectedScreen notes={kyc.admin_notes} onReapply={reapply} />
      ) : (
        <>
          <StepProgress current={step} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <Step1
                  kyc={kyc ?? null}
                  profile={profile}
                  onNext={data => saveAndAdvance(2, data)}
                />
              )}
              {step === 2 && (
                <Step2
                  kyc={kyc ?? null}
                  userId={user!.id}
                  onNext={data => saveAndAdvance(3, data)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step3
                  kyc={kyc ?? null}
                  userId={user!.id}
                  onNext={data => saveAndAdvance(4, data)}
                  onBack={() => setStep(2)}
                  onRealtimeCapture={registerMobileHandler}
                />
              )}
              {step === 4 && (
                <Step4
                  kyc={kyc ?? null}
                  onBack={() => setStep(3)}
                  onSubmit={submitKYC}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
