# UI Implementation Plan - Vapour Lounge

## Overview

Complete implementation plan for building the Vapour Lounge e-commerce platform UI based on research findings from Shopee, Lazada, Amazon, and modern e-commerce trends.

**Reference Documents:**

- [Design Inspirations](research/01-design-inspirations.md) - Shopee, Lazada, Amazon patterns
- [Mobile Responsiveness](research/02-mobile-responsiveness.md) - Breakpoints and layouts
- [POS System Design](research/08-pos-systems.md) - Point of sale interface
- [API Reference](API_REFERENCE.md) - Backend server actions

---

## 🎨 Design System Foundation

### Color Palette (Based on Research: Bold & Vibrant)

```css
/* Primary Colors - Purple to Pink Gradient */
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #ec4899 100%);
--primary-500: #6366f1;
--primary-600: #5558e3;
--primary-700: #4749cf;

/* Secondary Colors */
--secondary-orange: #f97316;
--accent-lime: #84cc16;
--accent-cyan: #06b6d4;

/* Neutral Colors */
--background-dark: #0f172a;
--background-light: #f8fafc;
--surface: #ffffff;
--surface-dark: #1e293b;

/* Text Colors */
--text-primary: #0f172a;
--text-secondary: #64748b;
--text-inverse: #f8fafc;

/* Status Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;
```

### Typography (Reference: Research 01, Section 4)

```css
/* Font Family */
--font-heading: "Space Grotesk", sans-serif;
--font-body: "Inter", sans-serif;

/* Heading Scale */
--h1: 2.5rem; /* 40px - Hero headings */
--h2: 2rem; /* 32px - Page titles */
--h3: 1.5rem; /* 24px - Section headings */
--h4: 1.25rem; /* 20px - Card titles */
--h5: 1.125rem; /* 18px - Subsections */
--h6: 1rem; /* 16px - Small headings */

/* Body Text */
--text-lg: 1.125rem; /* 18px */
--text-base: 1rem; /* 16px */
--text-sm: 0.875rem; /* 14px */
--text-xs: 0.75rem; /* 12px */

/* Line Heights */
--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.7;
```

### Spacing System (8px Grid)

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
```

---

## 📱 Responsive Breakpoints (Reference: Research 02)

```javascript
const breakpoints = {
  sm: '640px',   // Large phones, small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
}

// Grid Columns by Device
mobile:   2 columns (product grid)
tablet:   3 columns
desktop:  4-5 columns
```

---

## 🏗️ Application Structure

### Three Main Interfaces

1. **Customer Store** (`/`)
   - Homepage
   - Product catalog
   - Product details
   - Shopping cart
   - Checkout
   - Order tracking
   - User profile
   - Reviews

2. **Admin Dashboard** (`/admin`)
   - Analytics overview
   - Product management
   - Order management
   - Payment verification
   - User management
   - Inventory control
   - Returns processing
   - Review moderation

3. **POS System** (`/admin/pos`)
   - Product lookup
   - Cart builder
   - Payment processing
   - Shift management
   - Parked orders

---

## 🛍️ Customer Store - Page Breakdown

### 1. Homepage (`/`)

**Layout (Reference: Research 01, Shopee)**

```
┌────────────────────────────────────┐
│  Header (Sticky)                   │
├────────────────────────────────────┤
│  Hero Carousel (Auto-rotate)       │
│  • Promotional banners             │
│  • Dots navigation                 │
├────────────────────────────────────┤
│  Category Icons Grid (8-12)        │
│  [Juice] [Devices] [Coils] [Pods]  │
├────────────────────────────────────┤
│  Flash Sales (Countdown Timer)     │
│  [Product] [Product] [Product] →   │
│  (Horizontal scroll)               │
├────────────────────────────────────┤
│  New Arrivals                      │
│  [Product Grid 2x2, 3x3, 4x4]      │
├────────────────────────────────────┤
│  Best Sellers                      │
│  [Product Grid]                    │
├────────────────────────────────────┤
│  Featured Brands                   │
│  [Brand Logos]                     │
├────────────────────────────────────┤
│  Footer                            │
└────────────────────────────────────┘
```

**Components Needed:**

- `HeroCarousel.tsx` - Auto-rotating banner
- `CategoryGrid.tsx` - Icon-based navigation
- `FlashSalesSection.tsx` - Countdown + horizontal scroll
- `ProductGrid.tsx` - Responsive grid layout
- `ProductCard.tsx` - Individual product display

**Server Actions:**

```typescript
import { searchProducts } from "@/app/actions/products";

