# API Reference - Server Actions

Complete reference for all server actions in the Vapour Lounge platform.

---

## Table of Contents

- [Authentication](#authentication)
- [Products](#products)
- [Shopping Cart](#shopping-cart)
- [Orders](#orders)
- [Payments](#payments)
- [Reviews](#reviews)
- [Returns](#returns)
- [Analytics](#analytics)
- [Point of Sale](#point-of-sale)
- [Utilities](#utilities)

---

## Authentication

### Age Verification

```typescript
import {
  submitAgeVerification,
  getMyVerificationStatus,
} from "@/app/actions/age-verification";

// Submit age verification with ID upload
const result = await submitAgeVerification({
  idImageIds: ["uuid1", "uuid2"], // Upload images first
  consentGiven: true,
  confirmOver18: true,
});

// Check status
const status = await getMyVerificationStatus();
// Returns: { isVerified: boolean, status: 'pending' | 'approved' | 'rejected', rejectionReason?: string }
```

### User Management (Admin)

```typescript
import { forceLogoutUser, updateUserRole } from "@/app/actions/user-management";

// Force logout a user
await forceLogoutUser("user-id");

// Change user role
await updateUserRole("user-id", "staff"); // 'customer' | 'staff' | 'admin'
```

---

## Products

### Browse & Search

```typescript
import {
  searchProducts,
  autocompleteProducts,
  getProduct,
} from "@/app/actions/products";

// Advanced search
const results = await searchProducts({
  query: "strawberry",
  categoryId: "category-uuid",
  brandId: "brand-uuid",
  minPrice: 50,
  maxPrice: 500,
  inStockOnly: true,
  page: 1,
  limit: 20,
});

// Autocomplete (min 2 chars)
const suggestions = await autocompleteProducts("str");
// Returns: [{ id, name, slug, primary_image }]

// Get single product
const product = await getProduct("product-slug-or-id");
```

### Product Management (Admin)

```typescript
import {
  createProduct,
  updateProduct,
  uploadProductImage,
} from "@/app/actions/products";

// Create product
const product = await createProduct({
  name: "Strawberry E-Liquid",
  description: "Premium strawberry flavor",
  price: 199.99,
  sku: "ELIQ-STRAW-001",
  category_id: "category-uuid",
  brand_id: "brand-uuid",
  stock_quantity: 50,
  low_stock_threshold: 10,
  has_variants: false,
});

// Upload product image
const image = await uploadProductImage("product-id", imageFile);

// Update product
await updateProduct("product-id", {
  price: 179.99,
  stock_quantity: 45,
});
```

### Product Variants

```typescript
import {
  createProductVariant,
  getProductVariants,
} from "@/app/actions/product-variants";

// Create variant (e.g., different nicotine levels)
await createProductVariant({
  productId: "product-uuid",
  sku: "ELIQ-STRAW-001-3MG",
  attributes: {
    nicotineLevel: "3mg",
    size: "60ml",
  },
  price: 199.99,
  stock_quantity: 20,
  is_active: true,
});

// Get all variants for a product
const variants = await getProductVariants("product-id");
```

---

## Shopping Cart

```typescript
import {
  addToCart,
  getCart,
  updateCartItemQuantity,
  removeFromCart,
} from "@/app/actions/cart";

// Add to cart
await addToCart({
  productId: "product-uuid",
  variantId: "variant-uuid", // Optional
  quantity: 2,
});

// Get cart with totals
const cart = await getCart();
/* Returns:
{
  items: [{ id, product, variant, quantity, price }],
  summary: {
    subtotal: 399.98,
    vatAmount: 47.99,
    total: 447.97,
    itemCount: 2
  }
}
*/

// Update quantity
await updateCartItemQuantity("cart-item-id", 3);

// Remove item
await removeFromCart("cart-item-id");
```

---

## Orders

### Customer Orders

```typescript
import {
  createOrderFromCart,
  getMyOrders,
  getOrderDetails,
  cancelOrder,
} from "@/app/actions/checkout";

// Create order from cart
const order = await createOrderFromCart({
  shippingAddress: {
    street: "123 Main St",
    city: "Johannesburg",
    province: "Gauteng",
    postal_code: "2000",
  },
  paymentMethod: "bank_transfer", // 'bank_transfer' | 'cash' | 'card'
});

// Get my orders
const orders = await getMyOrders(page, limit);

// Get order details
const order = await getOrderDetails("order-id");

// Cancel order (only pending)
await cancelOrder("order-id");
```

---

## Payments

### Upload Payment Proof

```typescript
import { uploadPaymentProof } from "@/app/actions/images";

// Upload payment proof
const proof = await uploadPaymentProof("order-id", paymentFile);
```

### Payment Verification (Admin/Staff)

```typescript
import {
  getPendingPaymentProofs,
  extractPaymentData,
  verifyPayment,
} from "@/app/actions/payment-verification";

// Get pending proofs
const proofs = await getPendingPaymentProofs();

// Extract data from proof
await extractPaymentData({
  proofId: "proof-uuid",
  referenceNumber: "PAY123456",
  amount: 447.97,
  paymentMethod: "EFT",
});

// Verify payment (barcode scan)
const result = await verifyPayment("PAY123456");
// Updates order to "processing" status
```

---

## Reviews

### Customer Reviews

```typescript
import {
  submitReview,
  getProductReviews,
  voteReviewHelpful,
} from "@/app/actions/reviews";

// Submit review (requires purchase)
await submitReview({
  productId: "product-uuid",
  rating: 5, // 1-5
  title: "Great product!",
  comment: "This e-liquid tastes amazing. Highly recommended.",
  imageIds: ["image-uuid"], // Optional, upload first
});

// Get product reviews
const reviews = await getProductReviews("product-id", page, limit);
/* Returns:
{
  data: [...reviews],
  pagination: {...},
  averageRating: 4.5,
  totalReviews: 42
}
*/

// Vote helpful
await voteReviewHelpful("review-id", true); // true = helpful, false = not helpful
```

### Review Moderation (Admin)

```typescript
import { getReviews, approveReview, hideReview } from "@/app/actions/reviews";

// Get all reviews with filters
const reviews = await getReviews(page, limit, {
  is_approved: false,
  is_hidden: false,
});

// Approve review
await approveReview("review-id");

// Hide inappropriate review
await hideReview("review-id");
```

---

## Returns

```typescript
import {
  requestReturn,
  getMyReturns,
  approveReturn,
  processRefund,
} from "@/app/actions/returns-refunds";

// Customer request return (30-day window)
await requestReturn({
  orderId: "order-uuid",
  items: [
    {
      orderItemId: "item-uuid",
      quantity: 1,
      reason: "Product not as described, wrong flavor received",
    },
  ],
  returnMethod: "refund", // 'refund' | 'exchange' | 'store_credit'
  additionalNotes: "Unopened bottle",
});

// Get my returns
const returns = await getMyReturns(page, limit);

// Admin approve return
await approveReturn("return-id", "Approved, valid reason");

// Process refund
await processRefund("return-id", "original", 199.99);
// Methods: 'original' | 'store_credit' | 'cash'
```

---

## Analytics

```typescript
import {
  getSalesOverview,
  getTopProducts,
  getDailySales,
  getCustomerAnalytics,
} from "@/app/actions/analytics";

// Sales overview
const overview = await getSalesOverview({
  startDate: "2024-01-01",
  endDate: "2024-01-31",
});
/* Returns:
{
  totalRevenue: 125000,
  totalOrders: 320,
  paidOrders: 280,
  averageOrderValue: 446.43,
  ordersByStatus: {...}
}
*/

// Top selling products
const topProducts = await getTopProducts(10, dateRange);

// Daily sales for chart
const dailySales = await getDailySales(30); // Last 30 days
/* Returns:
[
  { date: '2024-01-01', revenue: 4200, orders: 12 },
  { date: '2024-01-02', revenue: 3800, orders: 9 },
  ...
]
*/

// Customer analytics
const customers = await getCustomerAnalytics();
/* Returns:
{
  totalCustomers: 1250,
  verifiedCustomers: 980,
  newThisMonth: 45,
  topSpenders: [...]
}
*/
```

---

## Point of Sale

```typescript
import {
  clockIn,
  clockOut,
  createPOSTransaction,
  parkOrder
} from '@/app/actions/pos-system';

// Clock in (start shift)
await clockIn({
  registerId: 'register-uuid',
  openingCash: 500
});

// Create POS transaction
await createPOSTransaction({
  items: [
    {
      productId: 'product-uuid',
      variantId: 'variant-uuid', // Optional
      quantity: 2,
      price: 199.99
    }
  ],
  paymentMethod: 'cash',
  amountReceived: 500,
  customerId: 'customer-uuid' // Optional
});

// Park order for later
await parkOrder({
  items: [...],
  customerName: 'John Doe',
  notes: 'Waiting for age verification'
});

// Clock out (end shift)
await clockOut({
  closingCash: 4800
});
// Calculates: expected vs actual cash, difference
```

---

## Utilities

### Barcodes & QR Codes

```typescript
import {
  generateProductQRCode,
  generateProductBarcode,
  generateOrderQRCode,
} from "@/app/actions/barcodes";

// Generate product QR code
const qr = await generateProductQRCode("product-id");
// Returns base64 image data URL

// Generate barcode from SKU
const barcode = await generateProductBarcode("product-id");

// Generate order QR for pickup
const orderQR = await generateOrderQRCode("order-id");
```

### Email Notifications

```typescript
import {
  sendOrderConfirmationEmail,
  sendPaymentVerifiedEmail,
  sendOrderReadyEmail,
} from "@/app/actions/notifications";

// Trigger email notifications
await sendOrderConfirmationEmail("order-id");
await sendPaymentVerifiedEmail("order-id");
await sendOrderReadyEmail("order-id");
```

---

## Error Handling

All server actions return:

```typescript
type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: ErrorCode;
}

// Usage example:
const result = await createProduct({...});

if (!result.success) {
  // Handle error
  console.error(result.error);
  toast.error(result.message);
  return;
}

// Success
const product = result.data;
```

### Error Codes

```typescript
enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  SERVER_ERROR = "SERVER_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}
```

---

## Pagination

Paginated responses:

```typescript
type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};
```

---

## File Uploads

### Image Restrictions

- **Product images**: Max 5MB, JPEG/PNG/WebP
- **Payment proofs**: Max 10MB, PDF/JPEG/PNG
- **ID verification**: Max 10MB, PDF/JPEG/PNG

### Upload Flow

```typescript
// 1. Upload to Supabase Storage first
const file = event.target.files[0];
const { data, error } = await supabase.storage
  .from("product-images")
  .upload(`${Date.now()}-${file.name}`, file);

if (error) throw error;

// 2. Use the file path/ID in server action
const publicUrl = supabase.storage
  .from("product-images")
  .getPublicUrl(data.path).data.publicUrl;

await uploadProductImage(productId, publicUrl);
```

---

## Role-Based Access

Functions requiring specific roles:

- **Admin only**: `deleteUser`, `updateUserRole`, `deleteProduct`, `processRefund`
- **Admin + Staff**: `createProduct`, `approveAgeVerification`, `verifyPayment`, `approveReview`
- **Authenticated**: `submitReview`, `addToCart`, `createOrderFromCart`

Role checks happen automatically. Unauthorized access returns:

```typescript
{
  success: false,
  error: 'Insufficient permissions',
  code: 'FORBIDDEN'
}
```

---

## Best Practices

### 1. Always Handle Errors

```typescript
const result = await createProduct(data);

if (!result.success) {
  toast.error(result.message || "An error occurred");
  return;
}

toast.success(result.message || "Product created");
router.push(`/admin/products/${result.data.id}`);
```

### 2. Use Optimistic Updates

```typescript
// Client component
const [cart, setCart] = useState(initialCart);

const handleAddToCart = async (productId: string) => {
  // Optimistic update
  setCart((prev) => [...prev, { id: "temp", productId, quantity: 1 }]);

  const result = await addToCart({ productId, quantity: 1 });

  if (!result.success) {
    // Rollback
    setCart(initialCart);
    toast.error(result.error);
  } else {
    // Refresh from server
    const newCart = await getCart();
    setCart(newCart.data.items);
  }
};
```

### 3. Validate Client-Side First

```typescript
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
});

const handleSubmit = async (data: unknown) => {
  // Validate first
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    toast.error("Please fix validation errors");
    return;
  }

  // Then submit
  const result = await createProduct(parsed.data);
};
```

### 4. Use React Query / SWR

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

// Query
const { data, isLoading } = useQuery({
  queryKey: ["products", page],
  queryFn: () => searchProducts({ page, limit: 20 }),
});

// Mutation
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries(["products"]);
    toast.success("Product created");
  },
});
```

---

## Testing

```typescript
import { expect, test } from "vitest";

test("should create product", async () => {
  const result = await createProduct({
    name: "Test Product",
    price: 99.99,
    // ... other required fields
  });

  expect(result.success).toBe(true);
  expect(result.data.name).toBe("Test Product");
});
```

---

**For complete implementation details, see `IMPLEMENTATION_SUMMARY.md`**
