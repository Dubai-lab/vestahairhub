import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

const STEPS = [
  { n: 1, label: 'Personal Info' },
  { n: 2, label: 'ID Document'   },
  { n: 3, label: 'Selfie'        },
  { n: 4, label: 'Review'        },
]

const ID_TYPES = [
  { value: 'national_id',     label: 'National ID Card'     },
  { value: 'passport',        label: 'International Passport' },
  { value: 'drivers_license', label: "Driver's License"     },
]

/* ─── helpers ───────────────────────────────────────────────────────── */
async function uploadToSupabase(bucket: string, uri: string, path: string): Promise<string> {
  const resp = await fetch(uri)
  const blob = await resp.blob()
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType: blob.type })
  if (error) throw error
  return path
}

/* ─── Step Progress Bar ─────────────────────────────────────────────── */
function StepBar({ current }: { current: number }) {
  return (
    <View style={sb.row}>
      {STEPS.map((s, i) => (
        <View key={s.n} style={[sb.stepWrap, i < STEPS.length - 1 && { flex: 1 }]}>
          <View style={[sb.circle,
            s.n < current  ? sb.circleDone :
            s.n === current ? sb.circleCurrent :
            sb.circleAhead
          ]}>
            <Text style={[sb.circleText,
              s.n < current  ? { color: '#7be3b1' } :
              s.n === current ? { color: COLORS.goldLight } :
              { color: COLORS.faint }
            ]}>
              {s.n < current ? '✓' : String(s.n)}
            </Text>
          </View>
          <Text style={[sb.label,
            s.n === current ? { color: COLORS.goldLight } :
            s.n < current   ? { color: '#7be3b1' }        : { color: COLORS.faint }
          ]} numberOfLines={1}>{s.label}</Text>
          {i < STEPS.length - 1 && (
            <View style={[sb.line, s.n < current && sb.lineDone]} />
          )}
        </View>
      ))}
    </View>
  )
}

const sb = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4, marginBottom: 24 },
  stepWrap:     { alignItems: 'center', position: 'relative' },
  circle:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  circleDone:   { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' },
  circleCurrent:{ backgroundColor: 'rgba(200,133,26,0.15)', borderColor: COLORS.gold },
  circleAhead:  { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: COLORS.border },
  circleText:   { fontSize: 12, fontWeight: '700' },
  label:        { fontSize: 9, marginTop: 4, textAlign: 'center', maxWidth: 56 },
  line:         { position: 'absolute', top: 15, left: '60%', right: '-60%', height: 1, backgroundColor: COLORS.border },
  lineDone:     { backgroundColor: 'rgba(52,211,153,0.4)' },
})

