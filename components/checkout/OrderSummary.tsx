"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

type Cart = Database["public"]["Tables"]["carts"]["Row"] & {
  product: Database["public"]["Tables"]["products"]["Row"] & {
    product_images: Database["public"]["Tables"]["product_images"]["Row"][];
  };
  variant?: Database["public"]["Tables"]["product_variants"]["Row"] | null;
};

interface OrderSummaryProps {
  items: Cart[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount?: number;
}

export function OrderSummary({
  items,
  subtotal,
  tax,
  shippingCost,
  discount = 0,
}: OrderSummaryProps) {
  const total = subtotal + tax + shippingCost - discount;

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Order Summary
            </h2>
          </div>
          <span className="text-sm text-gray-600">
            {items.map((item) => item.quantity).reduce((a, b) => a + b, 0)}{" "}
            {items.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Cart Items */}
        <div className="space-y-4 max-h-100 overflow-y-auto mb-6">
          {items.map((item) => {
            const imageUrl = item.product.product_images[0]?.url || "/logo.jpg";
            const price = item.variant?.price || item.product.base_price;

            return (
              <div key={item.id} className="flex gap-3">
                {/* Image */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  <Image
                    src={imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                    {item.product.name}{" "}
                    <span className="text-gray-500">({item.quantity})</span>
                  </p>
                  {item.variant && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Object.entries(
                        (item.variant.attributes as Record<string, string>) ||
                          {}
                      )
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(", ")}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 mt-1.5">
                    {formatCurrency(price * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="mb-4" />

        {/* Price Breakdown */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-900">
              {shippingCost === 0 ? (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 hover:bg-green-100 h-5"
                >
                  FREE
                </Badge>
              ) : (
                formatCurrency(shippingCost)
              )}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Discount</span>
              <span className="font-semibold text-green-600">
                -{formatCurrency(discount)}
              </span>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