// Fetch new arrivals
const newProducts = await searchProducts({
  page: 1,
  limit: 8,
  sortBy: "created_at",
  sortOrder: "desc",
});

// Fetch best sellers
const bestSellers = await searchProducts({
  page: 1,
  limit: 8,
  sortBy: "sales_count",
  sortOrder: "desc",
});
```

---

### 2. Product Listing Page (`/products`)

**Layout (Reference: Research 01, Amazon + Lazada)**

```
Desktop:
┌────────────┬───────────────────────────────┐
│            │ Search Results (234 products)  │
│  Filters   │ Sort: [Featured ▼]            │
│  ────────  ├───────────────────────────────┤
│  Brand     │ ┌────┬────┬────┬────┐         │
│  ☑ Vgod    │ │Prd1│Prd2│Prd3│Prd4│         │
│  ☐ Smok    │ ├────┼────┼────┼────┤         │
│            │ │Prd5│Prd6│Prd7│Prd8│         │
│  Price     │ └────┴────┴────┴────┘         │
│  [min-max] │ [Load More / Pagination]      │
│            │                                │
│  Nicotine  │                                │
│  ☐ 0mg     │                                │
│  ☐ 3mg     │                                │
│  ☐ 6mg     │                                │
└────────────┴───────────────────────────────┘

Mobile: Bottom sheet filters
```

**Components Needed:**

- `FilterSidebar.tsx` (desktop) / `FilterBottomSheet.tsx` (mobile)
- `SortDropdown.tsx`
- `FilterChips.tsx` - Active filters display
- `ProductGrid.tsx` - Results grid
- `Pagination.tsx` or `InfiniteScroll.tsx`

**Server Actions:**

```typescript
import { searchProducts } from "@/app/actions/products";

const results = await searchProducts({
  query: searchTerm,
  categoryId: selectedCategory,
  brandId: selectedBrand,
  minPrice: priceRange[0],
  maxPrice: priceRange[1],
  inStockOnly: true,
  page: currentPage,
  limit: 20,
});
```

**Features:**

- ✅ Multi-select filters (brand, nicotine, price)
- ✅ Real-time results count
- ✅ Filter chips with remove (X)
- ✅ Sort: Featured, Price, Newest, Name
- ✅ Grid density toggle (2/3/4 columns)

---

### 3. Product Detail Page (`/products/[slug]`)

**Layout (Reference: Research 01, Lazada PDP)**

```
┌────────────────────────────────────────────┐
│ Breadcrumb: Home > Vape Juice > Strawberry │
├──────────────────┬─────────────────────────┤
│                  │ Strawberry E-Liquid 60ml │
│  Image Gallery   │ ★★★★★ 4.8 (127 reviews)  │
│  ┌────────────┐  │                          │
│  │ Main Image │  │ R 199.99 (was R 249.99)  │
│  │ [Zoomable] │  │ 20% OFF                  │
│  └────────────┘  │                          │
│  [🖼][🖼][🖼][🖼]  │ Nicotine Level:          │
│  Thumbnails      │ [0mg][3mg][6mg][12mg]    │
│                  │                          │
│                  │ Quantity: [−] 1 [+]      │
│                  │ Stock: 45 available      │
│                  │                          │
│                  │ [🛒 Add to Cart]         │
│                  │ [⚡ Buy Now]             │
│                  │                          │
│                  │ Description:             │
│                  │ [Product description...] │
├──────────────────┴─────────────────────────┤
│  Specifications                             │
│  • Brand: VGOD                              │
│  • Size: 60ml                               │
│  • PG/VG: 30/70                             │
├────────────────────────────────────────────┤
│  Customer Reviews (127)                     │
│  ★★★★★ 60% (76)                             │
│  ★★★★☆ 20% (25)                             │
│  [Write Review]                             │
│  ────────────────────────────────────       │
│  [Review cards with images]                 │
├────────────────────────────────────────────┤
│  You May Also Like                          │
│  [Product Grid]                             │
└────────────────────────────────────────────┘
```

**Components Needed:**

- `ImageGallery.tsx` - Main image + thumbnails, zoom
- `VariantSelector.tsx` - Chip-based selector
- `QuantityInput.tsx` - +/- buttons
- `ProductSpecs.tsx` - Collapsible table
- `ReviewsSection.tsx` - Star breakdown + review cards
- `RelatedProducts.tsx` - Recommendations

**Server Actions:**

```typescript
import { getProduct } from "@/app/actions/products";
import { getProductReviews } from "@/app/actions/reviews";
import { addToCart } from "@/app/actions/cart";
import { getProductVariants } from "@/app/actions/product-variants";

