"use client";

import { Container } from "@/components/layout/Container";
import {
  FilterDrawer,
  FilterSidebar,
  type FilterOptions,
} from "@/components/product/FilterSidebar";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  SortDropdown,
  type SortOption,
} from "@/components/product/SortDropdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { useInfiniteProducts } from "@/lib/queries/products";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Mock data for categories and brands (replace with actual API calls)
const mockCategories = [
  { id: "1", name: "Vape Juice", slug: "vape-juice" },
  { id: "2", name: "Devices", slug: "devices" },
  { id: "3", name: "Accessories", slug: "accessories" },
];

const mockBrands = [
  { id: "1", name: "VapeMax", slug: "vapemax" },
  { id: "2", name: "CloudChaser", slug: "cloudchaser" },
  { id: "3", name: "PureVapor", slug: "purevapor" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterOptions>({
    categoryIds: [],
    brandIds: [],
    inStockOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Parse URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");

    // Update filters based on URL params
    // Note: Temporarily disabled category filtering until we have real category UUIDs from database
    // if (categoryParam) {
    //   const category = mockCategories.find((c) => c.slug === categoryParam);
    //   if (category) {
    //     setFilters((prev) => ({ ...prev, categoryIds: [category.id] }));
    //   }
    // }
  }, [searchParams]);

  // Fetch products with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteProducts(
    {
      // categoryId: filters.categoryIds?.[0], // Disabled until we have real category UUIDs
      // brandId: filters.brandIds?.[0],
      // priceMin: filters.priceRange?.[0],
      // priceMax: filters.priceRange?.[1],
      // inStockOnly: filters.inStockOnly,
      sortBy,
    },
    20
  );

  // Debug logging
  useEffect(() => {
    console.log("[ProductsPage] State:", {
      isLoading,
      isError,
      error: error?.message,
      hasData: !!data,
      pageCount: data?.pages?.length,
      firstPageProducts: data?.pages?.[0]?.products?.length,
      totalCount: data?.pages?.[0]?.totalCount,
    });
  }, [isLoading, isError, data, error]);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Flatten all pages into single array
  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Get active category name
  const activeCategoryName =
    filters.categoryIds && filters.categoryIds.length > 0
      ? mockCategories.find((c) => c.id === filters.categoryIds![0])?.name
      : null;

  return (
    <Container className="py-6 md:py-8">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {activeCategoryName || "All Products"}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                `${totalCount} products found`
              )}
            </div>
          </div>

          {/* Sort (Desktop) */}
          <div className="hidden md:block">
            <SortDropdown
              value={sortBy}
              onChange={setSortBy}
              className="w-64"
            />
          </div>
        </div>

        {/* Mobile Filter & Sort */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <FilterDrawer
            categories={mockCategories}
            brands={mockBrands}
            filters={filters}
            onFiltersChange={setFilters}
            priceRange={[0, 1000]}
          />
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar (Desktop) */}
          <div className="hidden md:block">
            <FilterSidebar
              categories={mockCategories}
              brands={mockBrands}
              filters={filters}
              onFiltersChange={setFilters}
              priceRange={[0, 1000]}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {isError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
                <p className="font-semibold text-destructive">
                  Failed to load products
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {error?.message || "An unknown error occurred"}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Check the browser console for more details
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <ProductGrid
                  products={[]}
                  isLoading={true}
                  priority
                  columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 p-12 text-center">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <>
                <ProductGrid
                  products={products}
                  isLoading={false}
                  priority
                  columns={{ mobile: 2, tablet: 3, desktop: 4 }}
                />

                {/* Load More Button / Loading Indicator */}
                {!isLoading && products.length > 0 && (
                  <div ref={loadMoreRef} className="mt-8 flex justify-center">
                    {isFetchingNextPage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">
                          Loading more products...
                        </p>
                      </div>
                    ) : hasNextPage ? (
                      <Button
                        onClick={() => fetchNextPage()}
                        variant="outline"
                        size="lg"
                      >
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Load More
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        You&apos;ve reached the end
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
