# Mobile Responsiveness Strategy

## Research Overview

Comprehensive responsive design strategy for mobile, tablet, and desktop experiences for 13th Vapour Lounge e-commerce system.

---

## 1. Breakpoint Strategy

### Recommended Breakpoints (Tailwind CSS)

```css
/* Mobile First Approach */
/* Default: Mobile (0-639px) */
sm: 640px   /* Small tablets, large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Device Categories

1. **Mobile (320px - 639px)**
   - iPhone SE (375px)
   - iPhone 12/13/14 (390px)
   - Samsung Galaxy S21 (360px)
   - Fold: 280px (edge case)

2. **Tablet (640px - 1023px)**
   - iPad Mini (768px)
   - iPad (810px)
   - iPad Air (820px)
   - iPad Pro (1024px)

3. **Desktop (1024px+)**
   - Laptop (1366px, 1440px)
   - Desktop (1920px)
   - Ultra-wide (2560px+)

---

## 2. Layout Patterns by Device

### 2.1 Header/Navigation

#### Mobile (< 640px)

```
┌─────────────────────────┐
│ ☰  VAPOUR LOUNGE  🛒(2) │ ← Sticky header (56px)
├─────────────────────────┤
│ [  🔍 Search products ] │ ← Search bar
└─────────────────────────┘

Footer:
┌─────┬─────┬─────┬─────┐
│ 🏠  │ 📦  │ 🛒  │ 👤  │ ← Bottom nav (60px)
│Home │Shop │Cart │ Me  │
└─────┴─────┴─────┴─────┘
```

- Hamburger menu (slides from left)
- Sticky header with search
- Bottom navigation (4-5 items max)
- Cart badge shows count

#### Tablet (640px - 1023px)

```
┌────────────────────────────────────┐
│ VAPOUR LOUNGE  [Search]  🛒(2) 👤 │ ← 64px header
├────────────────────────────────────┤
│ Home  Shop  Products  Orders  More │ ← Horizontal tabs
└────────────────────────────────────┘
```

- Horizontal navigation tabs
- Search bar integrated
- No bottom nav (enough vertical space)
- Icons + text labels

#### Desktop (1024px+)

```
┌─────────────────────────────────────────────────────────┐
│ VAPOUR LOUNGE     [ Search products... ]    🛒 Cart  Login │ ← 72px
├─────────────────────────────────────────────────────────┤
│ Home  |  Shop  |  Juice  |  Devices  |  Deals  |  About  │ ← Nav
└─────────────────────────────────────────────────────────┘
```

- Full navigation menu
- Search bar prominent (center)
- User actions right-aligned
- Mega menu on hover (for Shop)

---

### 2.2 Homepage Layout

#### Mobile Layout

```
┌─────────────────────┐
│ [Hero Banner]       │ ← Full width, 16:9 ratio
│ [Swipeable]         │
│ ○ ● ○               │ ← Dots indicator
├─────────────────────┤
│ SHOP BY CATEGORY    │
├─────────────────────┤
│ [🧃]  [📦]  [🎨]   │ ← 3 columns
│ Juice Device Accs   │
├─────────────────────┤
│ ⚡ FLASH SALE       │
│ Ends in: 02:15:43   │
├─────────────────────┤
│ <──────────────>    │ ← Horizontal scroll
│ [Prod] [Prod] [Prod]│
├─────────────────────┤
│ BEST SELLERS        │
├─────────────────────┤
│ ┌────────┬────────┐ │ ← 2 columns grid
│ │ [Prod] │ [Prod] │ │
│ │ [Prod] │ [Prod] │ │
│ └────────┴────────┘ │
└─────────────────────┘
```

- Single column sections
- 2-column product grid
- Horizontal scroll for featured
- Compact card design

#### Tablet Layout

```
┌──────────────────────────────────┐
│ [Hero Banner - Large]            │ ← 21:9 ratio
│ [Swipeable with arrows]          │
├──────────────────────────────────┤
│ SHOP BY CATEGORY                 │
├──────────────────────────────────┤
│ [🧃]  [📦]  [🎨]  [💨]  [🔋]   │ ← 5 columns
│ Juice Device Accs  Coils Battery │
├──────────────────────────────────┤
│ ⚡ FLASH SALE      Ends: 02:15:43│
├─────┬─────┬─────┬─────┬─────────┤
│[Prd]│[Prd]│[Prd]│[Prd]│ [More>] │ ← 4 cols + see more
├──────────────────────────────────┤
│ BEST SELLERS                     │
├───────┬───────┬───────┬──────────┤
│ [Prd] │ [Prd] │ [Prd] │ [Prd]    │ ← 3-4 columns grid
│ [Prd] │ [Prd] │ [Prd] │ [Prd]    │
└───────┴───────┴───────┴──────────┘
```

- 3-4 column product grid
- Category icons in row (5-6 items)
- Larger images
- Arrows for carousel navigation

#### Desktop Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Hero Banner - 2400x800]                                 │
│ <  [Promotional Content]  >  ○●○                         │
├──────────────────────────────────────────────────────────┤
│ SHOP BY CATEGORY                                         │
├───────┬───────┬───────┬───────┬───────┬───────┬──────────┤
│ [🧃] │ [📦] │ [🎨] │ [💨] │ [🔋] │ [🛠️]│  + More   │ ← 8 cols
│ Juice │Device │ Accs  │ Coils │Batter'│ Tools │          │
├──────────────────────────────────┬───────────────────────┤
│ ⚡ FLASH SALE                    │ [Banner Ad]           │
│ Ends in: 02:15:43                │                       │
├────┬────┬────┬────┬────┬────────┤                       │
│[Pr]│[Pr]│[Pr]│[Pr]│[Pr]│ [More]>│                       │
├──────────────────────────────────┴───────────────────────┤
│ BEST SELLERS                          [View All →]       │
├──────┬──────┬──────┬──────┬──────┬──────────────────────┤
│[Prod]│[Prod]│[Prod]│[Prod]│[Prod]│[Prod]                │ ← 5-6 cols
│[Prod]│[Prod]│[Prod]│[Prod]│[Prod]│[Prod]                │
└──────┴──────┴──────┴──────┴──────┴──────────────────────┘
```

