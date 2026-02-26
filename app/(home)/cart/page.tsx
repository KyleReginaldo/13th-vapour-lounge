"use client";

import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCart, useClearCart } from "@/lib/queries/cart";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const clearCart = useClearCart();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const hasItems = cart?.items && cart.items.length > 0;

  const handleClearCart = async () => {
    await clearCart.mutateAsync();
    setShowClearDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Continue Shopping</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-base font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">
            My Cart
            {hasItems && (
              <span className="ml-1.5 text-xs font-normal text-gray-400">
                ({cart?.summary.itemCount})
              </span>
            )}
          </h1>
          {hasItems && (
            <button
              onClick={() => setShowClearDialog(true)}
              disabled={clearCart.isPending}
              className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-40 md:pb-10">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="text-sm text-gray-400">Loading your cart...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-2">
            <p className="text-red-500 font-medium">Failed to load cart</p>
            <p className="text-sm text-gray-400">
              Please try refreshing the page
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !hasItems && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-gray-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your cart is empty
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Add some products to get started.
              </p>
            </div>
            <Button
              asChild
              className="mt-2 bg-orange-500 hover:bg-orange-600 rounded-xl px-8"
            >
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        )}

        {/* Cart Content */}
        {!isLoading && !isError && hasItems && (
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {/* Stock Warning Banner */}
              {(() => {
                const outOfStockItems = cart.items.filter((item: any) => {
                  const stock = item.product_variants
                    ? item.product_variants.stock_quantity
                    : item.products.stock_quantity;
                  return stock !== null && stock === 0;
                });
                const insufficientStockItems = cart.items.filter(
                  (item: any) => {
                    const stock = item.product_variants
                      ? item.product_variants.stock_quantity
                      : item.products.stock_quantity;
                    return stock !== null && stock > 0 && stock < item.quantity;
                  }
                );
                if (
                  outOfStockItems.length === 0 &&
                  insufficientStockItems.length === 0
                )
                  return null;
                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
                    <span className="text-amber-500 text-base leading-none mt-0.5">
                      ⚠
                    </span>
                    <div className="text-xs text-amber-800 space-y-1">
                      {outOfStockItems.length > 0 && (
                        <p>
                          <span className="font-semibold">Out of stock:</span>{" "}
                          {outOfStockItems
                            .map((i: any) => i.products.name)
                            .join(", ")}{" "}
                          — remove before checkout.
                        </p>
                      )}
                      {insufficientStockItems.length > 0 && (
                        <p>
                          <span className="font-semibold">Limited stock:</span>{" "}
                          {insufficientStockItems
                            .map((i: any) => {
                              const stock = i.product_variants
                                ? i.product_variants.stock_quantity
                                : i.products.stock_quantity;
                              return `${i.products.name} (only ${stock} left)`;
                            })
                            .join(", ")}{" "}
                          — update quantities.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Items list */}
              <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                {cart.items.map((item: any) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Order Summary — desktop only (mobile has sticky bar) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-28">
                <h2 className="text-base font-semibold mb-4 text-gray-900">
                  Order Summary
                </h2>
                <OrderSummary summary={cart.summary} className="mb-5" />
                <Button
                  asChild
                  size="lg"
                  className="w-full mb-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Checkout Bar ───────────── */}
      {hasItems && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm text-gray-500">
              {cart?.summary.itemCount}{" "}
              {cart?.summary.itemCount === 1 ? "item" : "items"}
            </span>
            <div className="text-right">
              <span className="text-xs text-gray-400 mr-1">Total</span>
              <span className="text-base font-bold text-gray-900">
                ₱
                {cart?.summary.total.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl h-12 text-sm font-semibold"
          >
            <Link href="/checkout">Proceed to Checkout →</Link>
          </Button>
        </div>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
