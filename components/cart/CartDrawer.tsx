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
import { Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { CartItem } from "./CartItem";
import { OrderSummary } from "./OrderSummary";

export const CartDrawer = () => {
  const { isCartOpen, closeCart } = useCartStore();
  const { data: cart, isLoading, isError } = useCart();

  const hasItems = cart?.items && cart.items.length > 0;

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Cart
            {cart?.summary?.itemCount ? (
              <span className="text-sm font-normal text-gray-500">
                ({cart.summary.itemCount}{" "}
                {cart.summary.itemCount === 1 ? "item" : "items"})
              </span>
            ) : null}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Loading State */}
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

          {/* Cart Items */}
          {!isLoading && !isError && hasItems && (
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