// Fetch product
const product = await getProduct(slug);

// Fetch variants (if has_variants = true)
const variants = await getProductVariants(product.id);

// Fetch reviews
const reviews = await getProductReviews(product.id, page, 10);

// Add to cart
const handleAddToCart = async () => {
  await addToCart({
    productId: product.id,
    variantId: selectedVariant?.id,
    quantity: quantity,
  });
};
```

**Features:**

- ✅ Image zoom on hover (desktop) / pinch (mobile)
- ✅ Variant chips (visual, not dropdown)
- ✅ Stock availability display
- ✅ Dual CTAs: Add to Cart + Buy Now
- ✅ Collapsible specs table
- ✅ Review star distribution chart
- ✅ Review images in grid

---

### 4. Shopping Cart (`/cart`)

**Layout (Reference: Research 01, Lazada Cart)**

```
Desktop:
┌────────────────────────────┬──────────────────┐
│ Shopping Cart (3 items)    │ Order Summary    │
├────────────────────────────┤                  │
│ ┌────────────────────────┐ │ Subtotal: R 599  │
│ │ [✓] [Img] Product Name │ │ VAT (12%): R 72  │
│ │     60ml, 3mg          │ │ ─────────────── │
│ │     R 199.99           │ │ Total: R 671     │
│ │     [−] 2 [+]    [🗑]  │ │                  │
│ └────────────────────────┘ │ [Checkout]       │
│ ┌────────────────────────┐ │                  │
│ │ [✓] [Img] Product 2    │ │ Promo Code:      │
│ │     ...                │ │ [________] Apply │
│ └────────────────────────┘ │                  │
│                            │ Free shipping!   │
│ [Continue Shopping]        │                  │
└────────────────────────────┴──────────────────┘
```

**Components Needed:**

- `CartItemCard.tsx` - Individual cart item
- `OrderSummary.tsx` - Sticky sidebar (desktop)
- `PromoCodeInput.tsx`
- `EmptyCart.tsx` - When cart is empty

**Server Actions:**

```typescript
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
} from "@/app/actions/cart";

// Fetch cart
const cart = await getCart();
// Returns: { items: [...], summary: { subtotal, vatAmount, total, itemCount } }

// Update quantity
await updateCartItemQuantity(cartItemId, newQuantity);

// Remove item
await removeFromCart(cartItemId);
```

**Features:**

- ✅ Checkbox to select items
- ✅ Inline quantity adjustment
- ✅ Delete with confirmation
- ✅ Auto-calculated totals
- ✅ Promo code input
- ✅ Continue shopping link
- ✅ Sticky order summary (desktop)

---

### 5. Checkout Page (`/checkout`)

**Layout (Reference: Research 01, Single-page checkout)**

```
┌────────────────────────────────────────────┐
│ Checkout                                    │
│ [1 Address]──[2 Payment]──[3 Review]       │
├────────────────────────────┬───────────────┤
│ 1. Delivery Address        │ Order Summary │
│ [Name____________________] │ 3 items       │
│ [Street__________________] │               │
│ [City____] [Province____]  │ Subtotal: R599│
│ [Postal__]                 │ VAT: R72      │
│ ☐ Save this address        │ ──────────── │
│                            │ Total: R671   │
│ 2. Payment Method          │               │
│ ● Bank Transfer            │ [Place Order] │
│ ○ Cash on Pickup           │               │
│   (Upload screenshot after)│               │
│                            │               │
│ 3. Review Order            │               │
│ [Order items list]         │               │
│                            │               │
│ [Place Order]              │               │
└────────────────────────────┴───────────────┘
```

**Components Needed:**

- `CheckoutProgressBar.tsx` - Step indicator
- `AddressForm.tsx` - Auto-saving form
- `PaymentMethodSelector.tsx`
- `OrderReview.tsx` - Final confirmation

**Server Actions:**

```typescript
import { createOrderFromCart } from "@/app/actions/checkout";

