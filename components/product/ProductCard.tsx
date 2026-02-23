"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function formatPrice(price: number) {
  return price.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

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
  const imageUrl = product.primary_image || "/logo.jpg";
  const rating = product.average_rating ?? 0;
  const reviewCount = product.total_reviews ?? 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("block h-full group", className)}
    >
      <Card className="relative h-full flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 p-0 gap-0">
        {/* Image Container */}
        <div
          className="relative w-full overflow-hidden bg-gray-50 rounded-t-2xl"
          style={{ aspectRatio: "1 / 1" }}
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 16vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.08]"
            priority={priority}
            quality={85}
          />

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/10 to-transparent pointer-events-none" />

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute left-2 top-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-sm">
              -{discountPercentage}%
            </div>
          )}

          {/* New / Featured badge */}
          {!hasDiscount && (isNew || product.is_featured) && (
            <div
              className={cn(
                "absolute right-2 top-2 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold shadow-sm text-white",
                isNew ? "bg-blue-500" : "bg-orange-500"
              )}
            >
              {isNew ? "New" : "Featured"}
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-t-2xl">
              <Badge
                variant="destructive"
                className="text-xs font-bold shadow-lg"
              >
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 p-3 sm:p-3.5 flex-1">
          {isLowStock && (
            <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">
              Only {stockQty} left
            </span>
          )}

          <h3 className="line-clamp-2 text-xs sm:text-[13px] leading-snug font-medium text-gray-800 flex-1 min-h-8 sm:min-h-9">
            {product.name}
          </h3>

          {/* Star Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-2.5 w-2.5",
                    i < Math.round(rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  )}
                />
              ))}
              {reviewCount > 0 && (
                <span className="text-[10px] text-gray-500 ml-0.5">
                  (
                  {reviewCount >= 1000
                    ? `${Math.floor(reviewCount / 1000)}k`
                    : reviewCount}
                  )
                </span>
              )}
            </div>
          )}

          {/* Price Row */}
          <div className="flex items-end justify-between mt-auto pt-1 gap-1">
            <div className="flex flex-col leading-none">
              <span className="text-orange-600 font-bold text-sm sm:text-[15px]">
                ₱{formatPrice(product.base_price)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through mt-0.5">
                  ₱{formatPrice(product.compare_at_price!)}
                </span>
              )}
            </div>
            {!rating && reviewCount > 0 && (
              <span className="text-[10px] text-gray-500 whitespace-nowrap self-end">
                {reviewCount >= 1000
                  ? `${Math.floor(reviewCount / 1000)}k`
                  : reviewCount}
                + sold
              </span>
            )}
          </div>
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
  const imageUrl = product.primary_image || "/logo.jpg";

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

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("block h-full group", className)}
    >
      <Card className="relative h-full flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 p-0 gap-0">
        <div
          className="relative overflow-hidden bg-gray-50 rounded-t-xl"
          style={{ aspectRatio: "1 / 1" }}
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 40vw, 20vw"
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.08]"
            quality={80}
          />

          {hasDiscount && (
            <div className="absolute left-1.5 top-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
              -{discountPercentage}%
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-2 sm:p-2.5 flex-1">
          <h4 className="line-clamp-2 text-[11px] sm:text-xs leading-snug font-medium text-gray-800 flex-1 min-h-8">
            {product.name}
          </h4>
          <span className="text-orange-600 font-bold text-xs sm:text-sm">
            ₱{formatPrice(product.base_price)}
          </span>
        </div>
      </Card>
    </Link>
  );
};