- 5-6 column product grid
- Sidebar space for ads/promotions
- Larger carousel
- More categories visible
- "View All" links

---

### 2.3 Product Listing Page (Shop/Category)

#### Mobile

```
┌─────────────────────┐
│ [Filter] [Sort ▼]   │ ← Sticky bar
├─────────────────────┤
│ 🏷️ 3mg  ✕           │ ← Active filters
├─────────────────────┤
│ ┌────────┬────────┐ │
│ │ [Image]│[Image] │ │ ← 2 columns
│ │ Name   │ Name   │ │
│ │ $29.99 │ $34.99 │ │
│ │ ⭐4.5  │ ⭐4.8  │ │
│ ├────────┼────────┤ │
│ │ [Image]│[Image] │ │
│ │ Name   │ Name   │ │
│ └────────┴────────┘ │
│ [Load More]         │
└─────────────────────┘

Filter Modal (Bottom Sheet):
┌─────────────────────┐
│ Filters         [X] │
├─────────────────────┤
│ ▼ Price Range       │
│   [$5 ━━━━●━━ $50] │
│ ▼ Nicotine Level    │
│   ☑ 0mg             │
│   ☑ 3mg             │
│   ☐ 6mg             │
│ ▼ Brand             │
│   ☐ Brand A         │
│   ☐ Brand B         │
├─────────────────────┤
│ [Clear][Apply (23)]│
└─────────────────────┘
```

#### Tablet

```
┌──────────────────────────────────┐
│ Home > Vape Juice                │
│ Vape Juice (142 products)        │
├──────────────────────────────────┤
│ [Filter ▼] [Sort: Featured ▼]   │
├──────────────────────────────────┤
│ ┌──────┬──────┬──────┬──────┐   │
│ │[Img] │[Img] │[Img] │[Img] │   │ ← 3-4 cols
│ │Name  │Name  │Name  │Name  │   │
│ │$29.99│$34.99│$24.99│$39.99│   │
│ │⭐4.5 │⭐4.8 │⭐4.2 │⭐4.9 │   │
│ └──────┴──────┴──────┴──────┘   │
│ [Show 12 more]                   │
└──────────────────────────────────┘
```

#### Desktop (Sidebar Filters)