const handlePlaceOrder = async () => {
  const result = await createOrderFromCart({
    shippingAddress: {
      street: formData.street,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postalCode,
    },
    paymentMethod: selectedMethod, // 'bank_transfer' | 'cash' | 'card'
  });

  if (result.success) {
    router.push(`/orders/${result.data.id}`);
  }
};
```

**Features:**

- ✅ Single-page checkout (all steps visible)
- ✅ Auto-save form data
- ✅ Real-time validation
- ✅ Order summary sticky sidebar
- ✅ Payment method selection
- ✅ Final review before submit

---

### 6. Order Confirmation & Tracking (`/orders/[id]`)

**Layout**

```
┌────────────────────────────────────────────┐
│ Order Confirmation                          │
│ ✓ Order placed successfully!               │
├────────────────────────────────────────────┤
│ Order #ORD-20260215-0042                    │
│ Status: Pending Payment                     │
│                                             │
│ [●────○────○────○] Progress                │
│ Ordered  Paid  Ready  Completed             │
│                                             │
│ Next Step: Upload Payment Proof            │
│ [📤 Upload Receipt]                        │
│                                             │
│ Order Details:                              │
│ ┌─────────────────────────────────────────┐│
│ │ [Img] Product 1    x2    R 399.98       ││
│ │ [Img] Product 2    x1    R 199.99       ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Subtotal:           R 599.97                │
│ VAT (12%):         R 72.00                  │
│ ─────────────────────────────               │
│ Total:             R 671.97                 │
│                                             │
│ Delivery Address:                           │
│ 123 Main Street                             │
│ Johannesburg, Gauteng 2000                  │
│                                             │
│ [Download QR Code for Pickup]              │
└────────────────────────────────────────────┘
```

**Components Needed:**

- `OrderStatusBadge.tsx`
- `OrderProgressBar.tsx` - Visual timeline
- `PaymentUploadModal.tsx`
- `OrderItemsList.tsx`
- `QRCodeDisplay.tsx`

**Server Actions:**

```typescript
import { getOrderDetails } from "@/app/actions/checkout";
import { uploadPaymentProof } from "@/app/actions/images";
import { generateOrderQRCode } from "@/app/actions/barcodes";

// Fetch order
const order = await getOrderDetails(orderId);

// Upload payment proof
const handleUploadProof = async (file: File) => {
  await uploadPaymentProof(orderId, file);
};

// Generate QR for pickup
const qrCode = await generateOrderQRCode(orderId);
```

---

### 7. User Profile & Orders (`/profile`)

**Layout**

```
┌────────────────┬───────────────────────────┐
│                │ Profile Overview          │
│  Sidebar Nav   │ ─────────────────────────│
│  • Dashboard   │ Welcome, John!            │
│  • Orders      │                           │
│  • Reviews     │ Orders: 12                │
│  • Addresses   │ Reviews: 5                │
│  • Settings    │ Verified: ✓               │
│  • Logout      ├───────────────────────────┤
│                │ Recent Orders             │
│                │ ┌───────────────────────┐ │
│                │ │ #ORD-001  R 671  [→] │ │
│                │ │ Status: Ready         │ │
│                │ └───────────────────────┘ │
└────────────────┴───────────────────────────┘
```

**Components Needed:**

- `ProfileSidebar.tsx`
- `OrderHistory.tsx` - Table/card view
- `ReviewsList.tsx`
- `AddressList.tsx`
- `AgeVerificationCard.tsx`

**Server Actions:**

```typescript
import { getMyOrders } from "@/app/actions/checkout";
import { getMyVerificationStatus } from "@/app/actions/age-verification";
import { submitAgeVerification } from "@/app/actions/age-verification";
```

---

## 🎛️ Admin Dashboard - Page Breakdown

### 1. Dashboard Overview (`/admin`)

**Layout (Reference: Modern Admin Templates)**

```
┌────────────────────────────────────────────┐
│  Sidebar Nav        Dashboard Overview     │
├──────────────┬─────────────────────────────┤
│ • Dashboard  │ ┌──────┬──────┬──────┬────┐│
│ • Products   │ │ Rev  │Orders│Cust  │Stock││
│ • Orders     │ │R125k │  320 │ 1250 │ LOW ││
│ • Payments   │ └──────┴──────┴──────┴────┘│
│ • Inventory  │                             │
│ • Reviews    │ Sales Chart (30 days)       │
│ • Returns    │ [Line chart visualization]  │
│ • Users      │                             │
│ • Settings   │ Top Products                │
│              │ [Table with sales data]     │
│              │                             │
│              │ Recent Orders               │
│              │ [Order cards/table]         │
└──────────────┴─────────────────────────────┘
```

**Components Needed:**

- `AdminLayout.tsx` - Sidebar + main content
- `StatCards.tsx` - Revenue, orders, etc.
- `SalesChart.tsx` - Line/bar chart
- `TopProductsTable.tsx`
- `RecentOrdersTable.tsx`

**Server Actions:**

```typescript
import {
  getSalesOverview,
  getTopProducts,
  getDailySales,
  getCustomerAnalytics,
} from "@/app/actions/analytics";

