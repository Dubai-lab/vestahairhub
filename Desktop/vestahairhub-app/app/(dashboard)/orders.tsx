import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { sendNotification } from '@/lib/notify'
import { COLORS, FONT } from '@/lib/theme'
import { goBack } from '@/lib/navigation'

type OrderStatus = 'pending_payment' | 'payment_submitted' | 'payment_confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

const STATUS_LABEL: Record<string, string> = {
  pending_payment:   'Awaiting Payment',
  payment_submitted: 'Payment Submitted',
  payment_confirmed: 'Payment Confirmed',
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

const NEXT_STATUS: Partial<Record<string, string>> = {
  payment_submitted: 'payment_confirmed',
  payment_confirmed: 'processing',
  processing:        'shipped',
  shipped:           'delivered',
}

const NEXT_LABEL: Partial<Record<string, string>> = {
  payment_submitted: 'Confirm Payment',
  payment_confirmed: 'Mark Processing',
  processing:        'Mark Shipped',
  shipped:           'Mark Delivered',
}

function formatPrice(amount: number, currency?: string | null) {
  const sym = currency === 'NGN' ? '₦' : currency === 'GHS' ? 'GH₵' : currency === 'KES' ? 'KSh' : currency === 'ZAR' ? 'R' : '$'
  return `${sym}${amount.toLocaleString()}`
}

export default function DashboardOrdersScreen() {
  const insets   = useSafeAreaInsets()
  const { user } = useAuth()
  const qc       = useQueryClient()

  const { data: shop } = useQuery<any>({
    queryKey:            ['seller-shop', user?.id],
    enabled:             !!user,
    staleTime:           5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn:  async () => {
      const { data } = await supabase.from('shops').select('id, currency').eq('seller_id', user!.id).maybeSingle()
      return data
    },
  })

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['seller-orders', shop?.id],
    enabled:  !!shop?.id,
    queryFn:  async () => {
      const { data } = await supabase
        .from('orders').select('*').eq('shop_id', shop!.id).order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const advance = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('orders').update({ status }).eq('id', id)
    },
    onSuccess: (_data, variables) => {
      const order = orders.find(o => o.id === variables.id)
      if (order?.buyer_id) {
        sendNotification({
          type:       'order_status_changed',
          order_id:   variables.id,
          new_status: variables.status,
          buyer_id:   order.buyer_id,
        }).catch(() => {})
      }
      qc.invalidateQueries({ queryKey: ['seller-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id)
    },
    onSuccess: (_data, id) => {
      const order = orders.find(o => o.id === id)
      if (order?.buyer_id) {
        sendNotification({
          type:       'order_status_changed',
          order_id:   id,
          new_status: 'cancelled',
          buyer_id:   order.buyer_id,
        }).catch(() => {})
      }
      qc.invalidateQueries({ queryKey: ['seller-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  function confirmCancel(id: string) {
    Alert.alert('Cancel Order', 'Are you sure? This will notify the buyer.', [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel Order', style: 'destructive', onPress: () => cancel.mutate(id) },
    ])
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => goBack('/(dashboard)/')}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Orders</Text>
        <Text style={s.headerSub}>{orders.length} total</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.goldLight} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🧾</Text>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySub}>Orders will appear here when buyers purchase your products.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: insets.bottom + 30 }}>
          {orders.map((order) => {
            const st      = order.status as string
            const nextSt  = NEXT_STATUS[st]
            const nextLbl = NEXT_LABEL[st]
            const isDone  = st === 'delivered' || st === 'cancelled'
            return (
              <View key={order.id} style={s.card}>
                {/* Order header */}
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={s.orderDate}>{new Date(order.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={s.rightCol}>
                    <Text style={s.orderAmt}>{formatPrice(order.total_amount, shop?.currency)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLOR[st] ?? COLORS.faint}20` }]}>
                      <Text style={[s.statusText, { color: STATUS_COLOR[st] ?? COLORS.faint }]}>
                        {STATUS_LABEL[st] ?? st}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Shipping */}
                {order.shipping_name && (
                  <Text style={s.info}>
                    📦 {order.shipping_name} · {order.shipping_phone}
                    {order.shipping_city ? ` · ${order.shipping_city}` : ''}
                    {order.shipping_country ? `, ${order.shipping_country}` : ''}
                  </Text>
                )}

                {/* Payment reference */}
                {order.payment_reference && (
                  <View style={s.refBox}>
                    <Text style={s.refLabel}>Payment ref:</Text>
                    <Text style={s.refValue}>{order.payment_reference}</Text>
                  </View>
                )}

                {/* Actions */}
                {!isDone && (
                  <View style={s.actions}>
                    {nextSt && nextLbl && (
                      <TouchableOpacity
                        style={s.advanceBtn}
                        onPress={() => advance.mutate({ id: order.id, status: nextSt })}
                        disabled={advance.isPending}
                      >
                        <Text style={s.advanceBtnText}>{nextLbl}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={s.cancelBtn}
                      onPress={() => confirmCancel(order.id)}
                      disabled={cancel.isPending}
                    >
                      <Text style={s.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  back:         { color: COLORS.faint, fontSize: 22, width: 32 },
  headerTitle:  { fontFamily: FONT.serif, fontSize: 20, color: COLORS.white },
  headerSub:    { fontSize: 12, color: COLORS.faint },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyEmoji:   { fontSize: 48 },
  emptyTitle:   { fontFamily: FONT.serif, fontSize: 18, color: COLORS.white },
  emptySub:     { fontSize: 12, color: COLORS.dim, textAlign: 'center' },

  card:         { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, gap: 10 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rightCol:     { alignItems: 'flex-end', gap: 5 },
  orderId:      { fontSize: 13, fontWeight: '700', color: COLORS.white },
  orderDate:    { fontSize: 10, color: COLORS.faint, marginTop: 2 },
  orderAmt:     { fontSize: 15, fontWeight: '700', color: COLORS.goldLight },
  statusBadge:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: 10, fontWeight: '700' },
  info:         { fontSize: 12, color: COLORS.dim, lineHeight: 17 },
  refBox:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  refLabel:     { fontSize: 11, color: COLORS.faint },
  refValue:     { fontSize: 11, color: COLORS.goldLight, fontWeight: '600', flex: 1 },
  actions:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  advanceBtn:   { flex: 1, backgroundColor: COLORS.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  advanceBtnText:{ fontSize: 12, fontWeight: '700', color: COLORS.brandText },
  cancelBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f4a3a350', alignItems: 'center' },
  cancelBtnText:{ fontSize: 12, fontWeight: '600', color: '#f4a3a3' },
})
