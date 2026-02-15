"use client";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { QuantityInput } from "@/components/product/QuantityInput";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Separator } from "@/components/ui/separator";
import type { Json } from "@/database.types";
import { useState } from "react";

interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  compare_at_price?: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  attributes: Json;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  stock_quantity: number | null;
  has_variants: boolean | null;
}

interface ProductDetailClientProps {
  product: Product;
  variants: ProductVariant[];
}

export function ProductDetailClient({
  product,
  variants,
}: ProductDetailClientProps) {
  const hasVariants = product.has_variants && variants.length > 0;

  // State management
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    hasVariants && variants.length > 0 ? variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);

  // Get selected variant or use product data
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId)
    : null;

  const currentPrice = selectedVariant
    ? (selectedVariant.price ?? product.base_price)
    : product.base_price;
  const currentStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;

  const isInStock = currentStock !== null && currentStock > 0;
  const maxQuantity = isInStock ? Math.min(currentStock, 99) : 0;

  return (
    <div className="space-y-6">
      {/* Variant Selector */}
      {hasVariants && variants.length > 0 && (
        <>
          <VariantSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onVariantChange={setSelectedVariantId}
            disabled={!isInStock}
          />
          <Separator />
        </>
      )}

      {/* Quantity Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Quantity</label>
        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={maxQuantity}
          disabled={!isInStock}
        />
      </div>

      {/* Add to Cart Button */}
      <AddToCartButton
        productId={product.id}
        variantId={selectedVariantId}
        quantity={quantity}
        disabled={!isInStock}
        className="w-full"
      />

      {/* Out of Stock Message */}
      {!isInStock && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="font-medium text-destructive">Currently Out of Stock</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon or contact us for availability
          </p>
        </div>
      )}
    </div>
  );
}
