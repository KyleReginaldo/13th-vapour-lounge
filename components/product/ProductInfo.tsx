"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Package, Shield, Truck } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";
import { RatingStars } from "./RatingStars";

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    sku: string;
    base_price: number;
    compare_at_price?: number | null;
    stock_quantity?: number | null;
    average_rating?: number | null;
    total_reviews?: number | null;
    description?: string | null;
    product_type?: string | null;
    is_featured?: boolean | null;
    brand?: {
      name: string;
    } | null;
    category?: {
      name: string;
    } | null;
  };
  selectedVariantPrice?: number;
  className?: string;
}

export const ProductInfo = ({
  product,
  selectedVariantPrice,
  className,
}: ProductInfoProps) => {
  const displayPrice = selectedVariantPrice || product.base_price;
  const isInStock =
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    product.stock_quantity > 0;
  const isLowStock =
    product.stock_quantity !== null &&
    product.stock_quantity !== undefined &&
    product.stock_quantity > 0 &&
    product.stock_quantity < 10;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        {/* Brand & Category */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {product.brand && <span>{product.brand.name}</span>}
          {product.brand && product.category && <span>•</span>}
          {product.category && <span>{product.category.name}</span>}
        </div>

        {/* Product Name */}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {product.name}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {product.is_featured && <Badge variant="secondary">Featured</Badge>}
          {product.product_type && (
            <Badge variant="outline">{product.product_type}</Badge>
          )}
        </div>
      </div>

      {/* Rating */}
      {product.average_rating !== null &&
        product.average_rating !== undefined &&
        product.average_rating > 0 && (
          <div className="flex items-center gap-4">
            <RatingStars
              rating={product.average_rating || 0}
              totalReviews={product.total_reviews}
              size="md"
            />
            {product.total_reviews && product.total_reviews > 0 && (
              <a
                href="#reviews"
                className="text-sm text-muted-foreground hover:underline"
              >
                See all reviews
              </a>
            )}
          </div>
        )}

      {/* Price */}
      <div className="space-y-2">
        <PriceDisplay
          basePrice={displayPrice}
          compareAtPrice={product.compare_at_price}
          className="text-2xl"
        />

        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {isInStock ? (
            <>
              <Package className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                In Stock
              </span>
              {isLowStock && (
                <Badge variant="secondary" className="text-orange-600">
                  Only {product.stock_quantity} left
                </Badge>
              )}
            </>
          ) : (
            <>
              <Package className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Out of Stock
              </span>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      <Separator />

      {/* Features */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Why Buy From Us</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Age Verified</p>
              <p className="text-sm text-muted-foreground">
                18+ verification required
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Fast Shipping</p>
              <p className="text-sm text-muted-foreground">2-5 business days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
