"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Package, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PriceDisplay } from "./PriceDisplay";
import { RatingStars } from "./RatingStars";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  compare_at_price?: number | null;
  stock_quantity?: number | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  is_featured?: boolean | null;
  primary_image?: string | null;
  created_at?: string | null;
}

interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}

export const ProductCard = ({
  product,
  priority = false,
  className,
}: ProductCardProps) => {
  // Calculate discount percentage
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.base_price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.base_price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  // Check stock status
  const stockQty = product.stock_quantity ?? 0;
  const isLowStock = stockQty < 10 && stockQty > 0;
  const isOutOfStock = stockQty <= 0;

  // Check if new (created within last 30 days)
  const isNew = product.created_at
    ? new Date(product.created_at) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : false;

  // Fallback image
  const imageUrl = product.primary_image || "/images/placeholder-product.jpg";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("block h-full", className)}
    >
      <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />

          {/* Top Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="shadow-sm">
                -{discountPercentage}%
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-green-500 shadow-sm hover:bg-green-600">
                New
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="flex items-center gap-1 bg-purple-500 shadow-sm hover:bg-purple-600">
                <TrendingUp className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>

          {/* Stock Badge (Bottom Right) */}
          {isLowStock && (
            <Badge
              variant="secondary"
              className="absolute bottom-2 right-2 bg-orange-500 text-white shadow-sm hover:bg-orange-600"
            >
              <Package className="mr-1 h-3 w-3" />
              Only {product.stock_quantity} left
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive" className="text-base">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4">
          {/* Product Name */}
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-tight">
            {product.name}
          </h3>

          {/* Rating */}
          {product.average_rating && product.average_rating > 0 && (
            <RatingStars
              rating={product.average_rating}
              totalReviews={product.total_reviews}
              size="sm"
            />
          )}

          {/* Price */}
          <PriceDisplay
            basePrice={product.base_price}
            compareAtPrice={product.compare_at_price}
            className="mt-auto"
          />
        </div>
      </Card>
    </Link>
  );
};

// Compact variant for "Related Products", "You May Also Like", etc.
export const ProductCardCompact = ({
  product,
  className,
}: ProductCardProps) => {
  const imageUrl = product.primary_image || "/images/placeholder-product.jpg";

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("block h-full", className)}
    >
      <Card className="group relative h-full overflow-hidden transition-all duration-200 hover:shadow-md">
        {/* Image Container - Smaller */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 40vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Discount Badge Only */}
          {product.compare_at_price &&
            product.compare_at_price > product.base_price && (
              <Badge
                variant="destructive"
                className="absolute left-2 top-2 text-xs"
              >
                -
                {Math.round(
                  ((product.compare_at_price - product.base_price) /
                    product.compare_at_price) *
                    100
                )}
                %
              </Badge>
            )}
        </div>

        {/* Content - Condensed */}
        <div className="flex flex-col gap-1.5 p-3">
          <h4 className="line-clamp-2 text-xs font-medium leading-tight">
            {product.name}
          </h4>

          <PriceDisplay
            basePrice={product.base_price}
            compareAtPrice={product.compare_at_price}
            className="text-sm"
          />
        </div>
      </Card>
    </Link>
  );
};