/* ─── Status Screens ────────────────────────────────────────────────── */
function SubmittedScreen() {
  return (
    <View style={st.center}>
      <View style={[st.iconCircle, { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' }]}>
        <Text style={{ fontSize: 36 }}>⏳</Text>
      </View>
      <Text style={st.title}>Under Review</Text>
      <Text style={st.sub}>
        Your KYC submission is being reviewed by our team. This usually takes 1–3 business days.
        You'll receive a notification once a decision is made.
      </Text>
    </View>
  )
}

function ApprovedScreen() {
  return (
    <View style={st.center}>
      <View style={[st.iconCircle, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }]}>
        <Text style={{ fontSize: 36 }}>✅</Text>
      </View>
      <Text style={st.title}>Verification Complete!</Text>
      <Text style={st.sub}>Your identity has been verified. Your shop is now live on the marketplace.</Text>
      <View style={st.verifiedBadge}>
        <Text style={st.verifiedText}>✓ Verified Seller</Text>
      </View>
    </View>
  )
}

function RejectedScreen({ notes, onReapply }: { notes: string | null; onReapply: () => void }) {
  return (
    <View style={st.center}>
      <View style={[st.iconCircle, { backgroundColor: 'rgba(244,163,163,0.1)', borderColor: 'rgba(244,163,163,0.3)' }]}>
        <Text style={{ fontSize: 36 }}>❌</Text>
      </View>
      <Text style={st.title}>Verification Rejected</Text>
      <Text style={st.sub}>Our team reviewed your submission and was unable to verify your identity.</Text>
      {notes ? (
        <View style={st.notesBox}>
          <Text style={st.notesLabel}>ADMIN FEEDBACK</Text>
          <Text style={st.notesText}>{notes}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={st.reapplyBtn} onPress={onReapply}>
        <Text style={st.reapplyText}>Re-apply Now</Text>
      </TouchableOpacity>
    </View>
  )
}

const st = StyleSheet.create({
  center:        { alignItems: 'center', paddingVertical: 32, gap: 14, paddingHorizontal: 8 },
  iconCircle:    { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:         { fontFamily: FONT.serif, fontSize: 22, color: COLORS.white, textAlign: 'center' },
  sub:           { fontSize: 13, color: COLORS.dim, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)' },
  verifiedText:  { fontSize: 12, fontWeight: '600', color: '#7be3b1' },
  notesBox:      { width: '100%', backgroundColor: 'rgba(244,163,163,0.08)', borderWidth: 1, borderColor: 'rgba(244,163,163,0.25)', borderRadius: 12, padding: 14, gap: 6 },
  notesLabel:    { fontSize: 9, letterSpacing: 1.2, color: '#f4a3a3', fontWeight: '700' },
  notesText:     { fontSize: 13, color: COLORS.dim, lineHeight: 18 },
  reapplyBtn:    { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  reapplyText:   { fontSize: 13, fontWeight: '700', color: COLORS.brandText },
})

/* ─── Step 1: Personal Info ─────────────────────────────────────────── */
function Step1({
  kyc, profile, onNext,
}: { kyc: any; profile: any; onNext: (data: object) => Promise<void> }) {
  const [fullName, setFullName]   = useState(kyc?.full_name     ?? profile?.full_name ?? '')
  const [dob,      setDob]        = useState(kyc?.date_of_birth ?? '')
  const [address,  setAddress]    = useState(kyc?.address       ?? '')
  const [city,     setCity]       = useState(kyc?.city          ?? '')
  const [country,  setCountry]    = useState(kyc?.country       ?? '')
  const [saving,   setSaving]     = useState(false)
  const [err,      setErr]        = useState('')

  async function handleNext() {
    if (!fullName.trim() || !dob || !address.trim() || !city.trim() || !country.trim()) {
      setErr('All fields are required.'); return
    }
    setSaving(true)
    try { await onNext({ full_name: fullName.trim(), date_of_birth: dob, address: address.trim(), city: city.trim(), country: country.trim() }) }
    catch { setErr('Failed to save. Please try again.') }
    setSaving(false)
  }

  return (
    <View style={p.container}>
      <Text style={p.stepTitle}>Personal Information</Text>
      <Text style={p.stepSub}>Enter your details exactly as they appear on your ID.</Text>

      <View style={p.card}>
        {[
          { label: 'Full Name',    value: fullName, setter: setFullName, placeholder: 'As on your ID',  keyboard: 'default' as const },
          { label: 'Date of Birth', value: dob,    setter: setDob,      placeholder: 'YYYY-MM-DD',     keyboard: 'numbers-and-punctuation' as const },
          { label: 'Home Address', value: address, setter: setAddress,  placeholder: 'Street address', keyboard: 'default' as const },
          { label: 'City',         value: city,    setter: setCity,     placeholder: 'Your city',      keyboard: 'default' as const },
          { label: 'Country',      value: country, setter: setCountry,  placeholder: 'Your country',   keyboard: 'default' as const },
        ].map((f, i) => (
          <View key={f.label}>
            {i > 0 && <View style={p.divider} />}
            <View style={p.field}>
              <Text style={p.fieldLabel}>{f.label.toUpperCase()}</Text>
              <TextInput
                style={p.input}
                value={f.value}
                onChangeText={(t) => { f.setter(t); setErr('') }}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.faint}
                keyboardType={f.keyboard}
              />
            </View>
          </View>
        ))}
      </View>

      {err ? <Text style={p.err}>{err}</Text> : null}

      <TouchableOpacity style={p.nextBtn} onPress={handleNext} disabled={saving}>
        {saving ? <ActivityIndicator color={COLORS.brandText} /> : <Text style={p.nextBtnText}>Save & Continue →</Text>}
      </TouchableOpacity>
    </View>
  )
}

/* ─── Step 2: ID Document ───────────────────────────────────────────── */
function Step2({
  kyc, userId, onNext, onBack,
}: { kyc: any; userId: string; onNext: (data: object) => Promise<void>; onBack: () => void }) {
  const [idType,    setIdType]    = useState(kyc?.id_type         ?? '')
  const [idNumber,  setIdNumber]  = useState(kyc?.id_number       ?? '')
  const [idExpiry,  setIdExpiry]  = useState(kyc?.id_expiry_date  ?? '')
  const [frontUri,  setFrontUri]  = useState<string | null>(null)
  const [backUri,   setBackUri]   = useState<string | null>(null)
  const [frontPath, setFrontPath] = useState(kyc?.id_front_path   ?? '')
  const [backPath,  setBackPath]  = useState(kyc?.id_back_path    ?? '')
  const [uploading, setUploading] = useState<'front' | 'back' | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState('')

  const requiresBack = idType === 'national_id'

  async function pickImage(side: 'front' | 'back') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to upload your ID.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    })
    if (result.canceled || !result.assets[0]) return
    const uri  = result.assets[0].uri
    const ext  = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/id-${side}-${Date.now()}.${ext}`
    setUploading(side)
    try {
      await uploadToSupabase('kyc-documents', uri, path)
      if (side === 'front') { setFrontUri(uri); setFrontPath(path) }
      else                  { setBackUri(uri);  setBackPath(path)  }
    } catch { setErr('Upload failed. Please try again.') }
    setUploading(null)
  }

  async function handleNext() {
    if (!idType || !idNumber.trim() || !idExpiry || !frontPath) {
      setErr('Please fill all fields and upload your document.'); return
    }
    if (requiresBack && !backPath) {
      setErr('National ID requires both front and back photos.'); return
    }
    setSaving(true)
    try {
      await onNext({ id_type: idType, id_number: idNumber.trim(), id_expiry_date: idExpiry, id_front_path: frontPath, id_back_path: backPath || null })
    } catch { setErr('Failed to save. Please try again.') }
    setSaving(false)
  }

  const typeLabel = ID_TYPES.find(t => t.value === idType)?.label

  return (
    <View style={p.container}>
      <Text style={p.stepTitle}>ID Document</Text>
      <Text style={p.stepSub}>Upload a valid government-issued ID. All documents are encrypted.</Text>

      {/* Document type chips */}
      <View style={p.typeRow}>
        {ID_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[p.typeChip, idType === t.value && p.typeChipSelected]}
            onPress={() => { setIdType(t.value); setBackUri(null); setBackPath(''); setErr('') }}
          >
            <Text style={[p.typeChipText, idType === t.value && { color: COLORS.goldLight }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={p.card}>
        <View style={p.field}>
          <Text style={p.fieldLabel}>DOCUMENT NUMBER</Text>
          <TextInput
            style={p.input}
            value={idNumber}
            onChangeText={t => { setIdNumber(t); setErr('') }}
            placeholder="Enter document number"
            placeholderTextColor={COLORS.faint}
            autoCapitalize="characters"
          />
        </View>
        <View style={p.divider} />
        <View style={p.field}>
          <Text style={p.fieldLabel}>EXPIRY DATE</Text>
          <TextInput
            style={p.input}
            value={idExpiry}
            onChangeText={t => { setIdExpiry(t); setErr('') }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.faint}
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {/* Upload slots */}
      {idType ? (
        <View style={p.uploadRow}>
          {[
            { side: 'front' as const, label: typeLabel === 'International Passport' ? 'Data Page *' : 'Front *', uri: frontUri, path: frontPath },
            ...(idType !== 'passport' ? [{ side: 'back' as const, label: requiresBack ? 'Back *' : 'Back', uri: backUri, path: backPath }] : []),
          ].map(slot => (
            <View key={slot.side} style={{ flex: 1 }}>
              <Text style={p.fieldLabel}>{slot.label}</Text>
              <TouchableOpacity
                style={[p.uploadBox, slot.path && p.uploadBoxDone]}
                onPress={() => pickImage(slot.side)}
                disabled={uploading !== null}
              >
                {uploading === slot.side ? (
                  <ActivityIndicator color={COLORS.goldLight} />
                ) : slot.uri ? (
                  <Image source={{ uri: slot.uri }} style={p.uploadThumb} />
                ) : slot.path ? (
                  <Text style={{ fontSize: 28 }}>✅</Text>
                ) : (
                  <>
                    <Text style={{ fontSize: 28, color: COLORS.faint }}>📷</Text>
                    <Text style={p.uploadHint}>Tap to upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {idType ? <Text style={p.imageTip}>JPG or PNG only. Make sure all text is clearly visible.</Text> : null}
      {err ? <Text style={p.err}>{err}</Text> : null}

      <View style={p.btnRow}>
        <TouchableOpacity style={p.backBtn} onPress={onBack}><Text style={p.backBtnText}>← Back</Text></TouchableOpacity>
        <TouchableOpacity style={[p.nextBtn, { flex: 1 }]} onPress={handleNext} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.brandText} /> : <Text style={p.nextBtnText}>Save & Continue →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ─── Step 3: Selfie ────────────────────────────────────────────────── */
function Step3({
  userId, onNext, onBack,
}: { kyc: any; userId: string; onNext: (data: object) => Promise<void>; onBack: () => void }) {
  const [selfieUri,  setSelfieUri]  = useState<string | null>(null)
  const [selfiePath, setSelfiePath] = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')

  async function takeSelfie() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to take your selfie.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    })
    if (result.canceled || !result.assets[0]) return
    const uri  = result.assets[0].uri
    const path = `${userId}/selfie-${Date.now()}.jpg`
    setUploading(true)
    try {
      await uploadToSupabase('kyc-selfies', uri, path)
      setSelfieUri(uri)
      setSelfiePath(path)
    } catch { setErr('Upload failed. Please try again.') }
    setUploading(false)
  }

  async function handleNext() {
    if (!selfiePath) { setErr('Please take your selfie first.'); return }
    setSaving(true)
    try { await onNext({ selfie_path: selfiePath, face_captured_at: new Date().toISOString() }) }
    catch { setErr('Failed to save. Please try again.') }
    setSaving(false)
  }

  return (
    <View style={p.container}>
      <Text style={p.stepTitle}>Face Capture</Text>
      <Text style={p.stepSub}>Take a clear selfie. Make sure your face is well-lit and visible.</Text>

      {/* Tips */}
      <View style={p.tipsBox}>
        {['Good lighting — avoid shadows on your face', 'Look directly at the camera', 'Remove glasses or hats', 'No filters or edits'].map(tip => (
          <Text key={tip} style={p.tip}>• {tip}</Text>
        ))}
      </View>

      {/* Selfie preview / capture area */}
      <TouchableOpacity
        style={[p.selfieBox, selfieUri && { borderStyle: 'solid', borderColor: '#7be3b1' }]}
        onPress={takeSelfie}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color={COLORS.goldLight} size="large" />
        ) : selfieUri ? (
          <Image source={{ uri: selfieUri }} style={p.selfieImage} />
        ) : (
          <>
            <Text style={{ fontSize: 52 }}>🤳</Text>
            <Text style={p.selfieHint}>Tap to open camera</Text>
            <Text style={p.selfieHint2}>Front-facing camera will open</Text>
          </>
        )}
      </TouchableOpacity>

      {selfieUri ? (
        <TouchableOpacity style={p.retakeBtn} onPress={takeSelfie}>
          <Text style={p.retakeBtnText}>Retake Photo</Text>
        </TouchableOpacity>
      ) : null}

      {err ? <Text style={p.err}>{err}</Text> : null}

      <View style={p.btnRow}>
        <TouchableOpacity style={p.backBtn} onPress={onBack}><Text style={p.backBtnText}>← Back</Text></TouchableOpacity>
        <TouchableOpacity style={[p.nextBtn, { flex: 1 }]} onPress={handleNext} disabled={saving || !selfiePath}>
          {saving ? <ActivityIndicator color={COLORS.brandText} /> : <Text style={p.nextBtnText}>Save & Continue →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ─── Step 4: Review & Submit ───────────────────────────────────────── */
function Step4({ kyc, onBack, onSubmit }: { kyc: any; onBack: () => void; onSubmit: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false)
  const [err,        setErr]        = useState('')

  async function handleSubmit() {
    if (!kyc?.selfie_path && !kyc?.face_captured_at) {
      setErr('Face capture is required before submitting.'); return
    }
    setSubmitting(true)
    try { await onSubmit() } catch { setErr('Submission failed. Please try again.') }
    setSubmitting(false)
  }

  const typeLabel = ID_TYPES.find(t => t.value === kyc?.id_type)?.label

  const fields = [
    { label: 'Full Name',      value: kyc?.full_name },
    { label: 'Date of Birth',  value: kyc?.date_of_birth },
    { label: 'Address',        value: kyc?.address },
    { label: 'City',           value: kyc?.city },
    { label: 'Country',        value: kyc?.country },
    { label: 'Document Type',  value: typeLabel ?? kyc?.id_type },
    { label: 'Document Number',value: kyc?.id_number },
    { label: 'Expiry Date',    value: kyc?.id_expiry_date },
    { label: 'ID Front',       value: kyc?.id_front_path ? '✓ Uploaded' : '✗ Missing' },
    { label: 'Face Selfie',    value: (kyc?.selfie_path || kyc?.face_captured_at) ? '✓ Captured' : '✗ Missing' },
  ]

  return (
    <View style={p.container}>
      <Text style={p.stepTitle}>Review & Submit</Text>
      <Text style={p.stepSub}>Verify that all information is correct before submitting.</Text>

      <View style={p.reviewCard}>
        {fields.map((f, i) => (
          <View key={f.label}>
            {i > 0 && <View style={p.divider} />}
            <View style={p.reviewRow}>
              <Text style={p.reviewLabel}>{f.label}</Text>
              <Text style={[p.reviewValue,
                f.value?.startsWith('✓') ? { color: '#7be3b1' } :
                f.value?.startsWith('✗') ? { color: '#f4a3a3' } : {}
              ]}>
                {f.value || '—'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={p.disclaimerBox}>
        <Text style={p.disclaimerText}>
          By submitting, you confirm that all information is accurate and the documents belong to you. Submitting false information may result in account suspension.
        </Text>
      </View>

      {err ? <Text style={p.err}>{err}</Text> : null}

      <View style={p.btnRow}>
        <TouchableOpacity style={p.backBtn} onPress={onBack}><Text style={p.backBtnText}>← Back</Text></TouchableOpacity>
        <TouchableOpacity style={[p.submitBtn, { flex: 1 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={p.submitBtnText}>🛡 Submit for Review</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const p = StyleSheet.create({
  container:       { gap: 16 },
  stepTitle:       { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },
  stepSub:         { fontSize: 13, color: COLORS.faint, lineHeight: 18, marginTop: -8 },
  card:            { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  divider:         { height: 1, backgroundColor: COLORS.border },
  field:           { padding: 14, gap: 6 },
  fieldLabel:      { fontSize: 10, color: COLORS.faint, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  input:           { fontSize: 14, color: COLORS.white, paddingVertical: 4 },
  typeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  typeChipSelected:{ borderColor: COLORS.gold, backgroundColor: 'rgba(200,133,26,0.12)' },
  typeChipText:    { fontSize: 12, color: COLORS.dim, fontWeight: '500' },
  uploadRow:       { flexDirection: 'row', gap: 10 },
  uploadBox:       { aspectRatio: 3 / 4, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, overflow: 'hidden', marginTop: 6 },
  uploadBoxDone:   { borderColor: '#7be3b1', borderStyle: 'solid' },
  uploadThumb:     { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadHint:      { fontSize: 11, color: COLORS.faint, marginTop: 4 },
  imageTip:        { fontSize: 10, color: COLORS.faint, lineHeight: 14 },
  tipsBox:         { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, gap: 6 },
  tip:             { fontSize: 12, color: COLORS.dim, lineHeight: 17 },
  selfieBox:       { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface, overflow: 'hidden', gap: 8 },
  selfieImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
  selfieHint:      { fontSize: 14, color: COLORS.dim, fontWeight: '500' },
  selfieHint2:     { fontSize: 11, color: COLORS.faint },
  retakeBtn:       { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  retakeBtnText:   { fontSize: 12, color: COLORS.faint },
  reviewCard:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  reviewRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  reviewLabel:     { fontSize: 11, color: COLORS.faint, flex: 1 },
  reviewValue:     { fontSize: 12, fontWeight: '600', color: COLORS.white, flex: 1, textAlign: 'right' },
  disclaimerBox:   { backgroundColor: 'rgba(200,133,26,0.06)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(200,133,26,0.15)' },
  disclaimerText:  { fontSize: 11, color: COLORS.faint, lineHeight: 17 },
  err:             { fontSize: 13, color: '#f4a3a3', backgroundColor: 'rgba(244,163,163,0.08)', padding: 10, borderRadius: 8 },
  btnRow:          { flexDirection: 'row', gap: 10 },
  backBtn:         { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  backBtnText:     { fontSize: 13, color: COLORS.faint },
  nextBtn:         { backgroundColor: COLORS.gold, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  nextBtnText:     { fontSize: 13, fontWeight: '700', color: COLORS.brandText },
  submitBtn:       { backgroundColor: '#1e3a5f', borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  submitBtnText:   { fontSize: 13, fontWeight: '700', color: COLORS.white },
})

/* ─── Main Screen ───────────────────────────────────────────────────── */
export default function DashboardKYCScreen() {
  const insets            = useSafeAreaInsets()
  const { user, profile } = useAuth()
  const qc                = useQueryClient()
  const [step, setStep]   = useState(1)

  const { data: shop } = useQuery<any>({
    queryKey:            ['seller-shop', user?.id],
    enabled:             !!user,
    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: kyc, isLoading, refetch } = useQuery<any>({
    queryKey: ['kyc', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('seller_id', user!.id)
        .maybeSingle()
      return data ?? null
    },
  })

  useEffect(() => {
    if (kyc?.status === 'draft') setStep(kyc.current_step ?? 1)
  }, [kyc?.id])

  async function saveAndAdvance(nextStep: number, data: object) {
    const now = new Date().toISOString()
    if (kyc) {
      await supabase.from('kyc_verifications')
        .update({ ...data, current_step: nextStep, updated_at: now })
        .eq('id', kyc.id)
    } else {
      await supabase.from('kyc_verifications')
        .insert({ seller_id: user!.id, shop_id: shop?.id, status: 'draft', current_step: nextStep, ...data })
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
    qc.invalidateQueries({ queryKey: ['seller-shop'] })
    await refetch()
  }

  async function reapply() {
    await supabase.from('kyc_verifications')
      .update({ status: 'draft', current_step: 1, admin_notes: null, updated_at: new Date().toISOString() })
      .eq('id', kyc!.id)
    await refetch()
    setStep(1)
  }

  return (
    <View style={[r.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={r.header}>
        <TouchableOpacity onPress={() => goBack('/(dashboard)/')}>
          <Text style={r.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={r.headerTitle}>KYC Verification</Text>
          <Text style={r.headerSub}>Verify your identity to activate your shop</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 40 }} />
      ) : !shop ? (
        <View style={r.noShop}>
          <Text style={{ fontSize: 48 }}>🏪</Text>
          <Text style={r.noShopTitle}>Shop required</Text>
          <Text style={r.noShopSub}>Set up your shop in Shop Settings before completing KYC.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>

            {kyc?.status === 'submitted' ? (
              <SubmittedScreen />
            ) : kyc?.status === 'approved' ? (
              <ApprovedScreen />
            ) : kyc?.status === 'rejected' ? (
              <RejectedScreen notes={kyc.admin_notes} onReapply={reapply} />
            ) : (
              <>
                <StepBar current={step} />
                {step === 1 && (
                  <Step1 kyc={kyc} profile={profile} onNext={d => saveAndAdvance(2, d)} />
                )}
                {step === 2 && (
                  <Step2 kyc={kyc} userId={user!.id} onNext={d => saveAndAdvance(3, d)} onBack={() => setStep(1)} />
                )}
                {step === 3 && (
                  <Step3 kyc={kyc} userId={user!.id} onNext={d => saveAndAdvance(4, d)} onBack={() => setStep(2)} />
                )}
                {step === 4 && (
                  <Step4 kyc={kyc} onBack={() => setStep(3)} onSubmit={submitKYC} />
                )}
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const r = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:        { color: COLORS.faint, fontSize: 22, width: 32 },
  headerTitle: { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },
  headerSub:   { fontSize: 11, color: COLORS.faint, marginTop: 2 },
  noShop:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  noShopTitle: { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  noShopSub:   { fontSize: 13, color: COLORS.dim, textAlign: 'center', lineHeight: 18 },
})