const overview = await getSalesOverview({
  startDate: "2026-01-01",
  endDate: "2026-01-31",
});

const topProducts = await getTopProducts(10);
const dailySales = await getDailySales(30);
```

---

### 2. Payment Verification (`/admin/payments`)

**Layout (Reference: Research 08, POS Systems)**

```
┌────────────────────────────────────────────┐
│ Payment Verification                        │
├────────────────────────────────────────────┤
│ Pending Proofs (42)          [📷 Scan]     │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Order: #ORD-001          Upload: 2h ago ││
│ │ Customer: john@email.com                ││
│ │ Amount: R 671.97                        ││
│ │                                         ││
│ │ [Image Preview]                         ││
│ │                                         ││
│ │ Reference: [_______________________]   ││
│ │ Amount:    [_______________________]   ││
│ │ Method:    [EFT ▼]                     ││
│ │                                         ││
│ │ [Extract Data] [Reject]                ││
│ └─────────────────────────────────────────┘│
└────────────────────────────────────────────┘

Barcode Scanner:
┌────────────────────────────────────────────┐
│ Scan Payment Reference                      │
│ ─────────────────────────────────────      │
│ [Camera viewfinder]                         │
│                                             │
│ Or enter manually:                          │
│ [________________________]  [Verify]       │
└────────────────────────────────────────────┘
```

**Components Needed:**

- `PaymentProofCard.tsx`
- `PaymentExtractForm.tsx`
- `BarcodeScanner.tsx` (using html5-qrcode)
- `PaymentVerificationModal.tsx`

**Server Actions:**

```typescript
import {
  getPendingPaymentProofs,
  extractPaymentData,
  verifyPayment,
  rejectPaymentProof,
} from "@/app/actions/payment-verification";

// Fetch pending
const proofs = await getPendingPaymentProofs();

// Extract data
await extractPaymentData({
  proofId: proof.id,
  referenceNumber: "PAY123456",
  amount: 671.97,
  paymentMethod: "EFT",
});

// Verify via barcode scan
await verifyPayment("PAY123456");
```

---

### 3. POS System (`/admin/pos`)

**Layout (Reference: Research 08, Square/Shopify POS)**

```
┌──────────────────────┬────────────────────────────┐
│  SEARCH: [______]    │  CURRENT SALE              │
│  [📷 Scan Barcode]   │                            │
│  ──────────────────  │  1. Strawberry 3mg         │
│  CATEGORIES:         │     R29.99 x2    R59.98    │
│  [All] Juice         │  2. Vape Device            │
│  [Devices] Coils     │     R89.99 x1    R89.99    │
│  ──────────────────  │  ─────────────────────────│
│  ┌────┬────┬────┐    │  Subtotal:       R149.97   │
│  │PRD1│PRD2│PRD3│    │  Tax (12%):       R18.00   │
│  │$29 │$34 │$24 │    │  ─────────────────────────│
│  ├────┼────┼────┤    │  TOTAL:          R167.97   │
│  │PRD4│PRD5│PRD6│    │                            │
│  └────┴────┴────┘    │  Customer: [Select ▼]     │
│  [Load More...]      │  Notes: [_______________]  │
│                       │                            │
│  Shift: #42          │  [🅿️ Park] [🗑️Clear]       │
│  Cash: R 500         │  [💳 Checkout]            │
└──────────────────────┴────────────────────────────┘
```

**Components Needed:**

- `POSProductGrid.tsx`
- `POSCart.tsx`
- `POSCheckoutModal.tsx`
- `ShiftManagement.tsx`
- `BarcodeScanner.tsx`

**Server Actions:**

```typescript
import {
  clockIn,
  clockOut,
  createPOSTransaction,
  parkOrder,
  getParkedOrders
} from '@/app/actions/pos-system';

