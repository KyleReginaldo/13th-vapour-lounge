"use client";

import { Separator } from "@/components/ui/separator";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/lib/utils";
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
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Order Summary</h2>

      {/* Cart Items */}
      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const imageUrl =
            item.product.product_images[0]?.url || "/placeholder-product.png";
          const price = item.variant?.price || item.product.base_price;

          return (
            <div key={item.id} className="flex gap-4">
              {/* Image */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-muted">
                <Image
                  src={imageUrl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {item.product.name}
                </p>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">
                    {Object.entries(
                      (item.variant.attributes as Record<string, string>) || {}
                    )
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                </p>
              </div>

              {/* Price */}
              <div className="text-sm font-medium">
                {formatCurrency(price * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      <Separator className="my-6" />

      {/* Price Breakdown */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (12%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
