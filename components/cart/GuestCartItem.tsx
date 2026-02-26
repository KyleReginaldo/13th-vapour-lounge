"use client";

import { Button } from "@/components/ui/button";
import {
  type GuestCartItem as GuestCartItemType,
  useGuestCart,
} from "@/lib/stores/guest-cart-store";
import { cn, formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GuestCartItemProps {
  item: GuestCartItemType;
  className?: string;
}

export const GuestCartItem = ({ item, className }: GuestCartItemProps) => {
  const { updateQuantity, removeItem } = useGuestCart();

  const subtotal = item.price * item.quantity;
  const imageUrl = item.image || "/logo.jpg";

  return (
    <div
      className={cn(
        "relative flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      {/* Product Image */}
      <Link
        href={`/products/${item.slug}`}
        className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700"
      >
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.slug}`}
          className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
        >
          {item.name}
        </Link>

        {/* Variant Info */}
        {item.variantAttributes && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {Object.entries(item.variantAttributes).map(([key, value]) => (
              <span key={key} className="mr-2">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(subtotal)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatCurrency(item.price)} each
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.variantId,
                  Math.max(1, item.quantity - 1)
                )
              }
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() =>
                updateQuantity(
                  item.productId,
                  item.variantId,
                  item.quantity + 1
                )
              }
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            onClick={() => removeItem(item.productId, item.variantId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