// Start shift
await clockIn({
  registerId: 'register-1',
  openingCash: 500
});

// Create transaction
await createPOSTransaction({
  items: [
    { productId: 'prod-1', quantity: 2, price: 29.99 }
  ],
  paymentMethod: 'cash',
  amountReceived: 200,
  customerId: 'customer-id' // optional
});

// Park order
await parkOrder({
  items: [...],
  customerName: 'John Doe',
  notes: 'Waiting for age verification'
});
```

---

## 🎭 Component Library Breakdown

### Core Reusable Components

#### 1. Navigation Components

- `Header.tsx` - Main site header
- `MobileBottomNav.tsx` - Mobile bottom navigation
- `Sidebar.tsx` - Admin sidebar
- `Breadcrumb.tsx`
- `MegaMenu.tsx` - Category mega menu

#### 2. Product Components

- `ProductCard.tsx` - Grid item
- `ProductCardCompact.tsx` - List view
- `ProductCardHorizontal.tsx` - Cart item
- `ProductGallery.tsx` - Image viewer
- `VariantSelector.tsx` - Chip-based selector
- `QuantityInput.tsx` - +/- buttons
- `PriceDisplay.tsx` - With sale badge
- `StockBadge.tsx` - In stock / low stock
- `RatingStars.tsx` - Visual star rating

#### 3. Form Components (shadcn/ui)

- `Button.tsx` - Primary, secondary, ghost
- `Input.tsx` - Text input with validation
- `Select.tsx` - Dropdown
- `Checkbox.tsx`
- `RadioGroup.tsx`
- `Textarea.tsx`
- `Form.tsx` - React Hook Form wrapper

#### 4. Feedback Components

- `Alert.tsx` - Success, error, warning, info
- `Toast.tsx` - Notifications (using sonner)
- `Modal.tsx` / `Dialog.tsx`
- `ConfirmationDialog.tsx`
- `LoadingSpinner.tsx`
- `SkeletonLoader.tsx` - Loading states
- `EmptyState.tsx` - No results

#### 5. Data Display

- `Table.tsx` - TanStack Table
- `Card.tsx` - Container with shadow
- `Badge.tsx` - Status badges
- `Tabs.tsx` - Tab navigation
- `Accordion.tsx` - Collapsible sections
- `Pagination.tsx`

#### 6. E-Commerce Specific

- `CartBadge.tsx` - Item count bubble
- `FavoriteButton.tsx` - Heart icon
- `ShareButton.tsx` - Social sharing
- `CompareCheckbox.tsx`
- `FilterChip.tsx` - Active filter
- `SortDropdown.tsx`

---

## 🔌 Server Actions Integration Pattern

### React Query Setup

```typescript
// lib/queries/products.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchProducts, getProduct } from "@/app/actions/products";

export const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => searchProducts(filters),
    keepPreviousData: true,
  });
};

export const useProduct = (slug: string) => {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// lib/queries/cart.ts
export const useCart = () => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart(),
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
```

### Component Usage Example

```typescript
// app/products/[slug]/page.tsx
'use client';

import { useProduct } from '@/lib/queries/products';
import { useAddToCart } from '@/lib/queries/cart';
import { ProductGallery } from '@/components/product/ProductGallery';
import { VariantSelector } from '@/components/product/VariantSelector';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { data: product, isLoading } = useProduct(params.slug);
  const addToCartMutation = useAddToCart();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCartMutation.mutate({
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity
    });
  };

  if (isLoading) return <SkeletonLoader />;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <ProductGallery images={product.images} />

      <div>
        <h1>{product.name}</h1>
        <RatingStars rating={product.averageRating} />

        <PriceDisplay
          price={product.price}
          salePrice={product.salePrice}
        />

        {product.has_variants && (
          <VariantSelector
            variants={product.variants}
            selected={selectedVariant}
            onChange={setSelectedVariant}
          />
        )}

        <QuantityInput
          value={quantity}
          onChange={setQuantity}
          max={product.stock_quantity}
        />

        <div className="flex gap-4">
          <Button onClick={handleAddToCart} size="lg">
            Add to Cart
          </Button>
          <Button variant="secondary" size="lg">
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Micro-interactions (Reference: Research 01, Section 4)

