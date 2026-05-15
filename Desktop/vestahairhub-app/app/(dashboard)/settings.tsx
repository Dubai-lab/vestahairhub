import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

const AFRICAN_CURRENCIES = [
  { code: 'USD', symbol: '$',    name: 'US Dollar (Universal)' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'ETB', symbol: 'Br',  name: 'Ethiopian Birr' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'XAF', symbol: 'CFA', name: 'Central African CFA Franc' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'TND', symbol: 'DT',  name: 'Tunisian Dinar' },
  { code: 'ZMW', symbol: 'ZK',  name: 'Zambian Kwacha' },
]

const AFRICAN_COUNTRIES = [
  'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon',
  'Cape Verde','Central African Republic','Chad','Comoros','DR Congo',
  'Republic of Congo','Djibouti','Egypt','Equatorial Guinea','Eritrea',
  'Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau',
  'Ivory Coast','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi',
  'Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger',
  'Nigeria','Rwanda','Senegal','Seychelles','Sierra Leone','Somalia',
  'South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia',
  'Uganda','Zambia','Zimbabwe',
]

const THEME_COLORS = [
  '#C8851A','#7C3AED','#DC2626','#059669','#2563EB','#DB2777',
  '#D97706','#0891B2','#65A30D','#4F46E5','#EA580C','#0F766E',
]

