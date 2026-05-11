import { supabase } from './supabase'

type WelcomePayload            = { type: 'welcome'; user_name: string; role: string; email_to: string }
type OrderPlacedPayload        = { type: 'order_placed'; order_id: string; shop_id: string; total_amount: number; buyer_name: string }
type OrderStatusPayload        = { type: 'order_status_changed'; order_id: string; new_status: string; buyer_id: string; buyer_name: string }
type MessageReceivedPayload    = { type: 'message_received'; seller_id: string; sender_name: string; preview: string; conversation_id: string }

type NotifyPayload =
  | WelcomePayload
  | OrderPlacedPayload
  | OrderStatusPayload
  | MessageReceivedPayload

const EDGE_URL  = `${import.meta.env.VITE_SUPABASE_URL as string}/functions/v1/notify`
const ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export async function sendNotification(payload: NotifyPayload, overrideToken?: string): Promise<void> {
  try {
    let token = overrideToken
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession()
      token = session?.access_token
    }
    if (!token) return

    await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Notifications are non-critical — fail silently
  }
}
