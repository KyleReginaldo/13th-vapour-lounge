"use client";

import { getProductPrices } from "@/app/actions/cart";
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

export interface PriceChange {
  name: string;
  oldPrice: number;
  newPrice: number;
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

/**
 * Fetch current prices from the DB and update any stale guest-cart items.
 * Returns a list of items whose prices changed (empty = no changes).
 */
export async function refreshGuestCartPrices(): Promise<PriceChange[]> {
  const { items } = useGuestCart.getState();
  if (!items.length) return [];

  const result = await getProductPrices(
    items.map((i) => ({ productId: i.productId, variantId: i.variantId }))
  );

  if (!result?.success || !result.data) return [];

  const prices = result.data as {
    productId: string;
    variantId: string | null;
    currentPrice: number | null;
  }[];

  const changes: PriceChange[] = [];

  const updatedItems = items.map((item) => {
    const match = prices.find(
      (p) =>
        p.productId === item.productId &&
        (p.variantId ?? undefined) === (item.variantId ?? undefined)
    );

    if (
      match &&
      match.currentPrice !== null &&
      match.currentPrice !== item.price
    ) {
      changes.push({
        name: item.name,
        oldPrice: item.price,
        newPrice: match.currentPrice,
      });
      return { ...item, price: match.currentPrice };
    }
    return item;
  });

  if (changes.length > 0) {
    useGuestCart.setState({ items: updatedItems });
  }

  return changes;
}