```
┌───────┬──────────────────────────────────────────────┐
│FILTERS│ Home > Shop > Vape Juice                     │
├───────┤ Vape Juice (142 products)  [Sort: Popular ▼]│
│       ├─────┬─────┬─────┬─────┬─────┬────────────────┤
│ PRICE │[Img]│[Img]│[Img]│[Img]│[Img]│[Img]           │ ← 5-6 cols
│ $─●─$ │Name │Name │Name │Name │Name │Name            │
│       │$29  │$34  │$24  │$39  │$29  │$34             │
│ NICOT │⭐4.5│⭐4.8│⭐4.2│⭐4.9│⭐4.5│⭐4.8           │
│ ☑ 0mg ├─────┼─────┼─────┼─────┼─────┼────────────────┤
│ ☑ 3mg │[Img]│[Img]│[Img]│[Img]│[Img]│[Img]           │
│ ☐ 6mg │     │     │     │     │     │                │
│       │     │     │     │     │     │                │
│ BRAND ├─────┴─────┴─────┴─────┴─────┴────────────────┤
│ ☐ A   │ ← Previous  [1] 2 3 ... 12  Next →          │
│ ☐ B   │                                               │
└───────┴───────────────────────────────────────────────┘
```

---

### 2.4 Product Detail Page

#### Mobile

```
┌─────────────────────┐
│ ← Back     🔍 ♡ 🔗  │ ← Sticky header
├─────────────────────┤
│ [Product Image]     │ ← Full width
│ ○●○○○               │ ← Image dots
├─────────────────────┤
│ Product Name        │
│ ⭐⭐⭐⭐⭐ 4.8 (234)│
│                     │
│ $29.99  ~~$39.99~~  │ ← Large price
│ Save $10 (25% off)  │
│                     │
│ SELECT NICOTINE:    │
│ [0mg][3mg][6mg][12mg]│ ← Chips
│                     │
│ SELECT FLAVOR:      │
│ ▼ Strawberry        │ ← Dropdown
│                     │
│ QUANTITY:           │
│ [ - ]  1  [ + ]     │
│ 47 in stock         │
├─────────────────────┤
│ [🛒 Add to Cart]    │ ← Sticky at bottom
│ [ Buy Now ]         │
├─────────────────────┤
│ ▼ Description       │ ← Accordion
│ ▼ Specifications    │
│ ▼ Shipping Info     │
├─────────────────────┤
│ CUSTOMER REVIEWS    │
│ [★★★★★] 4.8/5      │
│ ──────────────────  │
│ [Review Card]       │
│ [Review Card]       │
│ [See All Reviews]   │
├─────────────────────┤
│ YOU MAY ALSO LIKE   │
│ <─────────────────> │
│ [Prod][Prod][Prod]  │ ← Horizontal scroll
└─────────────────────┘
```

#### Tablet

```
┌──────────────────────────────────┐
│ Home > Juice > [Product Name]    │
├──────────────────────────────────┤
│ ┌─────────┐ Product Name         │
│ │ [Image] │ ⭐⭐⭐⭐⭐ 4.8 (234)  │
│ │ [Thumb] │                      │
│ │ [Thumb] │ $29.99  ~~$39.99~~   │
│ │ [Thumb] │ 25% OFF              │
│ └─────────┘                      │
│             SELECT NICOTINE:     │
│             [0mg][3mg][6mg][12mg]│
│             SELECT FLAVOR:       │
│             [Straw][Mango][Mint] │
│             QTY: [-] 1 [+]       │
│             47 in stock          │
│             [🛒 Add] [Buy Now]   │
├──────────────────────────────────┤
│ [Description Tab][Specs][Reviews]│
│ [Content Area]                   │
├──────────────────────────────────┤
│ RELATED PRODUCTS                 │
│ ┌─────┬─────┬─────┬─────┐       │
│ │[Prd]│[Prd]│[Prd]│[Prd]│       │
│ └─────┴─────┴─────┴─────┘       │
└──────────────────────────────────┘
```

#### Desktop (Two Column)

