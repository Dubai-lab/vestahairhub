import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle2, AlertCircle, RotateCcw, Loader2 } from 'lucide-react'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const ANON_KEY      = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const FACE_EDGE_URL = `${SUPABASE_URL}/functions/v1/kyc-face`

async function callEdge(body: object) {
  const res = await fetch(FACE_EDGE_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey':        ANON_KEY,
    },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<Record<string, unknown>>
}

type PageState = 'loading' | 'invalid' | 'done-already' | 'ready' | 'captured' | 'uploading' | 'success' | 'error'

export default function FaceCapturePage() {
  const [searchParams]       = useSearchParams()
  const webcamRef            = useRef<Webcam>(null)
  const token                = searchParams.get('token') ?? ''

  const [pageState,     setPageState]     = useState<PageState>('loading')
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
  const [selfieB64,     setSelfieB64]     = useState<string | null>(null)
  const [countdown,     setCountdown]     = useState<number | null>(null)
  const [errMsg,        setErrMsg]        = useState('')

  // Validate the token on mount — no login required
  useEffect(() => {
    if (!token) { setPageState('invalid'); return }
    callEdge({ action: 'validate', token })
      .then(data => {
        if (!data.valid)           setPageState('invalid')
        else if (data.already_captured) setPageState('done-already')
        else                            setPageState('ready')
      })
      .catch(() => setPageState('invalid'))
  }, [token])

  // Countdown → capture
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) { doCapture(); return }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const doCapture = useCallback(() => {
    const imgSrc = webcamRef.current?.getScreenshot({ width: 640, height: 480 })
    if (!imgSrc) { setErrMsg('Camera capture failed. Please allow camera access and try again.'); return }
    setSelfiePreview(imgSrc)
    setSelfieB64(imgSrc)
    setSelfiePreview(imgSrc)
    setPageState('captured')
    setCountdown(null)
  }, [])

  async function submitSelfie() {
    if (!selfieB64) return
    setPageState('uploading')
    try {
      const data = await callEdge({ action: 'submit', token, imageBase64: selfieB64 })
      if (data.success) {
        setPageState('success')
      } else {
        setErrMsg(String(data.error ?? 'Submission failed. Please try again.'))
        setPageState('error')
      }
    } catch {
      setErrMsg('Network error. Check your connection and try again.')
      setPageState('error')
    }
  }

  function retake() {
    setSelfiePreview(null)
    setSelfieB64(null)
    setErrMsg('')
    setPageState('ready')
  }

  return (
    <div className="min-h-screen bg-space-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo strip */}
        <div className="text-center">
          <p className="text-brand-400 font-bold text-lg tracking-tight">✨ VestaHairHub</p>
          <p className="text-white/30 text-xs mt-0.5">Identity Verification</p>
        </div>

        <AnimatePresence mode="wait">

          {/* Loading */}
          {pageState === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-dark rounded-2xl p-10 flex flex-col items-center gap-4 border border-white/5">
              <Loader2 size={32} className="text-brand-400 animate-spin" />
              <p className="text-white/50 text-sm">Verifying link…</p>
            </motion.div>
          )}

          {/* Invalid token */}
          {pageState === 'invalid' && (
            <motion.div key="invalid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-8 border border-red-500/20 text-center space-y-4">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Invalid or Expired Link</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                This face capture link is no longer valid. Go back to your KYC page on your computer and generate a fresh QR code to scan again.
              </p>
            </motion.div>
          )}

          {/* Already captured */}
          {pageState === 'done-already' && (
            <motion.div key="done-already" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-8 border border-green-500/20 text-center space-y-4">
              <CheckCircle2 size={40} className="text-green-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Already Submitted</h2>
              <p className="text-white/50 text-sm">Your selfie has already been captured. Return to your computer to continue the KYC process.</p>
            </motion.div>
          )}

          {/* Ready — camera */}
          {pageState === 'ready' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Take Your Selfie</h1>
                <p className="text-white/40 text-sm mt-1">Position your face in the oval. Good lighting, no glasses.</p>
              </div>
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
                    <mask id="oval-m">
                      <rect width="640" height="480" fill="white" />
                      <ellipse cx="320" cy="240" rx="190" ry="220" fill="black" />
                    </mask>
                  </defs>
                  <rect width="640" height="480" fill="rgba(0,0,0,0.55)" mask="url(#oval-m)" />
                  <ellipse cx="320" cy="240" rx="190" ry="220" fill="none" stroke="#C8851A" strokeWidth="4" strokeDasharray="16,8" />
                </svg>
                {/* Countdown */}
                <AnimatePresence>
                  {countdown !== null && countdown > 0 && (
                    <motion.div key={countdown} initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center">
                      <span className="text-9xl font-bold text-white drop-shadow-2xl">{countdown}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {errMsg && <p className="text-red-400 text-sm flex items-center gap-2 justify-center"><AlertCircle size={14} />{errMsg}</p>}
              <button
                type="button"
                onClick={() => { setErrMsg(''); setCountdown(3) }}
                disabled={countdown !== null}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-2xl text-white font-bold text-lg transition-colors shadow-lg shadow-brand-500/25"
              >
                <Camera size={22} />
                {countdown !== null ? 'Get ready…' : 'Take Selfie'}
              </button>
            </motion.div>
          )}

          {/* Captured — preview */}
          {pageState === 'captured' && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Looking good!</h1>
                <p className="text-white/40 text-sm mt-1">Use this photo or retake.</p>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img src={selfiePreview!} alt="Selfie preview" className="w-full" />
                <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full">Captured ✓</div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={retake}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:bg-white/5 transition-colors">
                  <RotateCcw size={15} /> Retake
                </button>
                <button type="button" onClick={submitSelfie}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-colors">
                  Submit Selfie ✓
                </button>
              </div>
            </motion.div>
          )}

          {/* Uploading */}
          {pageState === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-dark rounded-2xl p-10 flex flex-col items-center gap-4 border border-white/5">
              <Loader2 size={32} className="text-brand-400 animate-spin" />
              <p className="text-white/50 text-sm">Uploading your selfie…</p>
            </motion.div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-dark rounded-2xl p-8 border border-green-500/25 text-center space-y-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white">Selfie Submitted!</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Your face has been captured successfully. Return to your computer — the KYC page will automatically advance to the next step.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-dark rounded-2xl p-8 border border-red-500/20 text-center space-y-4">
              <AlertCircle size={40} className="text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-white/50 text-sm">{errMsg}</p>
              <button type="button" onClick={retake}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors">
                <RotateCcw size={14} /> Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
