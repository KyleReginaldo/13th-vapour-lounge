"use client";

import { Button } from "@/components/ui/button";
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
        "relative flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700",
        isRemoving && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700"
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.slug}`}
          className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Variant Info */}
        {variant?.attributes && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {Object.entries(variant.attributes as Record<string, string>).map(
              ([key, value]) => (
                <span key={key} className="mr-2">
                  {key}: {value}
                </span>
              )
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(price)}
        </div>

        {/* Quantity Controls */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || updateCartItem.isPending}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-12 text-center text-sm font-medium">
              {updateCartItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin inline" />
              ) : (
                item.quantity
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updateCartItem.isPending}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {isRemoving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(subtotal)}
        </div>
      </div>
    </div>
  );
};