```
┌─────────────────┬────────────────────────────────────────┐
│                 │ Product Name - Full Description Here   │
│   [Main Image]  │ ⭐⭐⭐⭐⭐ 4.8 (234 reviews)            │
│   1200x1200px   │                                        │
│                 │ $29.99  ~~$39.99~~  [25% OFF]          │
│   ┌───┬───┬───┐ │                                        │
│   │[T]│[T]│[T]│ │ SELECT NICOTINE LEVEL:                 │
│   └───┴───┴───┘ │ ( ) 0mg  (●) 3mg  ( ) 6mg  ( ) 12mg   │
│   [More Images] │                                        │
│                 │ SELECT FLAVOR:                         │
│   [♡ Wishlist]  │ [Strawberry ▼]                         │
│   [🔗 Share]    │ • Strawberry Kiwi                      │
│                 │ • Mango Tango                          │
│                 │ • Cool Mint                            │
│                 │                                        │
│                 │ QUANTITY:  [ - ]  1  [ + ]             │
│                 │ ✓ 47 in stock                          │
│                 │                                        │
│                 │ [🛒 Add to Cart]  [⚡ Buy Now]         │
│                 │                                        │
│                 │ ✓ Free shipping over $50               │
│                 │ ✓ Age verification required            │
├─────────────────┴────────────────────────────────────────┤
│ [Description] [Specifications] [Shipping] [Reviews]      │
│ ──────────────────────────────────────────────────────   │
│ Lorem ipsum description of the product...                │
├──────────────────────────────────────────────────────────┤
│ CUSTOMER REVIEWS (234)          [Write Review]           │
│ 4.8 out of 5  ─────────                                  │
│ 5★ ████████████████████░░ 80%                            │
│ 4★ ████████░░░░░░░░░░░░░ 15%                            │
│ ...                                                       │
│ ─────────────────────────────────────────                │
│ [Review Card with avatar, rating, text, helpful votes]   │
│ [Review Card]                                             │
│ [Load More Reviews]                                       │
├──────────────────────────────────────────────────────────┤
│ YOU MAY ALSO LIKE                            [View All]  │
│ ┌──────┬──────┬──────┬──────┬──────┬──────┐             │
│ │[Prod]│[Prod]│[Prod]│[Prod]│[Prod]│[Prod]│             │
│ └──────┴──────┴──────┴──────┴──────┴──────┘             │
└──────────────────────────────────────────────────────────┘
```

---

### 2.5 Shopping Cart

#### Mobile

```
┌─────────────────────┐
│ ← Cart (3 items)    │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ [Img] Product   │ │
│ │       $29.99    │ │
│ │       3mg Nicot │ │
│ │       [-] 2 [+] │ │
│ │       🗑️ Remove  │ │
│ ├─────────────────┤ │
│ │ [Img] Product   │ │
│ │       $34.99    │ │
│ └─────────────────┘ │
│─────────────────────│
│ [Promo Code ▼]     │
├─────────────────────┤
│ Subtotal:    $94.97 │
│ Shipping:     $5.00 │
│ Tax:          $5.00 │
│ ────────────────────│
│ Total:      $104.97 │
├─────────────────────┤
│ [Proceed to Checkout]│ ← Sticky
└─────────────────────┘
```

#### Tablet/Desktop

```
┌──────────────────────────────┬─────────────────┐
│ Shopping Cart (3 items)      │ Order Summary   │
├──────────────────────────────┤                 │
│ ┌────┬──────────────┬───────┐│ Subtotal: $94.97│
│ │[Img]│Product Name  │$29.99 ││ Shipping:  $5.00│
│ │    │3mg, Strawberry│       ││ Tax:       $5.00│
│ │    │[-] 2 [+]  🗑️ │       ││ ─────────────── │
│ ├────┼──────────────┼───────┤│ Total:   $104.97│
│ │[Img]│Product Name  │$34.99 ││                 │
│ │    │6mg, Mango    │       ││ [Promo Code?]   │
│ │    │[-] 1 [+]  🗑️ │       ││                 │
│ └────┴──────────────┴───────┘│ [Checkout]      │
│                               │                 │
│ [Continue Shopping]           │ 🔒 Secure       │
└──────────────────────────────┴─────────────────┘
```

---

### 2.6 Checkout Flow

#### Mobile (Single Page)

