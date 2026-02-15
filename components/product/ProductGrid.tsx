"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { ProductCardSkeleton } from "@/components/shared/SkeletonLoaders";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import {
  ProductCard,
  ProductCardCompact,
  type ProductCardData,
} from "./ProductCard";

interface ProductGridProps {
  products: ProductCardData[];
  isLoading?: boolean;
  columns?: {
    mobile?: 2 | 3;
    tablet?: 3 | 4;
    desktop?: 4 | 5 | 6;
  };
  variant?: "default" | "compact";
  priority?: boolean; // For above-the-fold images
  className?: string;
  emptyMessage?: string;
}

export const ProductGrid = ({
  products,
  isLoading = false,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  variant = "default",
  priority = false,
  className,
  emptyMessage = "No products found",
}: ProductGridProps) => {
  // Generate grid column classes based on breakpoints
  const gridCols = cn(
    // Mobile
    columns.mobile === 2 && "grid-cols-2",
    columns.mobile === 3 && "grid-cols-3",
    // Tablet
    columns.tablet === 3 && "sm:grid-cols-3",
    columns.tablet === 4 && "sm:grid-cols-4",
    // Desktop
    columns.desktop === 4 && "lg:grid-cols-4",
    columns.desktop === 5 && "lg:grid-cols-5",
    columns.desktop === 6 && "lg:grid-cols-6"
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid gap-4", gridCols, className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description={emptyMessage}
      />
    );
  }

  const CardComponent =
    variant === "compact" ? ProductCardCompact : ProductCard;

  return (
    <div className={cn("grid gap-4", gridCols, className)}>
      {products.map((product, index) => (
        <CardComponent
          key={product.id}
          product={product}
          priority={priority && index < 4} // Prioritize first 4 images
        />
      ))}
    </div>
  );
};
