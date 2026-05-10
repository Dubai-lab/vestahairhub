export type {
  ProfileRow       as Profile,
  ShopRow          as Shop,
  CategoryRow      as Category,
  ProductRow       as Product,
  OrderRow         as Order,
  OrderItemRow     as OrderItem,
  ShopPaymentRow   as ShopPayment,
  ReviewRow        as Review,
  ConversationRow  as Conversation,
  MessageRow       as Message,
} from './database'

export type UserRole = 'buyer' | 'seller' | 'admin'

export type OrderStatus =
  | 'pending_payment'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentMethodType = 'mtn_momo' | 'opay' | 'bank_transfer'

import type { ProductRow } from './database'

export interface CartItem {
  product:  ProductRow
  quantity: number
  shopId:   string
}