```
┌─────────────────────┐
│ Checkout      [1/3] │ ← Progress
├─────────────────────┤
│ 📧 CONTACT INFO     │
│ [Email]             │
│ [Phone]             │
├─────────────────────┤
│ 📍 SHIPPING ADDRESS │
│ [Full Name]         │
│ [Address Line 1]    │
│ [City] [ZIP]        │
│ [Country ▼]         │
│ ☑ Save address      │
├─────────────────────┤
│ 💳 PAYMENT METHOD   │
│ ( ) Upload Receipt  │
│ ( ) Cash on Delivery│
├─────────────────────┤
│ 📦 ORDER SUMMARY    │
│ Subtotal:    $94.97 │
│ Shipping:     $5.00 │
│ Total:      $104.97 │
├─────────────────────┤
│ [Place Order]       │ ← Sticky
└─────────────────────┘
```

#### Desktop (Multi-Column)

```
┌────────────────────────────────┬──────────────────┐
│ Checkout                       │ Order Summary    │
│ ●──────●──────○ Complete       │ ┌──────────────┐ │
│ Contact Shipping Payment       │ │[Img] Product │ │
├────────────────────────────────┤ │      x2      │ │
│ 📧 CONTACT INFORMATION         │ │      $59.98  │ │
│ ┌────────────┬────────────────┐│ ├──────────────┤ │
│ │[Email]     │[Phone]         ││ │[Img] Product │ │
│ └────────────┴────────────────┘│ │      x1      │ │
│                                 │ │      $34.99  │ │
│ 📍 SHIPPING ADDRESS            │ └──────────────┘ │
│ [Full Name]                     │                  │
│ [Address Line 1]                │ Subtotal: $94.97 │
│ [Address Line 2]                │ Shipping:  $5.00 │
│ ┌──────┬──────┬───────────────┐│ Tax:       $5.00 │
│ │[City]│[ZIP] │[Country ▼]    ││ ─────────────── │
│ └──────┴──────┴───────────────┘│ Total:   $104.97 │
│ ☑ Save this address             │                  │
│ ☑ Billing same as shipping      │ [Apply Promo]    │
│                                 │                  │
│ 💳 PAYMENT METHOD              │ [Place Order]    │
│ [Payment options...]            │ 🔒 Secure        │
└────────────────────────────────┴──────────────────┘
```

---

### 2.7 Admin Dashboard

#### Mobile

```
┌─────────────────────┐
│ ☰ Dashboard  🔔(3) │
├─────────────────────┤
│ ┌─────────────────┐ │
│ │ Revenue Today   │ │
│ │ $2,345          │ │
│ │ ↑ 12.5%         │ │
│ ├─────────────────┤ │
│ │ Orders          │ │
│ │ 47              │ │
│ │ ↑ 8.2%          │ │
│ ├─────────────────┤ │
│ │ Low Stock       │ │
│ │ 12 items        │ │
│ │ ⚠️               │ │
│ └─────────────────┘ │
├─────────────────────┤
│ RECENT ORDERS       │
│ ┌─────────────────┐ │
│ │ #ORD-001        │ │
│ │ John Doe        │ │
│ │ $124.99         │ │
│ │ [Pending]       │ │
│ ├─────────────────┤ │
│ │ #ORD-002        │ │
│ │ Jane Smith      │ │
│ │ $89.50          │ │
│ │ [Paid]          │ │
│ └─────────────────┘ │
└─────────────────────┘
```

#### Tablet/Desktop

```
┌────────┬────────────────────────────────────────────────┐
│ LOGO   │ Dashboard                    🔔(3) 👤 Admin   │
├────────┼────────────────────────────────────────────────┤
│        │ ┌──────────┬──────────┬──────────┬──────────┐ │
│ 🏠 Dash│ │ Revenue  │ Orders   │ Customers│ Products │ │
│ 📦 Prod│ │ $12,345  │ 247      │ 1,234    │ 156      │ │
│ 📋 Ord │ │ ↑ 12.5%  │ ↑ 8.2%   │ ↑ 5.1%  │ → 0%     │ │
│ 📊 Inv │ └──────────┴──────────┴──────────┴──────────┘ │
│ 💰 POS │                                                │
│ 👥 Cust│ ┌─────────────────────────────────┐           │
│ 📈 Rep │ │ Sales Chart (Last 7 Days)       │           │
│ ⚙️ Set │ │ [Line chart visualization]      │           │
│        │ └─────────────────────────────────┘           │
│ ───    │                                                │
│ 👤 Prof│ RECENT ORDERS                    [View All >] │
│ 🚪 Out │ ┌────┬──────┬────────┬─────────┬────────────┐ │
│        │ │ ID │ Cust │ Amount │ Status  │ Action     │ │
│        │ ├────┼──────┼────────┼─────────┼────────────┤ │
│        │ │001 │ John │ $124.99│ Pending │ [Process]  │ │
│        │ │002 │ Jane │  $89.50│ Paid    │ [Ship]     │ │
│        │ └────┴──────┴────────┴─────────┴────────────┘ │
└────────┴────────────────────────────────────────────────┘
```

