import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

type MethodType = 'mtn_momo' | 'opay' | 'bank_transfer'

const METHODS: { type: MethodType; label: string; icon: string; hint: string }[] = [
  { type: 'mtn_momo',      label: 'MTN MoMo',     icon: '📱', hint: 'Pan-African Mobile Money' },
  { type: 'opay',          label: 'OPay',          icon: '💳', hint: 'Nigerian digital payment' },
  { type: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', hint: 'Direct bank account' },
]

const HOW_IT_WORKS = [
  'Customer places an order and sees your payment details',
  'Customer sends money to your MoMo/OPay number externally',
  'Customer enters the payment reference and clicks "I Have Paid"',
  'You receive a notification — review and click "Confirm Payment"',
  'Order status updates and you process the shipment',
]

export default function DashboardPaymentsScreen() {
  const insets   = useSafeAreaInsets()
  const { user } = useAuth()
  const qc       = useQueryClient()

  const [showForm,     setShowForm]     = useState(false)
  const [methodType,   setMethodType]   = useState<MethodType>('mtn_momo')
  const [accountName,  setAccountName]  = useState('')
  const [accountNum,   setAccountNum]   = useState('')
  const [bankName,     setBankName]     = useState('')
  const [formError,    setFormError]    = useState('')

  const { data: shop } = useQuery<any>({
    queryKey:            ['seller-shop', user?.id],
    enabled:             !!user,
    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('id, name').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: methods = [], isLoading } = useQuery<any[]>({
    queryKey: ['payment-methods', shop?.id],
    enabled:  !!shop?.id,
    queryFn:  async () => {
      const { data } = await supabase
        .from('shop_payment_methods')
        .select('*')
        .eq('shop_id', shop!.id)
        .order('created_at', { ascending: true })
      return data ?? []
    },
  })

  function resetForm() {
    setMethodType('mtn_momo')
    setAccountName('')
    setAccountNum('')
    setBankName('')
    setFormError('')
  }

  const addMethod = useMutation({
    mutationFn: async () => {
      if (!accountName.trim()) throw new Error('Enter your account name')
      if (!accountNum.trim())  throw new Error('Enter your phone/account number')
      if (methodType === 'bank_transfer' && !bankName.trim()) throw new Error('Enter your bank name')
      const { error } = await supabase.from('shop_payment_methods').insert({
        shop_id:        shop!.id,
        method_type:    methodType,
        account_name:   accountName.trim(),
        account_number: accountNum.trim(),
        bank_name:      methodType === 'bank_transfer' ? bankName.trim() : null,
        is_active:      true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      setShowForm(false)
      resetForm()
    },
    onError: (err: any) => setFormError(err.message ?? 'Failed to save.'),
  })

  const toggleMethod = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await supabase.from('shop_payment_methods').update({ is_active }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })

  const deleteMethod = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('shop_payment_methods').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-methods'] }),
  })

  function confirmDelete(id: string) {
    Alert.alert('Remove Method', 'Delete this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMethod.mutate(id) },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack('/(dashboard)/')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={() => { resetForm(); setShowForm(true) }}>
          <Text style={s.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {!shop ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🏪</Text>
          <Text style={s.emptyTitle}>Shop not set up</Text>
          <Text style={s.emptySub}>Set up your shop in Shop Settings before adding payment methods.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: insets.bottom + 30 }}>

          {/* How it works */}
          <View style={s.howCard}>
            <Text style={s.howTitle}>How payments work</Text>
            {HOW_IT_WORKS.map((step, i) => (
              <View key={i} style={s.howRow}>
                <View style={s.howNumber}><Text style={s.howNumText}>{i + 1}</Text></View>
                <Text style={s.howStep}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Methods list */}
          {isLoading ? (
            <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 20 }} />
          ) : methods.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyCardText}>No payment methods yet. Tap "+ Add" to add your first method.</Text>
            </View>
          ) : (
            methods.map(m => {
              const def = METHODS.find(x => x.type === m.method_type)
              return (
                <View key={m.id} style={s.methodCard}>
                  <View style={s.methodLeft}>
                    <Text style={s.methodIcon}>{def?.icon ?? '💳'}</Text>
                    <View style={s.methodInfo}>
                      <Text style={s.methodLabel}>{def?.label ?? m.method_type}</Text>
                      <Text style={s.methodSub}>{m.account_name} · {m.account_number}</Text>
                      {m.bank_name ? <Text style={s.methodBank}>{m.bank_name}</Text> : null}
                    </View>
                  </View>
                  <View style={s.methodActions}>
                    {/* Active/Inactive toggle */}
                    <TouchableOpacity
                      style={[s.toggleBtn, m.is_active && s.toggleBtnActive]}
                      onPress={() => toggleMethod.mutate({ id: m.id, is_active: !m.is_active })}
                      disabled={toggleMethod.isPending}
                    >
                      <Text style={[s.toggleText, m.is_active && s.toggleTextActive]}>
                        {m.is_active ? 'Active' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                    {/* Delete */}
                    <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(m.id)}>
                      <Text style={s.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      )}

      {/* Add method modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.modal, { paddingTop: insets.top }]}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }}>
                <Text style={s.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => addMethod.mutate()} disabled={addMethod.isPending}>
                {addMethod.isPending
                  ? <ActivityIndicator color={COLORS.goldLight} />
                  : <Text style={s.modalSave}>Save</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              {/* Method type selector */}
              <View>
                <Text style={s.sectionLabel}>PAYMENT TYPE</Text>
                <View style={s.typeGrid}>
                  {METHODS.map(m => (
                    <TouchableOpacity
                      key={m.type}
                      style={[s.typeCard, methodType === m.type && s.typeCardSelected]}
                      onPress={() => setMethodType(m.type)}
                    >
                      <Text style={s.typeIcon}>{m.icon}</Text>
                      <Text style={[s.typeLabel, methodType === m.type && { color: COLORS.goldLight }]}>
                        {m.label}
                      </Text>
                      <Text style={s.typeHint}>{m.hint}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fields */}
              <View style={s.formCard}>
                <View style={s.formField}>
                  <Text style={s.formLabel}>Account / Name</Text>
                  <TextInput
                    style={s.formInput}
                    value={accountName}
                    onChangeText={t => { setAccountName(t); setFormError('') }}
                    placeholder="e.g. Amara Beauty Store"
                    placeholderTextColor={COLORS.faint}
                  />
                </View>
                <View style={s.formDivider} />
                <View style={s.formField}>
                  <Text style={s.formLabel}>
                    {methodType === 'bank_transfer' ? 'Account Number' : 'Phone Number'}
                  </Text>
                  <TextInput
                    style={s.formInput}
                    value={accountNum}
                    onChangeText={t => { setAccountNum(t); setFormError('') }}
                    placeholder={methodType === 'bank_transfer' ? '0123456789' : '+234 812 345 6789'}
                    placeholderTextColor={COLORS.faint}
                    keyboardType="phone-pad"
                  />
                </View>
                {methodType === 'bank_transfer' && (
                  <>
                    <View style={s.formDivider} />
                    <View style={s.formField}>
                      <Text style={s.formLabel}>Bank Name</Text>
                      <TextInput
                        style={s.formInput}
                        value={bankName}
                        onChangeText={t => { setBankName(t); setFormError('') }}
                        placeholder="e.g. First Bank Nigeria"
                        placeholderTextColor={COLORS.faint}
                      />
                    </View>
                  </>
                )}
              </View>

              {formError ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{formError}</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: COLORS.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:           { color: COLORS.faint, fontSize: 22, width: 32 },
  headerTitle:    { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },
  addBtn:         { fontSize: 14, color: COLORS.goldLight, fontWeight: '600' },

  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyEmoji:     { fontSize: 48 },
  emptyTitle:     { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  emptySub:       { fontSize: 12, color: COLORS.dim, textAlign: 'center', lineHeight: 18 },
  emptyCard:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyCardText:  { fontSize: 13, color: COLORS.faint, textAlign: 'center', lineHeight: 18 },

  howCard:        { backgroundColor: 'rgba(200,133,26,0.08)', borderWidth: 1, borderColor: 'rgba(200,133,26,0.2)', borderRadius: 14, padding: 14, gap: 10 },
  howTitle:       { fontSize: 12, fontWeight: '700', color: COLORS.goldLight, marginBottom: 2 },
  howRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  howNumber:      { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(200,133,26,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  howNumText:     { fontSize: 10, fontWeight: '700', color: COLORS.goldLight },
  howStep:        { fontSize: 12, color: COLORS.dim, flex: 1, lineHeight: 17 },

  methodCard:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIcon:     { fontSize: 28 },
  methodInfo:     { flex: 1, gap: 2 },
  methodLabel:    { fontSize: 14, fontWeight: '600', color: COLORS.white },
  methodSub:      { fontSize: 12, color: COLORS.dim },
  methodBank:     { fontSize: 11, color: COLORS.faint },
  methodActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn:      { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  toggleBtnActive:{ borderColor: 'rgba(52,211,153,0.4)', backgroundColor: 'rgba(52,211,153,0.1)' },
  toggleText:     { fontSize: 11, fontWeight: '600', color: COLORS.faint },
  toggleTextActive:{ color: '#7be3b1' },
  deleteBtn:      { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(244,163,163,0.3)', alignItems: 'center', justifyContent: 'center' },
  deleteText:     { fontSize: 12, color: '#f4a3a3' },

  modal:          { flex: 1, backgroundColor: COLORS.bg },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalCancel:    { fontSize: 14, color: COLORS.faint },
  modalTitle:     { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  modalSave:      { fontSize: 14, fontWeight: '700', color: COLORS.goldLight },

  sectionLabel:   { fontSize: 10, letterSpacing: 1.4, color: COLORS.faint, fontWeight: '700', marginBottom: 10 },
  typeGrid:       { flexDirection: 'row', gap: 10 },
  typeCard:       { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  typeCardSelected:{ borderColor: COLORS.gold, backgroundColor: 'rgba(200,133,26,0.1)' },
  typeIcon:       { fontSize: 24 },
  typeLabel:      { fontSize: 12, fontWeight: '600', color: COLORS.white, textAlign: 'center' },
  typeHint:       { fontSize: 9, color: COLORS.faint, textAlign: 'center' },

  formCard:       { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  formField:      { padding: 14, gap: 6 },
  formLabel:      { fontSize: 11, color: COLORS.faint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  formInput:      { fontSize: 14, color: COLORS.white, paddingVertical: 4 },
  formDivider:    { height: 1, backgroundColor: COLORS.border },
  errorBox:       { backgroundColor: 'rgba(244,163,163,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(244,163,163,0.3)' },
  errorText:      { fontSize: 13, color: '#f4a3a3' },
})
