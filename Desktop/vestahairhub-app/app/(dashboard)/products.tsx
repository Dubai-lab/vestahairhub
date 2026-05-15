import {
  View, Text, FlatList, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native'
import { Image } from 'expo-image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

type SizeVariant = { name: string; price_add: number }
type Status = 'active' | 'draft' | 'out_of_stock'

const STATUS_COLORS: Record<Status, { bg: string; text: string; label: string }> = {
  active:       { bg: 'rgba(52,211,153,0.15)', text: '#7be3b1',  label: 'Active'        },
  draft:        { bg: COLORS.surface,           text: COLORS.faint, label: 'Draft'       },
  out_of_stock: { bg: 'rgba(239,68,68,0.15)',  text: '#f4a3a3',  label: 'Out of Stock'  },
}

const CURRENCIES = [
  { code: 'NGN', sym: '₦' }, { code: 'GHS', sym: 'GH₵' }, { code: 'KES', sym: 'KSh' },
  { code: 'ZAR', sym: 'R' }, { code: 'USD', sym: '$' },
]
function formatPrice(price: number, currency?: string | null) {
  const c = CURRENCIES.find(c => c.code === currency)
  return `${c?.sym ?? '$'}${price.toLocaleString()}`
}

type FormState = {
  name: string; description: string; price: string; compare_price: string
  stock: string; category_id: string; status: Status
  colorList: string[]; colorInput: string
  sizeList: SizeVariant[]; sizeName: string; sizePriceAdd: string
}

const BLANK: FormState = {
  name: '', description: '', price: '', compare_price: '', stock: '0',
  category_id: '', status: 'active', colorList: [], colorInput: '#8B4513',
  sizeList: [], sizeName: '', sizePriceAdd: '',
}

export default function DashboardProductsScreen() {
  const insets   = useSafeAreaInsets()
  const { user } = useAuth()
  const qc       = useQueryClient()

  const [showForm,  setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<FormState>(BLANK)
  const [saving,    setSaving]    = useState(false)

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }))

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

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn:  async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name')
      return data ?? []
    },
  })

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-products', shop?.id],
    enabled:  !!shop?.id,
    queryFn:  async () => {
      const { data } = await supabase.from('products').select('*').eq('shop_id', shop!.id).order('created_at', { ascending: false })
      return data ?? []
    },
  })

  function openNew() {
    setEditingId(null)
    setForm(BLANK)
    setShowForm(true)
  }

  function openEdit(p: any) {
    setEditingId(p.id)
    setForm({
      name:          p.name ?? '',
      description:   p.description ?? '',
      price:         String(p.price ?? ''),
      compare_price: p.compare_price != null ? String(p.compare_price) : '',
      stock:         String(p.stock ?? 0),
      category_id:   p.category_id ?? '',
      status:        (p.status ?? 'active') as Status,
      colorList:     Array.isArray(p.colors) ? p.colors : [],
      colorInput:    '#8B4513',
      sizeList:      Array.isArray(p.sizes) ? p.sizes : [],
      sizeName:      '',
      sizePriceAdd:  '',
    })
    setShowForm(true)
  }

  function addColor() {
    if (!form.colorList.includes(form.colorInput)) {
      set({ colorList: [...form.colorList, form.colorInput] })
    }
  }

  function removeColor(hex: string) {
    set({ colorList: form.colorList.filter(c => c !== hex) })
  }

  function addSize() {
    const name     = form.sizeName.trim()
    const priceAdd = parseFloat(form.sizePriceAdd)
    if (!name || isNaN(priceAdd) || priceAdd < 0) return
    if (form.sizeList.some(s => s.name === name)) return
    set({ sizeList: [...form.sizeList, { name, price_add: priceAdd }], sizeName: '', sizePriceAdd: '' })
  }

  function removeSize(name: string) {
    set({ sizeList: form.sizeList.filter(s => s.name !== name) })
  }

  async function save() {
    if (!form.name.trim() || !form.price || !shop) return
    setSaving(true)
    try {
      const payload = {
        name:          form.name.trim(),
        description:   form.description.trim() || null,
        price:         parseFloat(form.price),
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        stock:         parseInt(form.stock) || 0,
        category_id:   form.category_id || null,
        status:        form.status,
        colors:        form.colorList,
        sizes:         form.sizeList,
      }
      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId)
      } else {
        const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        await supabase.from('products').insert({ ...payload, shop_id: shop.id, slug, images: [] })
      }
      qc.invalidateQueries({ queryKey: ['my-products'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => { await supabase.from('products').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-products'] }),
  })

  function confirmDelete(id: string, name: string) {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct.mutate(id) },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack('/(dashboard)/')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Products</Text>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 40 }} />
      ) : products.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📦</Text>
          <Text style={s.emptyTitle}>No products yet</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
            <Text style={s.emptyBtnText}>Add your first product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const st = STATUS_COLORS[(item.status ?? 'draft') as Status] ?? STATUS_COLORS.draft
            const img = Array.isArray(item.images) ? item.images[0] : null
            const colors: string[] = Array.isArray(item.colors) ? item.colors : []
            const sizes: SizeVariant[] = Array.isArray(item.sizes) ? item.sizes : []
            return (
              <View style={s.row}>
                {img
                  ? <Image source={{ uri: img }} style={s.thumb} contentFit="cover" />
                  : <View style={[s.thumb, s.thumbBg]}><Text style={{ fontSize: 22 }}>📦</Text></View>
                }
                <View style={s.rowInfo}>
                  <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={s.rowPrice}>{formatPrice(item.price, shop?.currency)} · Stock: {item.stock}</Text>
                  <View style={s.rowMeta}>
                    {colors.length > 0 && (
                      <View style={s.dotsRow}>
                        {colors.map((hex, i) => (
                          <View key={i} style={[s.dot, { backgroundColor: hex }]} />
                        ))}
                      </View>
                    )}
                    {sizes.length > 0 && (
                      <Text style={s.sizesText}>{sizes.length} size{sizes.length !== 1 ? 's' : ''}</Text>
                    )}
                    <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusPillText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>
                <View style={s.rowActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={s.editBtn}>
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)} style={s.delBtn}>
                    <Text style={s.delBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}

      {/* ── Product form modal ── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View style={[m.root, { paddingTop: insets.top }]}>
          <View style={m.header}>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Text style={m.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={m.title}>{editingId ? 'Edit Product' : 'New Product'}</Text>
            <TouchableOpacity onPress={save} disabled={saving}>
              <Text style={[m.save, saving && { opacity: 0.5 }]}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={m.body} keyboardShouldPersistTaps="handled">

            {/* Basic info */}
            <Text style={m.sectionLabel}>PRODUCT INFO</Text>
            <View style={m.card}>
              <Text style={m.label}>Product Name *</Text>
              <TextInput style={m.input} value={form.name} onChangeText={v => set({ name: v })} placeholder="e.g. Brazilian Wave Bundle" placeholderTextColor={COLORS.faint} />
              <View style={m.divider} />
              <Text style={m.label}>Description</Text>
              <TextInput style={[m.input, m.textarea]} value={form.description} onChangeText={v => set({ description: v })} placeholder="Describe your product…" placeholderTextColor={COLORS.faint} multiline numberOfLines={3} />
            </View>

            {/* Pricing */}
            <Text style={m.sectionLabel}>PRICING & STOCK</Text>
            <View style={m.card}>
              <View style={m.row3}>
                <View style={m.col}>
                  <Text style={m.label}>Base Price *</Text>
                  <TextInput style={m.input} value={form.price} onChangeText={v => set({ price: v })} placeholder="0.00" placeholderTextColor={COLORS.faint} keyboardType="decimal-pad" />
                </View>
                <View style={m.col}>
                  <Text style={m.label}>Old Price</Text>
                  <TextInput style={m.input} value={form.compare_price} onChangeText={v => set({ compare_price: v })} placeholder="0.00" placeholderTextColor={COLORS.faint} keyboardType="decimal-pad" />
                </View>
                <View style={m.col}>
                  <Text style={m.label}>Stock</Text>
                  <TextInput style={m.input} value={form.stock} onChangeText={v => set({ stock: v })} placeholder="0" placeholderTextColor={COLORS.faint} keyboardType="number-pad" />
                </View>
              </View>
            </View>

            {/* Category + Status */}
            <Text style={m.sectionLabel}>CATEGORY & STATUS</Text>
            <View style={m.card}>
              <Text style={m.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                  <TouchableOpacity
                    style={[m.chip, !form.category_id && m.chipActive]}
                    onPress={() => set({ category_id: '' })}
                  >
                    <Text style={[m.chipText, !form.category_id && m.chipTextActive]}>None</Text>
                  </TouchableOpacity>
                  {categories.map((c: any) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[m.chip, form.category_id === c.id && m.chipActive]}
                      onPress={() => set({ category_id: c.id })}
                    >
                      <Text style={[m.chipText, form.category_id === c.id && m.chipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={m.divider} />
              <Text style={m.label}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                {(['active', 'draft', 'out_of_stock'] as Status[]).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[m.chip, form.status === st && m.chipActive]}
                    onPress={() => set({ status: st })}
                  >
                    <Text style={[m.chipText, form.status === st && m.chipTextActive]}>
                      {STATUS_COLORS[st].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Colors */}
            <Text style={m.sectionLabel}>HAIR COLORS (optional)</Text>
            <View style={m.card}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {form.colorList.map(hex => (
                  <TouchableOpacity key={hex} onLongPress={() => removeColor(hex)} style={[m.swatch, { backgroundColor: hex }]}>
                    <View style={m.swatchX}><Text style={m.swatchXText}>×</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={m.hint}>Long-press a swatch to remove it.</Text>
              <View style={m.row2}>
                <View style={m.colFlex}>
                  <Text style={m.label}>Hex color (e.g. #8B4513)</Text>
                  <TextInput
                    style={m.input}
                    value={form.colorInput}
                    onChangeText={v => set({ colorInput: v })}
                    placeholder="#8B4513"
                    placeholderTextColor={COLORS.faint}
                    autoCapitalize="none"
                  />
                </View>
                <View style={[m.swatch, { backgroundColor: form.colorInput, marginTop: 22 }]} />
                <TouchableOpacity style={[m.addBtn, { marginTop: 22 }]} onPress={addColor}>
                  <Text style={m.addBtnTxt}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sizes */}
            <Text style={m.sectionLabel}>SIZE VARIANTS (optional)</Text>
            <View style={m.card}>
              {form.sizeList.map(sz => (
                <View key={sz.name} style={m.sizeRow}>
                  <Text style={m.sizeName}>{sz.name}</Text>
                  {sz.price_add > 0 && <Text style={m.sizePriceAdd}>+{sz.price_add}</Text>}
                  <TouchableOpacity onPress={() => removeSize(sz.name)} style={{ marginLeft: 'auto' }}>
                    <Text style={m.sizeX}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={m.row2}>
                <View style={m.colFlex}>
                  <Text style={m.label}>Size name</Text>
                  <TextInput style={m.input} value={form.sizeName} onChangeText={v => set({ sizeName: v })} placeholder="e.g. 16 inch" placeholderTextColor={COLORS.faint} />
                </View>
                <View style={m.colFixed}>
                  <Text style={m.label}>Extra price</Text>
                  <TextInput style={m.input} value={form.sizePriceAdd} onChangeText={v => set({ sizePriceAdd: v })} placeholder="0.00" placeholderTextColor={COLORS.faint} keyboardType="decimal-pad" />
                </View>
                <TouchableOpacity style={[m.addBtn, { marginTop: 22 }]} onPress={addSize}>
                  <Text style={m.addBtnTxt}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:          { color: COLORS.faint, fontSize: 22, width: 40 },
  headerTitle:   { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },
  addBtn:        { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:    { fontSize: 12, fontWeight: '700', color: COLORS.brandText },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 },
  emptyEmoji:    { fontSize: 48 },
  emptyTitle:    { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  emptyBtn:      { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText:  { fontSize: 13, fontWeight: '700', color: COLORS.brandText },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  thumb:         { width: 54, height: 54, borderRadius: 10, flexShrink: 0 },
  thumbBg:       { backgroundColor: COLORS.brown, alignItems: 'center', justifyContent: 'center' },
  rowInfo:       { flex: 1, gap: 3 },
  rowName:       { fontSize: 13, fontWeight: '600', color: COLORS.white },
  rowPrice:      { fontSize: 11, color: COLORS.goldLight },
  rowMeta:       { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dotsRow:       { flexDirection: 'row', gap: 3 },
  dot:           { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sizesText:     { fontSize: 9, color: COLORS.faint },
  statusPill:    { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusPillText:{ fontSize: 9, fontWeight: '700' },
  rowActions:    { gap: 6, alignItems: 'flex-end' },
  editBtn:       { borderWidth: 1, borderColor: COLORS.borderGold, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  editBtnText:   { fontSize: 11, color: COLORS.goldLight, fontWeight: '600' },
  delBtn:        { padding: 4 },
  delBtnText:    { fontSize: 14, color: COLORS.faint },
})

const m = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  cancel:       { fontSize: 14, color: COLORS.faint },
  title:        { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  save:         { fontSize: 14, fontWeight: '700', color: COLORS.goldLight },
  body:         { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.2, color: COLORS.faint, fontWeight: '700', marginTop: 8, marginBottom: 2 },
  card:         { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, gap: 10 },
  divider:      { height: 1, backgroundColor: COLORS.border },
  label:        { fontSize: 11, color: COLORS.faint, fontWeight: '600' },
  input:        { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.white, fontSize: 13, marginTop: 4 },
  textarea:     { minHeight: 70, textAlignVertical: 'top' },
  row3:         { flexDirection: 'row', gap: 8 },
  row2:         { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  col:          { flex: 1 },
  colFlex:      { flex: 1 },
  colFixed:     { width: 90 },
  chip:         { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chipActive:   { borderColor: COLORS.gold, backgroundColor: 'rgba(200,133,26,0.15)' },
  chipText:     { fontSize: 11, color: COLORS.dim },
  chipTextActive:{ color: COLORS.goldLight, fontWeight: '700' },
  hint:         { fontSize: 10, color: COLORS.faint, fontStyle: 'italic' },
  swatch:       { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', position: 'relative', alignItems: 'flex-end' },
  swatchX:      { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', margin: 2 },
  swatchXText:  { fontSize: 9, color: '#fff', lineHeight: 14 },
  addBtn:       { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt:    { fontSize: 12, fontWeight: '700', color: COLORS.brandText },
  sizeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sizeName:     { fontSize: 13, color: COLORS.white, fontWeight: '500' },
  sizePriceAdd: { fontSize: 12, color: COLORS.goldLight },
  sizeX:        { fontSize: 14, color: COLORS.faint },
})