---

## 3. Responsive Component Patterns

### 3.1 Product Grid

```typescript
// Responsive grid classes
const gridClasses = {
  mobile: "grid-cols-2",      // 2 columns on mobile
  tablet: "md:grid-cols-3",   // 3 columns on tablet
  desktop: "lg:grid-cols-5"   // 5 columns on desktop
}

// Usage
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
  {products.map(product => <ProductCard key={product.id} {...product} />)}
</div>
```

### 3.2 Image Sizing

```typescript
// Responsive images using Next.js Image
<Image
  src={product.image}
  alt={product.name}
  width={600}
  height={600}
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
  className="w-full h-auto"
/>
```

### 3.3 Typography Scale

```css
/* Mobile first, scale up */
.heading-1 {
  font-size: 1.875rem; /* 30px mobile */
}

@media (min-width: 768px) {
  .heading-1 {
    font-size: 2.25rem; /* 36px tablet */
  }
}

@media (min-width: 1024px) {
  .heading-1 {
    font-size: 3rem; /* 48px desktop */
  }
}
```

### 3.4 Spacing

```css
/* Container padding */
.container {
  padding-left: 1rem; /* 16px mobile */
  padding-right: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding-left: 2rem; /* 32px tablet */
    padding-right: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    padding-left: 4rem; /* 64px desktop */
    padding-right: 4rem;
  }
}
```

---

## 4. Touch & Interaction Patterns

### Mobile Optimizations

**Touch Targets**

- Minimum 44x44px (Apple) / 48x48px (Android)
- Increase padding on clickable elements
- Add space between adjacent interactive elements

```css
/* Mobile button */
.btn-mobile {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.5rem;
}
```

**Swipe Gestures**

- Swipe to delete cart items
- Swipe between product images
- Pull to refresh (order lists)

**Prevent Zoom Issues**

```html
<!-- Prevent form zoom on iOS -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1"
/>

<!-- But allow pinch zoom on images -->
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

**Input Keyboards**

```html
<!-- Numeric keyboard for phone -->
<input type="tel" inputmode="numeric" pattern="[0-9]*" />

<!-- Email keyboard -->
<input type="email" inputmode="email" />

<!-- Decimal for prices -->
<input type="number" inputmode="decimal" />
```

---

## 5. Performance Optimizations by Device

### Mobile

- Lazy load images below fold
- Use WebP with fallback
- Minimize JavaScript bundle
- Defer non-critical CSS
- Use mobile-optimized images (smaller)

```typescript
// Responsive image loading
<Image
  src={product.image}
  loading="lazy"  // Below fold
  priority={false} // Not LCP image
  quality={75}    // Lower quality for mobile
