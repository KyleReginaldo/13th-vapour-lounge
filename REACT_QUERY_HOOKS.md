# React Query Integration - Vapour Lounge

Complete React Query (TanStack Query) integration patterns for all server actions.

**Reference:**

- [API Reference](API_REFERENCE.md) - Server action documentation
- [UI Implementation Plan](UI_IMPLEMENTATION_PLAN.md) - Frontend architecture

---

## 📦 Setup

### Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Provider Configuration

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 🛍️ Product Hooks

### `useProducts` - Get Product List

```typescript
// lib/queries/products.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/app/actions/products";

interface UseProductsParams {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  inStock?: boolean;
  sortBy?: "price_asc" | "price_desc" | "name" | "newest" | "popular";
  page?: number;
  limit?: number;
}

export const useProducts = (params: UseProductsParams = {}) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

**Usage in Component:**

```typescript
// app/(home)/page.tsx
'use client';

import { useProducts } from '@/lib/queries/products';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';

export default function HomePage() {
  const { data, isLoading, error } = useProducts({
    tags: ['featured'],
    inStock: true,
    limit: 8,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error loading products</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data?.data?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

### `useProduct` - Get Single Product

```typescript
// lib/queries/products.ts
export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

**Usage:**

```typescript
// app/products/[slug]/page.tsx
'use client';

import { useProduct } from '@/lib/queries/products';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { data: product, isLoading } = useProduct(params.slug);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return <NotFound />;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      {/* Rest of product details */}
    </div>
  );
}
```

---

### `useProductVariants` - Get Product Variants

```typescript
// lib/queries/products.ts
export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: () => getProductVariants(productId),
    enabled: !!productId,
  });
};
```

---

## 🛒 Cart Hooks

### `useCart` - Get Current Cart

```typescript
// lib/queries/cart.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
} from "@/app/actions/cart";
import { toast } from "sonner";

export const useCart = () => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
    staleTime: 30 * 1000, // 30 seconds
  });
};
```

---

### `useAddToCart` - Add Item to Cart

```typescript
// lib/queries/cart.ts
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addItemToCart,
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(["cart"]);

      // Optimistically update cart
      queryClient.setQueryData(["cart"], (old: any) => {
        if (!old) return old;

        const existingItem = old.items?.find(
          (item: any) => item.product_variant_id === newItem.productVariantId
        );

        if (existingItem) {
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.product_variant_id === newItem.productVariantId
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
            summary: {
              ...old.summary,
              itemCount: old.summary.itemCount + newItem.quantity,
            },
          };
        } else {
          return {
            ...old,
            items: [
              ...(old.items || []),
              { ...newItem, id: `temp-${Date.now()}` },
            ],
            summary: {
              ...old.summary,
              itemCount: old.summary.itemCount + newItem.quantity,
            },
          };
        }
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["cart"], context?.previousCart);
      toast.error("Failed to add item to cart");
    },
    onSuccess: () => {
      toast.success("Added to cart");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
```

**Usage:**

```typescript
// components/product/AddToCartButton.tsx
'use client';

import { useAddToCart } from '@/lib/queries/cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export const AddToCartButton = ({
  productVariantId,
  quantity = 1
}: {
  productVariantId: string;
  quantity?: number;
}) => {
  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    addToCart.mutate({ productVariantId, quantity });
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={addToCart.isPending}
      size="lg"
      className="w-full"
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
};
```

---

### `useUpdateCartItem` - Update Quantity

```typescript
// lib/queries/cart.ts
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
```

---

### `useRemoveFromCart` - Remove Item

```typescript
// lib/queries/cart.ts
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
  });
};
```

---

## 📦 Checkout Hooks

### `useCreateOrder` - Create Order from Cart

```typescript
// lib/queries/checkout.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrderFromCart } from "@/app/actions/checkout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createOrderFromCart,
    onSuccess: (data) => {
      // Clear cart
      queryClient.setQueryData(["cart"], null);
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      // Navigate to order confirmation
      router.push(`/orders/${data.data.orderNumber}/confirmation`);

      toast.success("Order placed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });
};
```

**Usage:**

```typescript
// app/checkout/page.tsx
'use client';

import { useCreateOrder } from '@/lib/queries/checkout';
import { Button } from '@/components/ui/button';

export default function CheckoutPage() {
  const createOrder = useCreateOrder();
  const [formData, setFormData] = useState({
    shippingAddress: {},
    paymentMethod: 'bank_transfer',
  });

  const handlePlaceOrder = () => {
    createOrder.mutate(formData);
  };

  return (
    <div>
      {/* Checkout form */}
      <Button
        onClick={handlePlaceOrder}
        disabled={createOrder.isPending}
        size="lg"
      >
        {createOrder.isPending ? 'Processing...' : 'Place Order'}
      </Button>
    </div>
  );
}
```

---

## 📝 Review Hooks

### `useProductReviews` - Get Reviews for Product

```typescript
// lib/queries/reviews.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProductReviews,
  submitReview,
  voteReviewHelpful,
} from "@/app/actions/reviews";