### 1. Add to Cart Animation

```typescript
// components/product/AddToCartButton.tsx
const handleClick = async () => {
  // Animate product flying to cart
  const productRect = buttonRef.current.getBoundingClientRect();
  const cartRect = cartRef.current.getBoundingClientRect();

  // Create flying element
  const flyingProduct = document.createElement("div");
  flyingProduct.className = "product-fly-animation";
  // ... GSAP or Framer Motion animation

  await addToCart(product.id);

  // Bounce cart icon
  cartRef.current.classList.add("bounce");
};
```

### 2. Skeleton Loaders

```typescript
// components/ui/ProductSkeleton.tsx
export const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
  </div>
);
```

### 3. Optimistic Updates

```typescript
// lib/queries/cart.ts
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFromCart,
    onMutate: async (cartItemId) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries(["cart"]);

      // Snapshot current cart
      const previousCart = queryClient.getQueryData(["cart"]);

      // Optimistically update
      queryClient.setQueryData(["cart"], (old) => ({
        ...old,
        items: old.items.filter((item) => item.id !== cartItemId),
      }));

      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["cart"], context.previousCart);
      toast.error("Failed to remove item");
    },
    onSettled: () => {
      queryClient.invalidateQueries(["cart"]);
    },
  });
};
```

---

## 📦 Technology Stack

### Frontend Framework

- **Next.js 14+** (App Router)
- **React 18+** (Server + Client Components)
- **TypeScript**

### UI Components

- **shadcn/ui** (Tailwind + Radix)
- **Tailwind CSS**
- **Framer Motion** (Animations)

### State Management

- **TanStack Query** (React Query) - Server state
- **Zustand** - Client state (cart, filters)

### Forms

- **React Hook Form**
- **Zod** (Validation)

### Data Visualization

- **Recharts** or **Chart.js** (Analytics charts)

### Utilities

- **date-fns** - Date formatting
- **clsx** / **cn** - Class merging
- **html5-qrcode** - Barcode scanning
- **react-hot-toast** or **sonner** - Notifications

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

- ✅ Setup Next.js project
- ✅ Configure Tailwind + shadcn/ui
- ✅ Install dependencies
- ✅ Setup React Query
- ✅ Create component library structure
- ✅ Design system (colors, typography)

### Phase 2: Customer Store Core (Week 2-3)

- Homepage with hero + product grids
- Product listing with filters
- Product detail page
- Cart functionality
- User authentication UI

### Phase 3: Checkout & Orders (Week 4)

- Checkout flow
- Order confirmation
- Order tracking
- Payment proof upload
- User profile

### Phase 4: Reviews & Interactions (Week 5)

- Review submission
- Review display
- Rating system
- Helpful votes

### Phase 5: Admin Dashboard (Week 6-7)

- Dashboard overview
- Product management
- Order management
- Payment verification
- User management

### Phase 6: POS System (Week 8)

- POS interface
- Barcode scanning
- Shift management
- Payment processing

### Phase 7: Polish & Optimization (Week 9-10)

- Responsive testing
- Performance optimization
- Accessibility audit
- Dark mode
- Animations

---

## 📚 Next Steps

1. **Read Full Documentation:**
   - [API_REFERENCE.md](API_REFERENCE.md) - All server actions
   - [Research Files](research/) - Design inspirations

2. **Setup Development Environment:**

   ```bash
   npm install
   npm run dev
   ```

3. **Create Component Library:**
   - Start with shadcn/ui components
   - Build custom e-commerce components
   - Setup Storybook (optional)

4. **Implement Pages Systematically:**
   - Start with homepage
   - Move to product pages
   - Then cart/checkout
   - Finally admin dashboard

5. **Test Thoroughly:**
   - Refer to [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
   - Test on real devices
   - Run accessibility checks

---

**Status:** Ready for UI Implementation 🎨

**Next Document:** [COMPONENT_LIBRARY.md] - Detailed component specifications
