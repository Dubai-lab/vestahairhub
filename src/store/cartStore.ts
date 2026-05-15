import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cartItemPrice } from '@/types'
import type { CartItem, Product } from '@/types'

function makeKey(productId: string, color: string | null, sizeName: string | null): string {
  return `${productId}::${color ?? ''}::${sizeName ?? ''}`
}

interface CartState {
  items:       CartItem[]
  addItem:     (product: Product, quantity?: number, selectedColor?: string | null, selectedSize?: { name: string; price_add: number } | null) => void
  removeItem:  (key: string) => void
  updateQty:   (key: string, quantity: number) => void
  clearCart:   () => void
  totalItems:  () => number
  totalPrice:  () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1, selectedColor = null, selectedSize = null) => {
        const key = makeKey(product.id, selectedColor, selectedSize?.name ?? null)
        set((state) => {
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
              ),
            }
          }
          return {
            items: [...state.items, { key, product, quantity, shopId: product.shop_id, selectedColor, selectedSize }],
          }
        })
      },

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => i.key !== key),
        })),

      updateQty: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key)
          return
        }
        set((state) => ({
          items: state.items.map((i) => i.key === key ? { ...i, quantity } : i),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + cartItemPrice(i) * i.quantity, 0),
    }),
    {
      name:    'vestahairhub-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
