# E-Commerce Design Inspirations

## Research Overview

Analysis of successful e-commerce platforms to identify UI/UX patterns for Vapour Lounge.

---

## 1. Shopee - Leading E-Commerce Platform

### Key Design Elements

**Homepage**

- **Hero Banner Carousel**: Auto-rotating promotional banners with dots navigation
- **Category Icons Grid**: Quick access to main categories (8-12 icons visible)
- **Flash Sales Section**: Countdown timer, horizontal scroll of products
- **Daily Discover**: Infinite scroll grid of products (2 columns mobile, 4+ desktop)
- **Sticky Bottom Navigation**: Home, Categories, Cart, Profile (mobile)
- **Floating Cart Badge**: Shows item count, follows user while scrolling

**Color Psychology**

- Primary: Orange (#EE4D2D) - Creates urgency, encourages action
- Secondary: White (#FFFFFF) - Clean, professional
- Accent: Red for sales/discounts - Attracts attention
- Neutral: Light gray backgrounds (#F5F5F5) - Reduces eye strain

**Product Cards**

- Square product image (1:1 ratio)
- Product name (2 lines max, truncated)
- Price (bold, larger font)
- Original price (strikethrough if on sale)
- Discount badge (top-left corner)
- "Sold X" social proof
- Star rating + review count
- "Free Shipping" tag (if applicable)

**Navigation**

- Mega menu for desktop (categorized)
- Hamburger menu for mobile
- Search bar prominent at top
- Filter/Sort always visible when browsing

### Inspirations for Vapour Lounge

✓ Use countdown timers for limited-time promotions
✓ Show "X sold today" for popular products
✓ Implement horizontal scrolling for featured categories
✓ Add tags: "New Arrival", "Best Seller", "Low Stock"
✓ Sticky header with cart on mobile

---

## 2. Lazada - Southeast Asia E-Commerce

### Key Design Elements

**Product Detail Page (PDP)**

- Large image gallery (swipeable, zoomable)
- Image thumbnails below main image
- Variant selector (visual chips for colors, dropdown for sizes)
- Quantity +/- buttons
- "Add to Cart" vs "Buy Now" dual CTAs
- Shipping calculator by postal code
- Product specifications table
- Customer reviews section
- "You May Also Like" recommendations

**Cart Experience**

- Checkbox to select items
- Quantity adjustment inline
- Delete/Save for later options
- Auto-calculated subtotal
- Voucher/promo code input
- Delivery address selection
- Payment method selection
- Order summary sidebar (sticky on desktop)

**Checkout Flow**

- Single-page checkout (all steps visible)
- Progress indicator (Address → Payment → Review)
- Auto-save form data
- Real-time validation
- Order confirmation with tracking number

### Inspirations for Vapour Lounge

✓ Variant selector for nicotine levels & flavors (visual chips)
✓ Dual CTA buttons: "Add to Cart" + "Buy Now"
✓ Collapsible product specifications
✓ Smart checkout with auto-fill from profile
✓ Order summary sticky sidebar

---

## 3. Amazon - Global E-Commerce Leader

### Key Design Elements

**Search & Discovery**

- Advanced filters (multi-select)
- Sort options: Relevance, Price, Rating, Newest
- Filter chips (active filters) with X to remove
- Results count: "1-48 of 500+ results"
- Sponsored products clearly labeled

**Product Listings**

- List view vs Grid view toggle
- Quick view on hover (desktop)
- "Amazon's Choice" badge
- Prime shipping indicator
- "Get it by [date]" promise
- Compare checkbox

**Reviews System**

- Star rating breakdown (5★: 60%, 4★: 20%, etc.)
- Verified purchase badge
- Helpful votes (upvote/downvote)
- Filter by star rating
- Sort: Most Recent, Top Reviews, Most Helpful
- Customer images in reviews
- "Ask a question" section

### Inspirations for Vapour Lounge

✓ Multi-select filters (brand, nicotine level, flavor profile)
✓ Star rating distribution visualization
✓ Verified purchase badge on reviews
✓ "Staff Pick" or "Best Value" badges
✓ Expected delivery date display

---

## 4. Dribbble - Design Inspiration Shots

### Top E-Commerce UI Trends (2024-2026)

**Modern Aesthetics**

1. **Glassmorphism**: Frosted glass effect for cards/modals
   - Semi-transparent backgrounds
   - Subtle blur effects
   - Light borders

2. **3D Product Renders**: Interactive 360° views
   - Drag to rotate product
   - Zoom on click
   - AR preview (mobile)

3. **Micro-interactions**: Delightful animations
   - Add to cart: Product flies into cart icon
   - Like button: Heart animation
   - Loading states: Skeleton screens
   - Hover effects: Slight lift + shadow

4. **Dark Mode**: Toggle for user preference
   - System auto-detect
   - Smooth transition
   - Adjusted color palette

5. **Neomorphism/Soft UI**: Subtle shadows and highlights
   - Used sparingly for key actions
   - Accessible color contrast maintained

**Layout Patterns**

- **Bento Grid**: Asymmetric grid layout for featured products
- **Card-Based Design**: Everything in cards (shadows, rounded corners)
- **Generous Whitespace**: Breathing room between elements
- **F-Pattern Layout**: Content arranged for natural eye movement
- **Sticky Elements**: Header, filters, "Add to Cart" button

**Typography**

- **Heading Hierarchy**: Clear size differentiation (H1: 32px → H6: 14px)
- **Font Pairings**:
  - Modern: Inter + Inter (weights)
  - Classic: Playfair Display + Source Sans Pro
  - Techy: Space Grotesk + DM Sans
- **Readable Body Text**: 16px minimum, 1.5-1.7 line height

### Inspirations for Vapour Lounge

✓ Implement glassmorphism for modal dialogs
✓ Add micro-interactions for cart actions
✓ Use skeleton loaders during data fetch
✓ Support dark mode (especially for admin panel)
✓ Bento grid for homepage featured section

---

## 5. Behance - E-Commerce Project Studies

### Case Study: Modern Vape Shop UI

**Color Schemes for Vape Industry**

1. **Modern Minimal**
   - Primary: Deep Purple (#6366F1)
   - Secondary: Cyan (#06B6D4)
   - Accent: Electric Blue (#3B82F6)
   - Neutral: Slate grays

2. **Bold & Vibrant** (Recommended for Vapour Lounge)
   - Primary: Gradient (Purple to Pink)
   - Secondary: Bright Orange (#F97316)
   - Accent: Lime Green (#84CC16)
   - Background: Dark navy (#0F172A) for contrast

3. **Clean & Trustworthy**
   - Primary: Navy Blue (#1E40AF)
   - Secondary: Gold (#F59E0B)
   - Accent: Teal (#14B8A6)
   - Neutral: Warm grays

**Category Page Best Practices**

- Sidebar filters (desktop) / Bottom sheet (mobile)
- Filter by: Brand, Price Range, Nicotine Level, Flavor Profile, In Stock
- Active filter pills at top (removable)
- "Clear All" filters button
- Results count updates in real-time
- Sort dropdown: Featured, Price Low-High, Newest, Name A-Z
- Grid density: 2 cols (mobile), 3 cols (tablet), 4-5 cols (desktop)

**Product Detail Page Layout**

```
[Desktop Layout]
┌────────────────────────────────────────┐
│ Breadcrumb: Home > Vape Juice > [Name] │
├─────────────────┬──────────────────────┤
│                 │ Product Name          │
│  Image Gallery  │ Star Rating (X reviews)│
│  [Main Image]   │ Price (was $XX)       │
│  [Thumb][Thumb] │                       │
│  [Thumb][Thumb] │ Variant Selector:     │
│                 │ [Nicotine] [Flavor]   │
│                 │ Quantity: [- 1 +]     │
│                 │ [Add to Cart] [Buy]   │
│                 │ ──────────────────    │
│                 │ Description           │
│                 │ Specifications        │
├─────────────────┴──────────────────────┤
│ Customer Reviews                        │
│ Related Products                        │
└────────────────────────────────────────┘
```

### Inspirations for Vapour Lounge

✓ Use gradient purple-to-pink theme for premium feel
✓ Implement sidebar filters with live count updates
✓ Show variant chips (not dropdowns) for better UX
✓ Breadcrumb navigation for easy backtracking

---

## 6. Mobile-First E-Commerce Apps

### UI Patterns from Top Apps

**Bottom Navigation (Mobile)**

```
┌────────────────────────────┐
│                            │
│     [Content Area]         │
│                            │
└────┬─────┬─────┬─────┬────┘
     │Home │Cat  │Cart │Me  │
     └─────┴─────┴─────┴────┘
```

Icons + Labels (5 max)

1. Home
2. Categories / Shop
3. Cart (with badge)
4. Orders / Activity
5. Profile / Account

**Swipe Gestures**

- Swipe product cards to "favorite"
- Swipe in cart to delete item
- Swipe between product images
- Pull-to-refresh for updated content

**Thumb-Friendly Zones**

- Action buttons at bottom 1/3 of screen
- Important content in center
- Avoid top corners for critical actions

**Speed Optimizations**

- Progressive image loading (blur-up)
- Lazy load below-fold content
- Optimistic UI updates (instant feedback)
- Cache frequently accessed data

### Inspirations for Vapour Lounge

✓ Bottom nav for customer mobile app
✓ Swipe to delete in cart
✓ Pull-to-refresh on orders page
✓ Optimistic UI for "Add to Cart"

---

## 7. Admin Dashboard Inspirations

### Reference: Tailwind UI, Shadcn Examples

**Dashboard Layout**

```
┌──────────────────────────────────────┐
│  Logo    [Search]    [Notifications] │ ← Header (60px)
├─────────┬────────────────────────────┤
│ Nav     │  Dashboard Content         │
│         │                            │
│ • Home  │  [KPI Cards Row]           │
│ • Prod  │  ┌───┬───┬───┬───┐        │
│ • Ord   │  │Rev│Ord│Cst│Itm│        │
│ • Inv   │  └───┴───┴───┴───┘        │
│ • Rep   │                            │
│         │  [Chart Area]              │
│         │  [Recent Orders Table]     │
└─────────┴────────────────────────────┘
```

**Sidebar Navigation**

- Collapsible sidebar (hamburger toggle)
- Icon + text (expanded) / Icon only (collapsed)
- Active state: Background highlight + border accent
- Grouped navigation: Sections with headers
- Tooltips on icon-only mode

**Data Tables**

- Sticky header row
- Row hover highlight
- Action menu (3-dot kebab)
- Pagination (showing X-Y of Z)
- Multi-select with bulk actions
- Column sorting (asc/desc indicators)
- Column filtering (icon in header)
- Responsive: Cards on mobile

**Forms**

- Inline validation (real-time)
- Success/error states with icons
- Help text below inputs
- Required field indicators (\*)
- Multi-step forms with progress bar
- Auto-save drafts

### Inspirations for Vapour Lounge

✓ Collapsible sidebar for admin/staff
✓ KPI cards on dashboard (sales, orders, low stock)
✓ Data tables with sorting/filtering
✓ Inline form validation
✓ Mobile: Hamburger menu + cards instead of tables

---

## 8. Accessibility Best Practices

### WCAG 2.1 AA Compliance

**Color Contrast**

- Text on background: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 against adjacent colors
- Test all color combinations

**Keyboard Navigation**

- Tab order follows visual flow
- Focus indicators visible (outline ring)
- Skip to main content link
- Escape closes modals
- Arrow keys for sliders/carousels

**Screen Reader Support**

- Semantic HTML (header, nav, main, footer)
- ARIA labels for icons
- Alt text for images (descriptive, not "image of")
- Form labels properly associated
- Loading states announced

**Motion & Animation**

- Respect prefers-reduced-motion
- Disable auto-play carousels option
- Provide pause/stop controls
- No flashing content (seizure risk)

### Inspirations for Vapour Lounge

✓ Test all colors with contrast checker
✓ Ensure keyboard-only navigation works
✓ Add ARIA labels to icon buttons
✓ Respect reduced motion preferences

---

## 9. Recommended Design System for Vapour Lounge

### Color Palette

```css
/* Primary - Purple Gradient */
--primary-500: #8b5cf6; /* Vibrant purple */
--primary-600: #7c3aed;
--primary-700: #6d28d9;

/* Secondary - Cyan/Teal */
--secondary-500: #06b6d4;
--secondary-600: #0891b2;

/* Accent - Orange (for CTAs) */
--accent-500: #f97316;
--accent-600: #ea580c;

/* Success/Error/Warning */
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;

/* Neutrals */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-900: #111827;

/* Dark Mode */
--dark-bg: #0f172a;
--dark-surface: #1e293b;
```

### Typography Scale

```css
/* Font Family */
--font-sans: "Inter", system-ui, sans-serif;
--font-display: "Bricolage Grotesque", sans-serif; /* For headings */

/* Sizes (fluid with clamp) */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### Spacing System (8px base)

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

### Border Radius

```css
--radius-sm: 0.25rem; /* 4px - inputs */
--radius-md: 0.5rem; /* 8px - cards */
--radius-lg: 0.75rem; /* 12px - modals */
--radius-xl: 1rem; /* 16px - images */
--radius-full: 9999px; /* circular */
```

### Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
```

---

## 10. UI Component Checklist

### Essential Components Needed

**Navigation & Layout**

- [ ] App Header (with search, cart, profile)
- [ ] Breadcrumb navigation
- [ ] Sidebar navigation (admin)
- [ ] Bottom tab bar (mobile)
- [ ] Footer with links

**Product Display**

- [ ] Product card (grid/list view)
- [ ] Product image gallery (zoom, thumbnails)
- [ ] Variant selector (chips)
- [ ] Price display (original + sale)
- [ ] "Add to Cart" button (with animations)
- [ ] Quantity stepper (+/-)
- [ ] Stock indicator
- [ ] Rating stars (display & input)

**Forms & Inputs**

- [ ] Text input (with validation states)
- [ ] Textarea
- [ ] Select dropdown
- [ ] Multi-select
- [ ] Checkbox & Radio
- [ ] Toggle switch
- [ ] Date picker
- [ ] File upload (drag & drop)
- [ ] Search with autocomplete

**Data Display**

- [ ] Data table (sortable, filterable)
- [ ] Empty state (no results)
- [ ] Loading skeleton
- [ ] Pagination
- [ ] Tabs
- [ ] Accordion
- [ ] Badge & Tag
- [ ] Avatar
- [ ] Statistics card (KPI)

**Feedback**

- [ ] Toast notifications
- [ ] Alert banner
- [ ] Confirmation modal
- [ ] Progress bar
- [ ] Spinner/Loading indicator
- [ ] Error page (404, 500)

**Shopping Experience**

- [ ] Cart drawer (slide-out)
- [ ] Wishlist button (heart)
- [ ] Comparison table
- [ ] Size guide modal
- [ ] Review form
- [ ] Review list
- [ ] Order timeline (stepper)
- [ ] Checkout progress

**Admin/POS Specific**

- [ ] Dashboard KPI cards
- [ ] Chart components (line, bar, pie)
- [ ] Calendar view
- [ ] Timeline activity feed
- [ ] Settings panel
- [ ] User role badge
- [ ] Quick action buttons
- [ ] Bulk select toolbar

---

## Resources & References

### Design Inspiration Sites

1. **Dribbble** - https://dribbble.com/tags/ecommerce
2. **Behance** - https://www.behance.net/search/projects?search=ecommerce
3. **Mobbin** - https://mobbin.com (mobile UI patterns)
4. **Land-book** - https://land-book.com/ecommerce
5. **Awwwards** - https://www.awwwards.com/websites/e-commerce/

### E-Commerce Examples to Study

1. Shopee - https://shopee.ph
2. Lazada - https://www.lazada.com.ph
3. Amazon - https://www.amazon.com
4. Element Vape - https://www.elementvape.com (vape-specific)
5. VaporFi - https://www.vaporfi.com (vape-specific)

### Component Libraries

1. Shadcn UI - https://ui.shadcn.com
2. Tailwind UI - https://tailwindui.com
3. Headless UI - https://headlessui.com
4. Radix UI - https://www.radix-ui.com

### Tools

1. Contrast Checker - https://webaim.org/resources/contrastchecker/
2. Coolors - https://coolors.co (color palettes)
3. Figma - For prototyping before coding

---

## Key Takeaways for Implementation

### Must-Have Features

1. **Mobile-first design** - Majority of users will shop on mobile
2. **Fast page loads** - Use Next.js Image optimization, lazy loading
3. **Clear CTAs** - "Add to Cart" and "Buy Now" always visible
4. **Trust signals** - Reviews, ratings, "Verified Purchase", stock levels
5. **Easy navigation** - Breadcrumbs, filters, search
6. **Visual hierarchy** - Use size, color, spacing to guide attention
7. **Consistent patterns** - Same components behave the same way
8. **Accessibility** - Keyboard navigation, screen readers, contrast

### Design Priorities

1. **Clarity over cleverness** - Users should never be confused
2. **Speed over flash** - Fast interaction > fancy animations
3. **Mobile over desktop** - Design for thumb, then enhance for mouse
4. **Content over chrome** - Product images dominate, UI fades back

### Next Steps

1. Use this research to create wireframes
2. Build component library with Shadcn
3. Implement design system in globals.css
4. Create responsive layouts for each page type
5. Test on real devices (not just browser resize)
