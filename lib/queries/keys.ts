// Query key factory for organized cache management
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
    search: (query: string) =>
      [...queryKeys.products.all, "search", query] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    detail: () => [...queryKeys.cart.all, "detail"] as const,
  },

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

  // User
  user: {
    profile: ["user", "profile"] as const,
    orders: (params?: any) => ["user", "orders", params] as const,
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
      dailySales: (dateRange: any) =>
        ["analytics", "daily-sales", dateRange] as const,
    },
  },
};
