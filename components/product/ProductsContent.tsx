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
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface CategoryOrBrand {
  id: string;
  name: string;
  slug: string;
}

interface ProductsContentProps {
  categories: CategoryOrBrand[];
  brands: CategoryOrBrand[];
}

export function ProductsContent({ categories, brands }: ProductsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterOptions>({
    categoryIds: [],
    brandIds: [],
    inStockOnly: false,
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const isInternalUpdate = useRef(false);
  const isInitialized = useRef(false);

  // Parse URL params on initial mount only
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const categoryParam = searchParams.get("category");
    const brandParam = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");

    setFilters({
      categoryIds: categoryParam ? [categoryParam] : [],
      brandIds: brandParam ? [brandParam] : [],
      priceRange:
        minPrice && maxPrice
          ? [parseInt(minPrice), parseInt(maxPrice)]
          : undefined,
      inStockOnly: inStock === "true",
    });
  }, []); // Empty deps — only run once on mount

  // Sync filters to URL
  const updateFiltersInURL = useCallback(
    (newFilters: FilterOptions) => {
      isInternalUpdate.current = true;
      const params = new URLSearchParams();

      const search = searchParams.get("search");
      if (search) params.set("search", search);

      if (newFilters.categoryIds && newFilters.categoryIds.length > 0) {
        params.set("category", newFilters.categoryIds[0]);
      }
      if (newFilters.brandIds && newFilters.brandIds.length > 0) {
        params.set("brand", newFilters.brandIds[0]);
      }
      if (newFilters.priceRange) {
        params.set("minPrice", newFilters.priceRange[0].toString());
        params.set("maxPrice", newFilters.priceRange[1].toString());
      }
      if (newFilters.inStockOnly) {
        params.set("inStock", "true");
      }

      const newUrl = params.toString()
        ? `/products?${params.toString()}`
        : "/products";
      router.push(newUrl, { scroll: false });

      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 100);
    },
    [router, searchParams]
  );

  const handleFiltersChange = useCallback(
    (newFilters: FilterOptions) => {
      setFilters(newFilters);
      updateFiltersInURL(newFilters);
    },
    [updateFiltersInURL]
  );

  const searchParam = searchParams.get("search");
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
      query: searchParam || undefined,
      categoryId: filters.categoryIds?.[0],
      brandId: filters.brandIds?.[0],
      priceMin: filters.priceRange?.[0],
      priceMax: filters.priceRange?.[1],
      inStockOnly: filters.inStockOnly,
      sortBy,
    },
    20
  );

  const { ref: loadMoreRef } = useIntersectionObserver({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  const products = data?.pages.flatMap((page) => page.products) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const searchQuery = searchParams.get("search");
  const activeCategoryName =
    filters.categoryIds && filters.categoryIds.length > 0
      ? categories.find((c) => c.id === filters.categoryIds![0])?.name
      : null;

  const pageTitle = searchQuery
    ? `Search results for "${searchQuery}"`
    : activeCategoryName || "All Products";

  return (
    <Container className="py-6 md:py-10">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {pageTitle}
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
              className="w-56"
            />
          </div>
        </div>

        {/* Mobile Filter & Sort */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <FilterDrawer
            categories={categories}
            brands={brands}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            priceRange={[200, 3000]}
          />
          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Sidebar (Desktop) */}
          <div className="hidden md:block">
            <FilterSidebar
              categories={categories}
              brands={brands}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              priceRange={[200, 3000]}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {isError ? (
              <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-8 text-center">
                <p className="font-semibold text-destructive">
                  Failed to load products
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {error?.message || "An unknown error occurred"}
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <ProductGrid
                  products={[]}
                  isLoading={true}
                  priority
                  columns={{ mobile: 2, tablet: 3, desktop: 5 }}
                />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border bg-muted/50 p-12 text-center">
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
                  columns={{ mobile: 2, tablet: 3, desktop: 5 }}
                />

                {/* Load More / Infinite scroll sentinel */}
                {products.length > 0 && (
                  <div ref={loadMoreRef} className="mt-10 flex justify-center">
                    {isFetchingNextPage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">
                          Loading more…
                        </p>
                      </div>
                    ) : hasNextPage ? (
                      <Button
                        onClick={() => fetchNextPage()}
                        variant="outline"
                        size="lg"
                        className="rounded-xl"
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
