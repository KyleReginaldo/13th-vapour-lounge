"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GuestCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  slug: string;
  variantAttributes?: Record<string, string>;
}

interface GuestCartStore {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateQuantity: (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ) => void;
  removeItem: (productId: string, variantId: string | undefined) => void;
  clearItems: () => void;
}

export const useGuestCart = create<GuestCartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === newItem.productId &&
              i.variantId === newItem.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId &&
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        })),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      clearItems: () => set({ items: [] }),
    }),
    { name: "vapour-guest-cart" }
  )
);
