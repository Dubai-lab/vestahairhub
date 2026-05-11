import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, AlertCircle, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import { useAuth }   from '@/context/AuthContext'
import { Button }    from '@/components/ui/Button'
import { Spinner }   from '@/components/ui/Spinner'

function base64ToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(b64)
  const ab = new ArrayBuffer(bytes.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i)
  return new Blob([ab], { type: mime })
}

export default function FaceCapturePage() {
  const [searchParams]       = useSearchParams()
  const { user }             = useAuth()
  const navigate             = useNavigate()
  const webcamRef            = useRef<Webcam>(null)
  const token                = searchParams.get('token') ?? ''

  const [captured,      setCaptured]      = useState(false)
  const [selfieBlob,    setSelfieBlob]    = useState<Blob | null>(null)
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [countdown,     setCountdown]     = useState<number | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [done,          setDone]          = useState(false)
  const [err,           setErr]           = useState('')

  // Fetch KYC record by face_token, verify it belongs to the authenticated seller
  const { data: kyc, isLoading, error: fetchErr } = useQuery({
    queryKey: ['kyc-face-token', token],
    enabled:  !!token && !!user,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('id, seller_id, face_token, face_captured_at')
        .eq('face_token', token)
        .eq('seller_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  // Countdown → capture
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { doCapture(); return }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const doCapture = useCallback(() => {
    const imgSrc = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
    if (!imgSrc) { setErr('Camera capture failed. Please allow camera access and try again.'); return }
    setSelfieBlob(base64ToBlob(imgSrc))
    setSelfiePreview(imgSrc)
    setCaptured(true)
    setCountdown(null)
  }, [])

  async function uploadSelfie() {
    if (!selfieBlob || !kyc || !user) return
    setUploading(true)
    const path = `${user.id}/selfie-${Date.now()}.jpg`
    const { error: upErr } = await supabase.storage.from('kyc-selfies').upload(path, selfieBlob, { upsert: true })
    if (upErr) { setErr('Upload failed. Please try again.'); setUploading(false); return }

    const { error: dbErr } = await supabase
      .from('kyc_verifications')
      .update({
        selfie_path:      path,
        face_captured_at: new Date().toISOString(),
        current_step:     4,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', kyc.id)

    setUploading(false)
    if (dbErr) { setErr('Failed to save. Please try again.'); return }
    setDone(true)
  }

  if (isLoading) return (
    <div className="min-h-screen bg-space-900 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  const notFound = fetchErr || !kyc
  const alreadyDone = kyc?.face_captured_at

  return (
    <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Back link */}
        <Link to="/dashboard/kyc" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft size={14} /> Back to KYC
        </Link>

        {notFound ? (
          /* ── Invalid token ── */
          <div className="glass-dark rounded-2xl p-8 border border-red-500/20 text-center space-y-4">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Invalid Link</h2>
            <p className="text-white/50 text-sm">
              This face capture link is invalid or has expired. Please go back to your KYC page and generate a new QR code.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard/kyc')}>Go to KYC Page</Button>
          </div>
        ) : alreadyDone ? (
          /* ── Already captured ── */
          <div className="glass-dark rounded-2xl p-8 border border-green-500/20 text-center space-y-4">
            <CheckCircle2 size={40} className="text-green-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Already Captured</h2>
            <p className="text-white/50 text-sm">Your selfie has already been submitted. Continue the KYC process on the original device.</p>
          </div>
        ) : done ? (
          /* ── Success ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-8 border border-green-500/25 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 size={32} className="text-green-400" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Selfie Submitted!</h2>
            <p className="text-white/50 text-sm">
              Your face has been captured successfully. Return to your computer to continue the KYC process.
            </p>
          </motion.div>
        ) : (
          /* ── Camera capture ── */
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Face Capture</h1>
              <p className="text-white/40 text-sm mt-1">
                {!captured
                  ? 'Position your face in the oval guide. Good lighting, no glasses.'
                  : 'Looking good! Use this photo or retake.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!captured ? (
                <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                      className="w-full"
                    />
                    {/* Oval overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 480" preserveAspectRatio="none">
                      <defs>
                        <mask id="face-mask-mobile">
                          <rect width="640" height="480" fill="white" />
                          <ellipse cx="320" cy="240" rx="190" ry="220" fill="black" />
                        </mask>
                      </defs>
                      <rect width="640" height="480" fill="rgba(0,0,0,0.55)" mask="url(#face-mask-mobile)" />
                      <ellipse cx="320" cy="240" rx="190" ry="220" fill="none" stroke="#C8851A" strokeWidth="4" strokeDasharray="16,8" />
                    </svg>
                    {/* Countdown */}
                    <AnimatePresence>
                      {countdown !== null && countdown > 0 && (
                        <motion.div
                          key={countdown}
                          initial={{ opacity: 0, scale: 1.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <span className="text-9xl font-bold text-white drop-shadow-2xl">{countdown}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {err && <p className="text-red-400 text-sm flex items-center gap-2 justify-center"><AlertCircle size={14} />{err}</p>}

                  <button
                    type="button"
                    onClick={() => { setErr(''); setCountdown(3) }}
                    disabled={countdown !== null}
                    className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-2xl text-white font-bold text-lg transition-colors shadow-lg shadow-brand-500/25"
                  >
                    <Camera size={22} />
                    {countdown !== null ? 'Get ready…' : 'Take Selfie'}
                  </button>
                </motion.div>
              ) : (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img src={selfiePreview!} alt="Selfie" className="w-full" />
                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">
                      Captured ✓
                    </div>
                  </div>
                  {err && <p className="text-red-400 text-sm flex items-center gap-2 justify-center"><AlertCircle size={14} />{err}</p>}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setCaptured(false); setSelfieBlob(null); setSelfiePreview(null); setErr('') }}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 transition-colors"
                    >
                      <RotateCcw size={15} /> Retake
                    </button>
                    <button
                      type="button"
                      onClick={uploadSelfie}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold transition-colors"
                    >
                      {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading…</> : <>Submit Selfie ✓</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
