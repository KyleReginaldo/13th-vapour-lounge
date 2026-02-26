"use client";

import { useMergeGuestCart } from "@/lib/queries/cart";
import { useGuestCart } from "@/lib/stores/guest-cart-store";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef } from "react";

/**
 * Merges guest cart items into the DB cart on sign-in.
 * Cart query invalidation is now handled inside useCart itself.
 */
export function GuestCartMerger() {
  const mergeGuestCart = useMergeGuestCart();
  const clearItems = useGuestCart((s) => s.clearItems);
  const hasMergedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session && !hasMergedRef.current) {
        hasMergedRef.current = true;

        const items = useGuestCart.getState().items;
        if (items.length === 0) return;

        mergeGuestCart
          .mutateAsync(
            items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
            }))
          )
          .then(() => {
            clearItems();
          })
          .catch(() => {
            hasMergedRef.current = false;
          });
      }

      if (event === "SIGNED_OUT") {
        hasMergedRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