export const useProductReviews = (
  productId: string,
  filters?: { rating?: number }
) => {
  return useQuery({
    queryKey: ["reviews", productId, filters],
    queryFn: () => getProductReviews(productId, filters),
    enabled: !!productId,
  });
};
```

---

### `useSubmitReview` - Submit New Review

```typescript
// lib/queries/reviews.ts
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: (data, variables) => {
      // Invalidate reviews for this product
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.productId],
      });
      toast.success("Review submitted successfully!");
    },
    onError: () => {
      toast.error("Failed to submit review");
    },
  });
};
```

**Usage:**

```typescript
// components/reviews/ReviewForm.tsx
'use client';

import { useSubmitReview } from '@/lib/queries/reviews';
import { useState } from 'react';

export const ReviewForm = ({ productId }: { productId: string }) => {
  const submitReview = useSubmitReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReview.mutate({ productId, rating, comment });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Rating stars */}
      {/* Comment textarea */}
      <button type="submit" disabled={submitReview.isPending}>
        Submit Review
      </button>
    </form>
  );
};
```

---

### `useVoteReviewHelpful` - Vote Review as Helpful

```typescript
// lib/queries/reviews.ts
export const useVoteReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: voteReviewHelpful,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
};
```

---

## 👤 User Hooks

### `useOrders` - Get User Orders

```typescript
// lib/queries/orders.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrders } from "@/app/actions/orders";

export const useOrders = (params?: { status?: string; page?: number }) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getMyOrders(params),
  });
};
```

---

### `useOrder` - Get Single Order

```typescript
// lib/queries/orders.ts
export const useOrder = (orderNumber: string) => {
  return useQuery({
    queryKey: ["order", orderNumber],
    queryFn: () => getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
  });
};
```

---

### `useProfile` - Get User Profile

```typescript
// lib/queries/user.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/app/actions/users";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
  });
};
```

---

## 🏪 Admin Hooks

### `useAdminProducts` - Admin Product Management

```typescript
// lib/queries/admin/products.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/app/actions/products";

export const useAdminProducts = (params?: any) => {
  return useQuery({
    queryKey: ["admin", "products", params],
    queryFn: () => getAllProducts(params),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product created successfully");
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Product deleted successfully");
    },
  });
};
```

---

### `useAdminOrders` - Admin Order Management

```typescript
// lib/queries/admin/orders.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllOrders, updateOrderStatus } from "@/app/actions/orders";

export const useAdminOrders = (filters?: any) => {
  return useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: () => getAllOrders(filters),
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Order status updated");
    },
  });
};
```

---

### `usePaymentProofs` - Admin Payment Verification

```typescript
// lib/queries/admin/payments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingPaymentProofs,
  verifyPayment,
  rejectPaymentProof,
} from "@/app/actions/payment-verification";

export const usePendingPaymentProofs = () => {
  return useQuery({
    queryKey: ["admin", "payment-proofs", "pending"],
    queryFn: getPendingPaymentProofs,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Payment verified successfully");
    },
  });
};
```

---

### `useAnalytics` - Dashboard Analytics

```typescript
// lib/queries/admin/analytics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getSalesOverview,
  getTopProducts,
  getDailySales,
  getCustomerAnalytics,
} from "@/app/actions/analytics";

export const useSalesOverview = (dateRange: { from: string; to: string }) => {
  return useQuery({
    queryKey: ["analytics", "sales-overview", dateRange],
    queryFn: () => getSalesOverview(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useTopProducts = (dateRange: { from: string; to: string }) => {
  return useQuery({
    queryKey: ["analytics", "top-products", dateRange],
    queryFn: () => getTopProducts(dateRange),
  });
};

export const useDailySales = (dateRange: { from: string; to: string }) => {
  return useQuery({
    queryKey: ["analytics", "daily-sales", dateRange],
    queryFn: () => getDailySales(dateRange),
  });
};
```

**Usage in Dashboard:**

```typescript
// app/admin/page.tsx
'use client';

import { useSalesOverview, useTopProducts } from '@/lib/queries/admin/analytics';
import { SalesChart } from '@/components/admin/SalesChart';
import { StatCard } from '@/components/admin/StatCard';

export default function AdminDashboard() {
  const dateRange = {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  };

  const { data: overview, isLoading: overviewLoading } = useSalesOverview(dateRange);
  const { data: topProducts } = useTopProducts(dateRange);

  if (overviewLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`R ${overview?.totalRevenue.toFixed(2)}`}
        />
        <StatCard
          title="Total Orders"
          value={overview?.totalOrders}
        />
        <StatCard
          title="Avg Order Value"
          value={`R ${overview?.avgOrderValue.toFixed(2)}`}
        />
        <StatCard
          title="New Customers"
          value={overview?.newCustomers}
        />
      </div>

      <SalesChart data={overview?.dailySales} />

      {/* Top Products */}
      <TopProductsTable products={topProducts} />
    </div>
  );
}
```

---

## 🖼️ Image Upload Hooks

### `useImageUpload` - Upload Product/Review Images

```typescript
// lib/queries/images.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import { uploadProductImage } from "@/app/actions/images";

export const useImageUpload = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadProductImage(formData);
    },
    onError: () => {
      toast.error("Failed to upload image");
    },
  });
};
```

**Usage:**

```typescript
// components/admin/ImageUploader.tsx
'use client';