/>
```

### Tablet

- Balance between mobile and desktop assets
- Load medium-sized images
- Enable some desktop features

### Desktop

- Load full-resolution images
- Enable hover effects
- Parallel requests for data
- Preload critical resources

---

## 6. Testing Checklist

### Devices to Test

- [ ] iPhone SE (smallest common screen)
- [ ] iPhone 14 Pro (current standard)
- [ ] Samsung Galaxy S21
- [ ] iPad (10.2")
- [ ] iPad Pro (12.9")
- [ ] MacBook Air (13")
- [ ] iMac (24")

### Orientations

- [ ] Portrait (mobile/tablet)
- [ ] Landscape (mobile/tablet)
- [ ] Horizontal folds

### Browsers

- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)

### Test Scenarios

- [ ] Navigate using keyboard only
- [ ] Navigate using screen reader
- [ ] Zoom to 200% (accessibility)
- [ ] Slow 3G connection
- [ ] Offline mode (service worker)

---

## 7. Responsive Data Tables

### Mobile (Cards)

```
┌─────────────────────┐
│ Order #ORD-001      │
│ ──────────────────  │
│ Customer: John Doe  │
│ Amount: $124.99     │
│ Status: Pending     │
│ Date: Jan 15, 2026  │
│ [View Details]      │
├─────────────────────┤
│ Order #ORD-002      │
│ ──────────────────  │
│ ...                 │
└─────────────────────┘
```

### Tablet/Desktop (Table)

```
┌────┬──────┬────────┬─────────┬──────────┬────────┐
│ ID │ Cust │ Amount │ Status  │ Date     │ Action │
├────┼──────┼────────┼─────────┼──────────┼────────┤
│001 │ John │$124.99 │ Pending │ Jan 15   │ [View] │
│002 │ Jane │ $89.50 │ Paid    │ Jan 15   │ [View] │
└────┴──────┴────────┴─────────┴──────────┴────────┘
```

---

## 8. Implementation with Tailwind

### Example: Responsive Product Card

```tsx
function ProductCard({ product }) {
  return (
    <div
      className="
      bg-white rounded-lg shadow-md overflow-hidden
      flex flex-col
      hover:shadow-lg transition-shadow
    "
    >
      {/* Image Container */}
      <div className="relative aspect-square">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
            -{product.discount}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        {/* Product Name - 2 lines max */}
        <h3
          className="
          text-sm md:text-base font-medium
          line-clamp-2 mb-2
          min-h-[2.5rem] md:min-h-[3rem]
        "
        >
          {product.name}
        </h3>

        {/* Rating - hide on small mobile */}
        <div className="hidden xs:flex items-center gap-1 mb-2">
          <StarRating value={product.rating} />
          <span className="text-xs text-gray-500">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold text-primary">
              ${product.price}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          className="
          mt-3 w-full
          bg-primary text-white
          py-2 md:py-3 
          rounded-md
          text-sm md:text-base
          font-medium
          hover:bg-primary-600
          transition-colors
          active:scale-95
        "
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

---

## 9. Common Responsive Patterns

### Container Widths

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### Show/Hide by Breakpoint

```tsx
{
  /* Show on mobile only */
}
<div className="block md:hidden">Mobile Menu</div>;

{
  /* Show on tablet and above */
}
<div className="hidden md:block">Desktop Nav</div>;

{
  /* Show on desktop only */
}
<div className="hidden lg:block">Large Screen Feature</div>;
```

### Responsive Flexbox

```tsx
{
  /* Stack on mobile, row on desktop */
}
<div className="flex flex-col md:flex-row gap-4">
  <div className="md:w-2/3">Main Content</div>
  <div className="md:w-1/3">Sidebar</div>
</div>;
```

---

## 10. Key Recommendations

### For 13th Vapour Lounge Implementation:

1. **Mobile-First Development**
   - Design and code for mobile first
   - Enhance progressively for larger screens
   - Test on real devices early and often

2. **Breakpoint Strategy**
   - Use standard Tailwind breakpoints
   - Keep layouts simple (2 col → 3 col → 5 col)
   - Avoid too many breakpoints (3-4 max)

3. **Touch-Friendly**
   - 44px minimum touch targets
   - Ample spacing between interactive elements
   - Swipe gestures for common actions

4. **Performance**
   - Lazy load images below fold
   - Use appropriate image sizes per breakpoint
   - Minimize JS bundle with code splitting

5. **Component Approach**
   - Build responsive components, not responsive pages
   - Use consistent patterns across app
   - Test components in isolation (Storybook)

6. **Navigation**
   - Bottom nav for mobile (customer app)
   - Collapsible sidebar for desktop (admin)
   - Breadcrumbs for context

7. **Data Display**
   - Cards on mobile
   - Tables on desktop
   - Maintain data hierarchy across devices

---

## Next Steps

1. Create component library with responsive variants
2. Build mobile layouts first in Figma/design tool
3. Implement using Tailwind responsive classes
4. Test on real devices (not just browser resize)
5. Performance audit with Lighthouse (mobile)
6. Get user feedback on usability

---

## Tools & Resources

- **Chrome DevTools**: Device emulation
- **Responsively App**: Multi-device preview
- **BrowserStack**: Real device testing
- **Lighthouse**: Performance auditing
- **Am I Responsive**: Quick mockups
- **Polypane**: Responsive design browser
