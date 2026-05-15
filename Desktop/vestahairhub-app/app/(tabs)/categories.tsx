import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { COLORS, FONT } from '@/lib/theme'
import { TopBar } from '@/components/ui/TopBar'
import { Pill } from '@/components/ui/Pill'

const CATEGORIES = [
  { name: 'Hair',          slug: 'hair',          emoji: '💇', from: '#5C2E12', to: '#1E0B00' },
  { name: 'Nails',         slug: 'nails',         emoji: '💅', from: '#7c1e54', to: '#1E0B00' },
  { name: 'Hair Products', slug: 'hair-products', emoji: '🧴', from: '#0c4a4d', to: '#1E0B00' },
  { name: 'Eyelashes',     slug: 'eyelashes',     emoji: '👁️', from: '#4c2c7d', to: '#1E0B00' },
]

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets()

  const { data: stats } = useQuery<{ countMap: Record<string, number>; total: number }>({
    queryKey: ['category-stats'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('id, slug').in('slug', ['hair', 'nails', 'hair-products', 'eyelashes']),
        supabase.from('products').select('category_id').eq('status', 'active'),
      ])
      const countMap: Record<string, number> = {}
      for (const cat of cats ?? []) {
        countMap[cat.slug] = (prods ?? []).filter((p: any) => p.category_id === cat.id).length
      }
      return { countMap, total: (prods ?? []).length }
    },
  })

  const totalLabel = stats ? `Browse ${stats.total.toLocaleString()} items` : 'Browse items'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <TopBar big title="Discover" sub={totalLabel} right={
        <TouchableOpacity style={s.iconBtn}><Text style={s.iconText}>🔍</Text></TouchableOpacity>
      } />

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 20 }]}>
        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
          <Pill tone="gold">All</Pill>
          <Pill tone="gray">New</Pill>
          <Pill tone="gray">Verified</Pill>
          <Pill tone="gray">Free ship</Pill>
        </ScrollView>

        {/* Category grid */}
        <View style={s.grid}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.slug} style={[s.card, { backgroundColor: c.from }]}
              onPress={() => router.push(`/search?category=${c.slug}`)}>
              <Text style={s.count}>{stats ? `${(stats.countMap[c.slug] ?? 0).toLocaleString()} products` : '…'}</Text>
              <Text style={s.emoji}>{c.emoji}</Text>
              <Text style={s.name}>{c.name}</Text>
              <Text style={s.shopNow}>Shop now →</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 14 },
  pills:  { gap: 6, paddingBottom: 14 },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card:   { width: '48%', aspectRatio: 0.85, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'space-between' },
  count:  { fontSize: 9, color: COLORS.faint, alignSelf: 'flex-end' },
  emoji:  { fontSize: 38 },
  name:   { fontFamily: FONT.serif, fontSize: 18, fontWeight: '700', color: COLORS.white },
  shopNow:{ fontSize: 10, color: COLORS.dim, marginTop: 2 },
  iconBtn:{ width: 34, height: 34, backgroundColor: COLORS.surface, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconText:{ fontSize: 16 },
})