import { useImageUpload } from '@/lib/queries/images';
import { useState } from 'react';

export const ImageUploader = ({ onUploadComplete }: { onUploadComplete: (url: string) => void }) => {
  const uploadImage = useImageUpload();
  const [preview, setPreview] = useState<string>();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const result = await uploadImage.mutateAsync(file);
    if (result.success) {
      onUploadComplete(result.data.url);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploadImage.isPending && <div>Uploading...</div>}
      {preview && <img src={preview} alt="Preview" />}
    </div>
  );
};
```

---

## 🔄 Infinite Scroll Pattern

### `useInfiniteProducts` - Infinite Product Listing

```typescript
// lib/queries/products.ts
import { useInfiniteQuery } from "@tanstack/react-query";

export const useInfiniteProducts = (filters: any = {}) => {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", filters],
    queryFn: ({ pageParam = 1 }) =>
      getProducts({ ...filters, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.data.length === 20;
      return hasMore ? lastPage.pagination.page + 1 : undefined;
    },
  });
};
```

**Usage with Intersection Observer:**

```typescript
// app/products/page.tsx
'use client';

import { useInfiniteProducts } from '@/lib/queries/products';
import { useEffect, useRef } from 'react';

export default function ProductsPage() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts({ category: 'juice' });

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {page.data.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ))}

      <div ref={observerTarget} className="h-10" />
      {isFetchingNextPage && <LoadingSpinner />}
    </div>
  );
}
```

---

## 🔔 Real-time Updates with Polling

### Poll for Pending Actions

```typescript
// lib/queries/admin/payments.ts
export const usePendingPaymentProofs = () => {
  return useQuery({
    queryKey: ["admin", "payment-proofs", "pending"],
    queryFn: getPendingPaymentProofs,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchIntervalInBackground: true, // Continue polling in background
  });
};
```

---

## 🎯 Prefetching Strategies

### Prefetch on Hover

```typescript
// components/product/ProductCard.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getProductBySlug } from '@/app/actions/products';

export const ProductCard = ({ product }) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['product', product.slug],
      queryFn: () => getProductBySlug(product.slug),
    });
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Product card content */}
    </Link>
  );
};
```

---

## 🧪 Testing Patterns

### Mock Query Hooks

```typescript
// __tests__/components/ProductCard.test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { ProductCard } from '@/components/product/ProductCard';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('renders product card', () => {
  const product = { id: '1', name: 'Test Product', price: 10 };

  const { getByText } = render(
    <ProductCard product={product} />,
    { wrapper: createWrapper() }
  );

  expect(getByText('Test Product')).toBeInTheDocument();
});
```

---

## 📊 Query Key Conventions

**Organized query keys for easy invalidation:**

```typescript
// lib/queries/keys.ts
export const queryKeys = {
  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters: any) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    variants: (id: string) =>
      [...queryKeys.products.all, "variants", id] as const,
  },

  // Cart
  cart: ["cart"] as const,

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters: any) => [...queryKeys.orders.lists(), filters] as const,
    detail: (orderNumber: string) =>
      [...queryKeys.orders.all, "detail", orderNumber] as const,
  },

  // Reviews
  reviews: {
    all: ["reviews"] as const,
    product: (productId: string, filters?: any) =>
      [...queryKeys.reviews.all, productId, filters] as const,
  },

  // Admin
  admin: {
    products: (filters: any) => ["admin", "products", filters] as const,
    orders: (filters: any) => ["admin", "orders", filters] as const,
    paymentProofs: ["admin", "payment-proofs", "pending"] as const,
    analytics: {
      salesOverview: (dateRange: any) =>
        ["analytics", "sales-overview", dateRange] as const,
      topProducts: (dateRange: any) =>
        ["analytics", "top-products", dateRange] as const,
    },
  },
};
```

---

## ✅ Best Practices

1. **Use query keys consistently** - Organize by feature, use objects for complex filters
2. **Implement optimistic updates** - For better UX (cart, favorites)
3. **Handle errors gracefully** - Show toast notifications
4. **Use staleTime wisely** - Balance freshness and performance
5. **Prefetch on user intent** - Hover, route changes
6. **Invalidate related queries** - When mutations succeed
7. **Use suspense boundaries** - For loading states (optional)
8. **Monitor with DevTools** - Keep React Query DevTools enabled in development

---

**Reference:**

- [API Reference](API_REFERENCE.md) - Server action documentation
- [Component Library](COMPONENT_LIBRARY.md) - UI components
- [TanStack Query Docs](https://tanstack.com/query/latest)

**Framework:** TanStack Query v5
**Integration:** Next.js 14 Server Actions
**State Management:** React Query (server state) + useState (local state)