export default function DashboardSettingsScreen() {
  const insets              = useSafeAreaInsets()
  const { user, profile, signOut } = useAuth()
  const qc                  = useQueryClient()

  const [name,          setName]         = useState('')
  const [slug,          setSlug]         = useState('')
  const [description,   setDescription]  = useState('')
  const [country,       setCountry]      = useState('')
  const [city,          setCity]         = useState('')
  const [currency,      setCurrency]     = useState('USD')
  const [whatsapp,      setWhatsapp]     = useState('')
  const [themeColor,    setThemeColor]   = useState('#C8851A')
  const [isDirty,       setIsDirty]      = useState(false)

  const [countryModal,  setCountryModal]  = useState(false)
  const [currencyModal, setCurrencyModal] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [currSearch,    setCurrSearch]    = useState('')

  const { data: shop, isLoading } = useQuery<any>({
    queryKey:            ['seller-shop', user?.id],
    enabled:             !!user,
    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  useEffect(() => {
    if (shop) {
      setName(shop.name ?? '')
      setSlug(shop.slug ?? '')
      setDescription(shop.description ?? '')
      setCountry(shop.country ?? '')
      setCity(shop.city ?? '')
      setCurrency(shop.currency ?? 'USD')
      setWhatsapp(shop.whatsapp_number ?? '')
      setThemeColor(shop.theme_color ?? '#C8851A')
      setIsDirty(false)
    }
  }, [shop])

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: description.trim(),
        country,
        city: city.trim(),
        currency,
        whatsapp_number: whatsapp.trim(),
        theme_color: themeColor,
      }
      if (shop) {
        const { error } = await supabase.from('shops').update(payload).eq('id', shop.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('shops').insert({
          seller_id: user!.id,
          status: 'active',
          ...payload,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      setIsDirty(false)
      qc.invalidateQueries({ queryKey: ['seller-shop'] })
      Alert.alert('Saved', 'Your shop settings have been updated.')
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? 'Failed to save settings.')
    },
  })

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: () => { signOut(); router.replace('/(tabs)' as never) },
      },
    ])
  }

  function field(v: string, setter: (s: string) => void) {
    return (s: string) => { setter(s); setIsDirty(true) }
  }

  const filteredCountries = AFRICAN_COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase()))
  const filteredCurrencies = AFRICAN_CURRENCIES.filter(c =>
    c.name.toLowerCase().includes(currSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(currSearch.toLowerCase()))

  const selectedCurrency = AFRICAN_CURRENCIES.find(c => c.code === currency)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack('/(dashboard)/')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Shop Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading && !shop ? (
        <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 60 }}>

            {/* KYC status banner */}
            {shop && shop.kyc_status !== 'approved' && (
              <View style={s.kycBanner}>
                <Text style={s.kycBannerText}>
                  ⏳ KYC pending — complete verification on the web dashboard to activate your shop.
                </Text>
              </View>
            )}
            {shop?.kyc_status === 'approved' && (
              <View style={[s.kycBanner, { backgroundColor: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.25)' }]}>
                <Text style={[s.kycBannerText, { color: '#7be3b1' }]}>✓ Shop verified</Text>
              </View>
            )}

            {/* Shop profile section */}
            <Text style={s.sectionLabel}>SHOP PROFILE</Text>
            <View style={s.card}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>Shop Name</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={field(name, setName)}
                  placeholder="e.g. Amara's Hair Collection"
                  placeholderTextColor={COLORS.faint}
                />
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fieldLabel}>URL Slug</Text>
                <TextInput
                  style={s.input}
                  value={slug}
                  onChangeText={(s) => { setSlug(s.toLowerCase().replace(/[^a-z0-9-]/g, '-')); setIsDirty(true) }}
                  placeholder="e.g. amaras-hair"
                  placeholderTextColor={COLORS.faint}
                  autoCapitalize="none"
                />
                {slug ? (
                  <Text style={s.slugHint}>vestahairhub.com/shop/{slug}</Text>
                ) : null}
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fieldLabel}>Description</Text>
                <TextInput
                  style={[s.input, s.textarea]}
                  value={description}
                  onChangeText={field(description, setDescription)}
                  placeholder="Describe your shop and products…"
                  placeholderTextColor={COLORS.faint}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Location & currency */}
            <Text style={s.sectionLabel}>LOCATION & CURRENCY</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.field} onPress={() => setCountryModal(true)}>
                <Text style={s.fieldLabel}>Country</Text>
                <View style={s.pickerRow}>
                  <Text style={[s.pickerValue, !country && { color: COLORS.faint }]}>
                    {country || 'Select country…'}
                  </Text>
                  <Text style={s.chevron}>›</Text>
                </View>
              </TouchableOpacity>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fieldLabel}>City</Text>
                <TextInput
                  style={s.input}
                  value={city}
                  onChangeText={field(city, setCity)}
                  placeholder="e.g. Lagos"
                  placeholderTextColor={COLORS.faint}
                />
              </View>
              <View style={s.divider} />
              <TouchableOpacity style={s.field} onPress={() => setCurrencyModal(true)}>
                <Text style={s.fieldLabel}>Currency</Text>
                <View style={s.pickerRow}>
                  <Text style={s.pickerValue}>
                    {selectedCurrency ? `${selectedCurrency.symbol} — ${selectedCurrency.name}` : currency}
                  </Text>
                  <Text style={s.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Contact */}
            <Text style={s.sectionLabel}>CONTACT</Text>
            <View style={s.card}>
              <View style={s.field}>
                <Text style={s.fieldLabel}>WhatsApp Number</Text>
                <TextInput
                  style={s.input}
                  value={whatsapp}
                  onChangeText={field(whatsapp, setWhatsapp)}
                  placeholder="e.g. 2348012345678"
                  placeholderTextColor={COLORS.faint}
                  keyboardType="phone-pad"
                />
                <Text style={s.hint}>Include country code without the + sign</Text>
              </View>
            </View>

            {/* Theme */}
            <Text style={s.sectionLabel}>THEME COLOUR</Text>
            <View style={s.card}>
              <Text style={s.fieldLabel}>Brand Colour</Text>
              <View style={s.colorRow}>
                {THEME_COLORS.map(hex => (
                  <TouchableOpacity
                    key={hex}
                    style={[s.colorSwatch, { backgroundColor: hex },
                      themeColor === hex && s.colorSwatchSelected,
                    ]}
                    onPress={() => { setThemeColor(hex); setIsDirty(true) }}
                  />
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <View style={[s.colorPreview, { backgroundColor: themeColor }]} />
                <Text style={s.hint}>Selected: {themeColor}</Text>
              </View>
            </View>

            {/* Account info */}
            <Text style={s.sectionLabel}>ACCOUNT</Text>
            <View style={s.card}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Name</Text>
                <Text style={s.infoValue}>{profile?.full_name ?? '–'}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{user?.email ?? '–'}</Text>
              </View>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[s.saveBtn, !isDirty && s.saveBtnDisabled]}
              onPress={() => { if (isDirty) save.mutate() }}
              disabled={!isDirty || save.isPending}
            >
              {save.isPending
                ? <ActivityIndicator color={COLORS.brandText} />
                : <Text style={s.saveBtnText}>{shop ? 'Save Changes' : 'Create Shop'}</Text>
              }
            </TouchableOpacity>

            {/* Sign out */}
            <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
              <Text style={s.signOutText}>Sign out</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Country picker modal */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setCountryModal(false)}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              value={countrySearch}
              onChangeText={setCountrySearch}
              placeholder="Search countries…"
              placeholderTextColor={COLORS.faint}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.modalRow, country === item && s.modalRowSelected]}
                onPress={() => { setCountry(item); setIsDirty(true); setCountryModal(false); setCountrySearch('') }}
              >
                <Text style={[s.modalRowText, country === item && { color: COLORS.goldLight }]}>{item}</Text>
                {country === item && <Text style={{ color: COLORS.goldLight }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Currency picker modal */}
      <Modal visible={currencyModal} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Select Currency</Text>
            <TouchableOpacity onPress={() => setCurrencyModal(false)}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              value={currSearch}
              onChangeText={setCurrSearch}
              placeholder="Search currencies…"
              placeholderTextColor={COLORS.faint}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.modalRow, currency === item.code && s.modalRowSelected]}
                onPress={() => { setCurrency(item.code); setIsDirty(true); setCurrencyModal(false); setCurrSearch('') }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.modalRowText, currency === item.code && { color: COLORS.goldLight }]}>
                    {item.symbol}  {item.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.faint }}>{item.code}</Text>
                </View>
                {currency === item.code && <Text style={{ color: COLORS.goldLight }}>✓</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.bg },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:               { color: COLORS.faint, fontSize: 22, width: 32 },
  headerTitle:        { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },

  kycBanner:          { backgroundColor: 'rgba(200,133,26,0.1)', borderWidth: 1, borderColor: 'rgba(200,133,26,0.25)', borderRadius: 12, padding: 12 },
  kycBannerText:      { fontSize: 12, color: COLORS.goldLight, lineHeight: 17 },

  sectionLabel:       { fontSize: 10, letterSpacing: 1.4, color: COLORS.faint, fontWeight: '700', paddingHorizontal: 2 },
  card:               { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, overflow: 'hidden' },
  divider:            { height: 1, backgroundColor: COLORS.border },
  field:              { padding: 14, gap: 6 },
  fieldLabel:         { fontSize: 11, color: COLORS.faint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  input:              { fontSize: 14, color: COLORS.white, paddingVertical: 4 },
  textarea:           { minHeight: 72, textAlignVertical: 'top' },
  slugHint:           { fontSize: 10, color: COLORS.goldLight, marginTop: 2 },
  hint:               { fontSize: 10, color: COLORS.faint, lineHeight: 14 },

  pickerRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerValue:        { fontSize: 14, color: COLORS.white, flex: 1 },
  chevron:            { fontSize: 20, color: COLORS.faint },

  colorRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  colorSwatch:        { width: 36, height: 36, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  colorSwatchSelected:{ borderColor: COLORS.white, transform: [{ scale: 1.15 }] },
  colorPreview:       { width: 24, height: 24, borderRadius: 6 },

  infoRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  infoLabel:          { fontSize: 13, color: COLORS.dim },
  infoValue:          { fontSize: 13, color: COLORS.white, fontWeight: '500' },

  saveBtn:            { backgroundColor: COLORS.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled:    { opacity: 0.4 },
  saveBtnText:        { fontSize: 14, fontWeight: '700', color: COLORS.brandText },
  signOutBtn:         { padding: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, alignItems: 'center' },
  signOutText:        { fontSize: 13, color: '#f4a3a3', fontWeight: '600' },

  modal:              { flex: 1, backgroundColor: COLORS.bg },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:         { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  modalClose:         { fontSize: 14, color: COLORS.goldLight, fontWeight: '600' },
  searchBox:          { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput:        { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  modalRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalRowSelected:   { backgroundColor: `${COLORS.gold}15` },
  modalRowText:       { fontSize: 14, color: COLORS.white },
})
