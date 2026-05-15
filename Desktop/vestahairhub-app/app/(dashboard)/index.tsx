import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

const STATUS_LABEL: Record<string, string> = {
  pending_payment:   'Awaiting Payment',
  payment_submitted: 'Payment Submitted',
  payment_confirmed: 'Confirmed',
  processing:        'Processing',
  shipped:           'Shipped',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment:   COLORS.faint,
  payment_submitted: '#60a5fa',
  payment_confirmed: COLORS.goldLight,
  processing:        COLORS.goldLight,
  shipped:           '#60a5fa',
  delivered:         '#7be3b1',
  cancelled:         '#f4a3a3',
}

const MENU = [
  { icon: '📦', label: 'Products',          sub: 'Manage your listings',    route: '/(dashboard)/products', iconBg: 'rgba(59,130,246,0.18)' },
  { icon: '🧾', label: 'Orders',            sub: 'View & fulfil orders',     route: '/(dashboard)/orders',   iconBg: 'rgba(200,133,26,0.18)' },
  { icon: '💳', label: 'Payment Methods',   sub: 'MoMo, OPay, bank details', route: '/(dashboard)/payments', iconBg: 'rgba(52,211,153,0.18)' },
  { icon: '⚙️', label: 'Shop Settings',    sub: 'Profile, currency & more', route: '/(dashboard)/settings', iconBg: 'rgba(167,139,250,0.18)' },
  { icon: '🛡️', label: 'KYC Verification', sub: 'Verify your identity',     route: '/(dashboard)/kyc',      iconBg: 'rgba(96,165,250,0.18)' },
]

function formatPrice(amount: number, currency?: string | null) {
  const sym = currency === 'NGN' ? '₦' : currency === 'GHS' ? 'GH₵' : currency === 'KES' ? 'KSh' : currency === 'ZAR' ? 'R' : '$'
  return `${sym}${amount.toLocaleString()}`
}

const STAT_CARDS = (stats: any, currency: string | null | undefined) => [
  {
    label:   'Total Sales',
    value:   stats ? formatPrice(stats.totalSales, currency) : '–',
    icon:    '$',
    iconBg:  '#7c4a0d',
    iconFg:  '#E5A84B',
    small:   true,
  },
  {
    label:   'Total Products',
    value:   stats != null ? String(stats.products) : '–',
    icon:    '📦',
    iconBg:  '#0d2a4a',
    iconFg:  '#60a5fa',
    small:   false,
  },
  {
    label:   'Total Orders',
    value:   stats != null ? String(stats.orders) : '–',
    icon:    '🛒',
    iconBg:  '#0d1a3a',
    iconFg:  '#93c5fd',
    small:   false,
  },
  {
    label:   'Pending Review',
    value:   stats != null ? String(stats.pending) : '–',
    icon:    '⏰',
    iconBg:  '#5c2a00',
    iconFg:  '#E5A84B',
    small:   false,
  },
  {
    label:   'Active Products',
    value:   stats != null ? String(stats.activeProducts) : '–',
    icon:    '✓',
    iconBg:  '#063a27',
    iconFg:  '#7be3b1',
    small:   false,
  },
]

