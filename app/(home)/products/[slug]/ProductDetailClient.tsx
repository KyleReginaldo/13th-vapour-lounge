"use client";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { QuantityInput } from "@/components/product/QuantityInput";
import { VariantSelector } from "@/components/product/VariantSelector";
import { Separator } from "@/components/ui/separator";
import type { Json } from "@/database.types";
import { AlertTriangle, ChevronDown } from "lucide-react";
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
  isLoggedIn?: boolean;
}

export function ProductDetailClient({
  product,
  variants,
  isLoggedIn = false,
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

      {/* Health Warning */}
      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[12px] text-amber-800 leading-snug font-medium">
          <strong>WARNING:</strong> This product contains nicotine. Nicotine is
          an addictive chemical.
        </p>
      </div>

      {/* Add to Cart Button */}
      {(product.stock_quantity ?? 0) >= 1 &&
        (product.stock_quantity ?? 0) >= quantity && (
          <AddToCartButton
            productId={product.id}
            variantId={selectedVariantId}
            quantity={quantity}
            disabled={!isInStock}
            className="w-full"
            isLoggedIn={isLoggedIn}
          />
        )}

      {/* Out of Stock Message */}
      {!isInStock && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center space-y-2">
          <p className="font-medium text-destructive">Currently Out of Stock</p>
          <p className="text-sm text-muted-foreground">
            Check back soon or browse similar items below.
          </p>
          <a
            href="#related-products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            View Similar Products <ChevronDown className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
