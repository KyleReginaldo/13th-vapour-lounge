"use client";

import {
  getProductById,
  getProducts,
  searchProducts,
} from "@/app/actions/products";
import type { ProductCardData } from "@/components/product/ProductCard";
import { queryKeys } from "@/lib/queries/keys";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

// Types
interface ProductFilters {
  query?: string;
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  sortBy?: string;
}

interface ProductListParams extends ProductFilters {
  page?: number;
  limit?: number;
}

interface ProductsResponse {
  products: ProductCardData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

/**
 * Fetch products with pagination
 */
export const useProducts = (params: ProductListParams = {}) => {
  const { page = 1, limit = 20, ...filters } = params;

  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const result = await getProducts(page, limit, filters.categoryId);
      return result as ProductsResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Fetch products with infinite scroll
 */
export const useInfiniteProducts = (
  filters: ProductFilters = {},
  limit = 20
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      // Use searchProducts if there's any filter applied (query, brand, price, or stock filter)
      const hasFilters =
        (filters.query && filters.query.length >= 2) ||
        filters.brandId ||
        filters.priceMin !== undefined ||
        filters.priceMax !== undefined ||
        filters.inStockOnly;

      if (hasFilters) {
        const result = await searchProducts({
          query: filters.query || "",
          categoryId: filters.categoryId,
          brandId: filters.brandId,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          inStockOnly: filters.inStockOnly,
          page: pageParam as number,
          limit,
        });

        if (!result.success) {
          throw new Error(result.message || "Failed to search products");
        }

        const data = result.data as any;
        return {
          products: data.products || [],
          totalCount: data.pagination?.total || 0,
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.totalPages || 1,
        } as ProductsResponse;
      }

      // Otherwise use regular getProducts (no filters at all)
      const result = await getProducts(
        pageParam as number,
        limit,
        filters.categoryId
      );
      return result as ProductsResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch a single product by slug
 */
export const useProduct = (productId: string | null) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId || ""),
    queryFn: async () => {
      if (!productId) throw new Error("Product ID is required");
      return await getProductById(productId);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Search products
 */
export const useProductSearch = (params: ProductFilters) => {
  return useQuery({
    queryKey: queryKeys.products.search(params.query || ""),
    queryFn: async () => {
      const result = await searchProducts({
        query: params.query,
        categoryId: params.categoryId,
        brandId: params.brandId,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
        inStockOnly: params.inStockOnly,
        page: 1,
        limit: 50,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: !!params.query && params.query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Prefetch product details (for hover/link prefetch)
 */
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: () => getProductById(productId),
      staleTime: 1000 * 60 * 10,
    });
  };
};
