"use client";

import { useRemoveFromCart, useUpdateCartItem } from "@/lib/queries/cart";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    products: {
      id: string;
      name: string;
      slug: string;
      base_price: number;
      product_images: Array<{ url: string; is_primary: boolean }>;
    };
    product_variants?: {
      id: string;
      price: number;
      attributes: any;
    } | null;
  };
  className?: string;
}

export const CartItem = ({ item, className }: CartItemProps) => {
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const [isRemoving, setIsRemoving] = useState(false);

  const product = item.products;
  const variant = item.product_variants;
  const price = variant?.price || product.base_price;
  const subtotal = price * item.quantity;

  // Get primary image or first image
  const primaryImage = product.product_images?.find((img) => img.is_primary);
  const imageUrl =
    primaryImage?.url || product.product_images?.[0]?.url || "/logo.jpg";

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItem.mutate({ cartItemId: item.id, quantity: newQuantity });
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    await removeFromCart.mutateAsync(item.id);
    setIsRemoving(false);
  };

  return (
    <div
      className={cn(
        "relative flex gap-3 p-4 transition-opacity",
        isRemoving && "opacity-40 pointer-events-none",
        className
      )}
    >
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top row: name + remove */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="font-medium text-sm text-gray-900 hover:text-orange-500 line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Remove item"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Variant tags */}
        {variant?.attributes && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(variant.attributes as Record<string, string>).map(
              ([key, value]) => (
                <span
                  key={key}
                  className="inline-block text-[11px] bg-gray-100 text-gray-500 rounded-md px-1.5 py-0.5"
                >
                  {key}: {value}
                </span>
              )
            )}
          </div>
        )}

        {/* Bottom row: qty controls + subtotal */}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateCartItem.isPending}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-9 text-center text-sm font-semibold text-gray-900">
              {updateCartItem.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updateCartItem.isPending}
              className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <div className="text-xs text-gray-400">
              {formatCurrency(price)} each
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatCurrency(subtotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
