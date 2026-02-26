"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/queries/cart";
import { useCartStore } from "@/lib/stores/cart-store";
import { useGuestCart } from "@/lib/stores/guest-cart-store";
import { formatCurrency } from "@/lib/utils";
import { Loader2, LogIn, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { CartItem } from "./CartItem";
import { GuestCartItem } from "./GuestCartItem";
import { OrderSummary } from "./OrderSummary";

export const CartDrawer = () => {
  const { isCartOpen, closeCart } = useCartStore();
  const { data: cart, isLoading, isError } = useCart();
  const guestItems = useGuestCart((s) => s.items);

  // cart === null → unauthenticated (guest mode)
  const isGuest = cart === null;

  const guestSubtotal = guestItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const guestItemCount = guestItems.reduce((sum, i) => sum + i.quantity, 0);

  const hasItems = isGuest
    ? guestItems.length > 0
    : !!(cart?.items && cart.items.length > 0);

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {hasItems && (
              <span className="text-sm font-normal text-gray-500">
                ({isGuest ? guestItemCount : cart?.summary?.itemCount}{" "}
                {(isGuest ? guestItemCount : cart?.summary?.itemCount) === 1
                  ? "item"
                  : "items"}
                )
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Loading State (only for authenticated users) */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Loading cart...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-600">Failed to load cart</p>
                <p className="text-xs text-gray-500 mt-1">
                  Please try again later
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && !hasItems && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                  Your cart is empty
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Start adding items to your cart
                </p>
                <Button asChild className="mt-6">
                  <Link href="/products" onClick={closeCart}>
                    Browse Products
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* ── Guest Cart ── */}
          {!isLoading && !isError && isGuest && hasItems && (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {guestItems.map((item) => (
                  <GuestCartItem
                    key={`${item.productId}-${item.variantId ?? "base"}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Guest Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(guestSubtotal)}</span>
                </div>

                {/* Sign in prompt */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-center space-y-2">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Sign in to complete your purchase. Your cart will be saved.
                  </p>
                  <Button asChild size="sm" className="w-full gap-2">
                    <Link href="/sign-in" onClick={closeCart}>
                      <LogIn className="h-4 w-4" />
                      Sign in to Checkout
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── Authenticated Cart ── */}
          {!isLoading && !isError && !isGuest && hasItems && (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {cart.items.map((item: any) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Footer with Summary and Checkout */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <OrderSummary summary={cart.summary} />

                <div className="flex flex-col gap-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checkout" onClick={closeCart}>
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <Link href="/cart" onClick={closeCart}>
                      View Full Cart
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
