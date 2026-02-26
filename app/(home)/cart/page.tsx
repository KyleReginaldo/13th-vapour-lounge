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
import { ArrowLeft, Loader2, ShoppingBag, Trash2 } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/products"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Continue Shopping
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-md font-bold text-gray-900 dark:text-gray-100">
              Shopping Cart
            </h1>
            {hasItems && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                disabled={clearCart.isPending}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
              <p className="mt-4 text-gray-500">Loading your cart...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 font-medium">Failed to load cart</p>
              <p className="text-sm text-gray-500 mt-2">
                Please try refreshing the page
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !hasItems && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12">
            <div className="text-center max-w-md mx-auto">
              <ShoppingBag className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600" />
              <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Your cart is empty
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Looks like you haven&apos;t added any items to your cart yet.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Cart Content */}
        {!isLoading && !isError && hasItems && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Mismatch / Stock Warning Banner */}
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
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
                    <span className="text-amber-500 text-lg leading-none mt-0.5">
                      ⚠
                    </span>
                    <div className="text-sm text-amber-800 space-y-1">
                      {outOfStockItems.length > 0 && (
                        <p>
                          <span className="font-semibold">Out of stock:</span>{" "}
                          {outOfStockItems
                            .map((i: any) => i.products.name)
                            .join(", ")}{" "}
                          — please remove before checkout.
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
                          — update your quantities.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Cart Items ({cart.summary.itemCount})
                </h2>
                <div className="space-y-4">
                  {cart.items.map((item: any) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Order Summary
                </h2>
                <OrderSummary summary={cart.summary} className="mb-6" />

                <Button asChild size="lg" className="w-full mb-3">
                  <Link href="/checkout">Proceed to Checkout</Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/products">Continue Shopping</Link>
                </Button>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      🔒 Secure Checkout
                    </span>
                    <span className="flex items-center gap-1">
                      ✓ Safe Payment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