export default function DashboardHomeScreen() {
  const insets            = useSafeAreaInsets()
  const { user, profile } = useAuth()

  const { data: shop, isLoading: shopLoading } = useQuery<any>({
    queryKey:            ['seller-shop', user?.id],
    enabled:             !!user,
    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn:  async () => {
      const { data } = await supabase
        .from('shops').select('*').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: stats } = useQuery<any>({
    queryKey: ['dashboard-stats', shop?.id],
    enabled:  !!shop?.id,
    queryFn:  async () => {
      const [
        { count: products },
        { count: activeProducts },
        { count: orders },
        { data: recentOrders },
        { data: salesRows },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('status', 'active'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id),
        supabase.from('orders').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount').eq('shop_id', shop.id).neq('status', 'cancelled'),
      ])
      const totalSales    = (salesRows ?? []).reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0)
      const pending       = (recentOrders ?? []).filter((o: any) => o.status === 'payment_submitted').length
      return { products: products ?? 0, activeProducts: activeProducts ?? 0, orders: orders ?? 0, recentOrders: recentOrders ?? [], totalSales, pending }
    },
  })

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack('/(tabs)/account')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={s.headerTitle}>Dashboard</Text>
          {shop?.name ? (
            <Text style={s.headerSub}>Managing: {shop.name}</Text>
          ) : null}
        </View>
        <View style={[s.kycPill, {
          backgroundColor: shop?.kyc_status === 'approved' ? 'rgba(52,211,153,0.12)' : 'rgba(200,133,26,0.12)',
        }]}>
          <Text style={[s.kycPillText, {
            color: shop?.kyc_status === 'approved' ? '#7be3b1' : COLORS.goldLight,
          }]}>
            {shop?.kyc_status === 'approved' ? '✓ Verified' : '⏳ KYC Pending'}
          </Text>
        </View>
      </View>

      {shopLoading && !shop ? (
        <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>

          {/* Stat cards — horizontally scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 16, gap: 10 }}
          >
            {STAT_CARDS(stats, shop?.currency).map((card) => (
              <View key={card.label} style={s.statCard}>
                <View style={[s.statIconBox, { backgroundColor: card.iconBg }]}>
                  <Text style={[s.statIconText, { color: card.iconFg }]}>{card.icon}</Text>
                </View>
                <Text style={[s.statValue, card.small && { fontSize: 18 }]}>{card.value}</Text>
                <Text style={s.statLabel}>{card.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Recent Orders */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(dashboard)/orders' as never)}>
                <Text style={s.sectionLink}>View all →</Text>
              </TouchableOpacity>
            </View>

            {!stats || stats.recentOrders.length === 0 ? (
              <View style={s.emptyOrders}>
                <Text style={s.emptyOrdersText}>
                  No orders yet. Share your shop link to start receiving orders.
                </Text>
              </View>
            ) : (
              stats.recentOrders.map((order: any) => (
                <View key={order.id} style={s.orderRow}>
                  <View style={s.orderLeft}>
                    <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={s.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={s.orderRight}>
                    <Text style={s.orderAmt}>{formatPrice(order.total_amount, shop?.currency)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLOR[order.status] ?? COLORS.faint}20` }]}>
                      <Text style={[s.statusText, { color: STATUS_COLOR[order.status] ?? COLORS.faint }]}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Menu */}
          <View style={s.menu}>
            <Text style={s.menuHeading}>MANAGE YOUR SHOP</Text>
            {MENU.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[s.menuRow, i < MENU.length - 1 && s.menuRowBorder]}
                onPress={() => router.push(item.route as never)}
              >
                <View style={[s.menuIconBox, { backgroundColor: item.iconBg }]}>
                  <Text style={s.menuIconEmoji}>{item.icon}</Text>
                </View>
                <View style={s.menuText}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuSub}>{item.sub}</Text>
                </View>
                <Text style={s.menuChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Shop URL hint */}
          {shop?.slug ? (
            <View style={s.urlCard}>
              <Text style={s.urlLabel}>Your shop link</Text>
              <Text style={s.urlValue}>vestahairhub.com/shop/{shop.slug}</Text>
            </View>
          ) : null}

        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: COLORS.bg },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:           { color: COLORS.faint, fontSize: 22, width: 32 },
  headerTitle:    { fontFamily: FONT.serif, fontSize: 22, color: COLORS.white },
  headerSub:      { fontSize: 11, color: COLORS.faint, marginTop: 2 },
  kycPill:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  kycPillText:    { fontSize: 10, fontWeight: '700' },

  statCard:       { width: 130, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 14, gap: 8 },
  statIconBox:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statIconText:   { fontSize: 18, fontWeight: '700' },
  statValue:      { fontSize: 26, fontWeight: '700', color: COLORS.white },
  statLabel:      { fontSize: 11, color: COLORS.faint, lineHeight: 14 },

  section:        { marginHorizontal: 14, marginBottom: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: 'hidden' },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.white },
  sectionLink:    { fontSize: 12, color: COLORS.goldLight },

  emptyOrders:    { paddingHorizontal: 20, paddingVertical: 28, alignItems: 'center' },
  emptyOrdersText:{ fontSize: 13, color: COLORS.faint, textAlign: 'center', lineHeight: 19 },

  orderRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  orderLeft:      { gap: 3 },
  orderRight:     { alignItems: 'flex-end', gap: 5 },
  orderId:        { fontSize: 13, fontWeight: '600', color: COLORS.white },
  orderDate:      { fontSize: 10, color: COLORS.faint },
  orderAmt:       { fontSize: 14, fontWeight: '700', color: COLORS.goldLight },
  statusBadge:    { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  statusText:     { fontSize: 10, fontWeight: '700' },

  menu:           { marginHorizontal: 14, marginBottom: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: 'hidden' },
  menuHeading:    { fontSize: 10, letterSpacing: 1.4, color: COLORS.faint, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  menuRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuRowBorder:  { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  menuIconBox:    { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuIconEmoji:  { fontSize: 20 },
  menuText:       { flex: 1 },
  menuLabel:      { fontSize: 14, fontWeight: '600', color: COLORS.white },
  menuSub:        { fontSize: 12, color: COLORS.faint, marginTop: 2 },
  menuChevron:    { fontSize: 22, color: COLORS.faint },

  urlCard:        { marginHorizontal: 14, marginBottom: 14, backgroundColor: 'rgba(200,133,26,0.08)', borderWidth: 1, borderColor: 'rgba(200,133,26,0.2)', borderRadius: 14, padding: 14 },
  urlLabel:       { fontSize: 10, color: COLORS.faint, letterSpacing: 0.8, marginBottom: 4 },
  urlValue:       { fontSize: 12, color: COLORS.goldLight, fontFamily: 'monospace' },
})
