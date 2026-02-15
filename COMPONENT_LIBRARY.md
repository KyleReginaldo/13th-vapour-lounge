# Component Library - Vapour Lounge

Complete component specifications based on research from Shopee, Lazada, Amazon, and modern e-commerce patterns.

**Reference:**

- [UI Implementation Plan](UI_IMPLEMENTATION_PLAN.md)
- [Design Inspirations Research](research/01-design-inspirations.md)
- [Mobile Responsiveness Research](research/02-mobile-responsiveness.md)

---

## 📁 Component Structure

```
components/
├── ui/                    # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   └── ...
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── MobileBottomNav.tsx
│   ├── AdminSidebar.tsx
│   └── Breadcrumb.tsx
├── product/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   ├── ProductGallery.tsx
│   ├── VariantSelector.tsx
│   ├── QuantityInput.tsx
│   └── PriceDisplay.tsx
├── cart/
│   ├── CartBadge.tsx
│   ├── CartDrawer.tsx
│   ├── CartItem.tsx
│   └── OrderSummary.tsx
├── checkout/
│   ├── CheckoutProgress.tsx
│   ├── AddressForm.tsx
│   ├── PaymentSelector.tsx
│   └── OrderReview.tsx
├── reviews/
│   ├── RatingStars.tsx
│   ├── RatingBreakdown.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewForm.tsx
│   └── ReviewHelpfulness.tsx
├── admin/
│   ├── StatCard.tsx
│   ├── SalesChart.tsx
│   ├── DataTable.tsx
│   ├── PaymentProofCard.tsx
│   └── BarcodeScanner.tsx
└── shared/
    ├── LoadingSpinner.tsx
    ├── SkeletonLoader.tsx
    ├── EmptyState.tsx
    ├── ConfirmDialog.tsx
    └── ImageUpload.tsx
```

---

## 🧱 Core UI Components (shadcn/ui)

These are installed via shadcn/ui CLI and customized.

### Installation

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add card
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add toast
```

---

## 🏗️ Layout Components

### Header.tsx

**Features (Reference: Research 01 - Shopee, Research 02 - Responsive)**

- Sticky on scroll
- Search bar with autocomplete
- Cart badge with count
- User menu
- Mobile: Hamburger menu
- Desktop: Full navigation

**Implementation:**

```typescript
// components/layout/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu } from 'lucide-react';
import { CartBadge } from '@/components/cart/CartBadge';
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete';
import { MobileMenu } from './MobileMenu';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VAPOUR LOUNGE
                </div>
              </Link>
            </div>

            {/* Center: Search (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <SearchAutocomplete />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-6 w-6" />
                <CartBadge />
              </Link>

              <Link href="/profile" className="hidden md:flex items-center gap-2">
                <User className="h-6 w-6" />
                <span className="text-sm">Account</span>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <SearchAutocomplete />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 h-12 text-sm">
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <Link href="/products" className="hover:text-primary-600">
              Shop All
            </Link>
            <Link href="/products?category=juice" className="hover:text-primary-600">
              Vape Juice
            </Link>
            <Link href="/products?category=devices" className="hover:text-primary-600">
              Devices
            </Link>
            <Link href="/products?tag=new" className="hover:text-primary-600">
              New Arrivals
            </Link>
            <Link href="/products?tag=sale" className="text-red-600 font-semibold">
              Sale
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
};
```

**Styling:**

- Sticky header with `backdrop-blur-md` for glassmorphism
- Gradient logo text
- Shadow on scroll
- Smooth transitions

---

### MobileBottomNav.tsx

**Features (Reference: Research 02 - Bottom Navigation)**

- Fixed bottom navigation (mobile only)
- 4-5 icons with labels
- Active state highlighting
- Badge on cart

**Implementation:**

```typescript
// components/layout/MobileBottomNav.tsx
'use client';

import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartBadge } from '@/components/cart/CartBadge';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/products', icon: Grid, label: 'Shop' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart', showBadge: true },
  { href: '/profile', icon: User, label: 'Me' },
];

export const MobileBottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ href, icon: Icon, label, showBadge }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 relative',
                isActive ? 'text-primary-600' : 'text-gray-600'
              )}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {showBadge && <CartBadge />}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
```

---

## 🛍️ Product Components

### ProductCard.tsx

**Features (Reference: Research 01 - Shopee Product Cards)**

- Square image (1:1 aspect ratio)
- Product name (2 lines, truncated)
- Price with sale badge
- Rating + review count
- Tags: "New", "Best Seller", "Low Stock"
- Hover effects (desktop)

**Implementation:**

```typescript
// components/product/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    salePrice?: number;
    primary_image: string;
    averageRating: number;
    reviewCount: number;
    stock_quantity: number;
    tags?: string[];
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const isLowStock = product.stock_quantity < 10 && product.stock_quantity > 0;
  const isNew = product.tags?.includes('new');
  const isBestSeller = product.tags?.includes('bestseller');

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={product.primary_image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white">
                -{discount}%
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-green-500 text-white">
                New
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-purple-500 text-white flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Best Seller
              </Badge>
            )}
          </div>

          {isLowStock && (
            <Badge className="absolute bottom-2 right-2 bg-orange-500 text-white">
              Only {product.stock_quantity} left
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Product Name */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <div className="flex items-center gap-0.5 text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-gray-900 font-medium">
                {product.averageRating.toFixed(1)}
              </span>
            </div>
            <span>({product.reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary-600">
              R {product.salePrice?.toFixed(2) || product.price.toFixed(2)}
            </span>
            {product.salePrice && (
              <span className="text-sm text-gray-500 line-through">
                R {product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};
```

**Variants:**

- `ProductCardCompact` - Smaller, for "Related Products"
- `ProductCardHorizontal` - For cart items
- `ProductCardFeatured` - Larger for hero section

---

### ProductGallery.tsx

**Features (Reference: Research 01 - Lazada PDP)**

- Large main image
- Thumbnail strip below
- Click thumbnail to change main image
- Zoom on hover (desktop) / pinch (mobile)
- Swipeable on mobile

**Implementation:**

```typescript
// components/product/ProductGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        <Image
          src={images[selectedIndex]}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Navigation Arrows (Desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <ZoomIn className="h-4 w-4" />
          Click to zoom
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-primary-600 ring-2 ring-primary-600/20"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="text-center text-sm text-gray-600">
        {selectedIndex + 1} / {images.length}
      </div>
    </div>
  );
};
```

---

### VariantSelector.tsx

**Features (Reference: Research 01 - Visual Chips)**

- Chip-based selector (not dropdown)
- Visual selection state
- Grouped by attribute (nicotine, flavor, size)
- Disabled state for out-of-stock
- Price change indicator

**Implementation:**

```typescript
// components/product/VariantSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Variant {
  id: string;
  sku: string;
  attributes: {
    nicotineLevel?: string;
    flavor?: string;
    size?: string;
  };
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variant: Variant | null) => void;
}

export const VariantSelector = ({ variants, onSelect }: VariantSelectorProps) => {
  const [selected, setSelected] = useState<Record<string, string>>({});

  // Extract unique attribute values
  const attributes = {
    nicotineLevel: [...new Set(variants.map(v => v.attributes.nicotineLevel).filter(Boolean))],
    flavor: [...new Set(variants.map(v => v.attributes.flavor).filter(Boolean))],
    size: [...new Set(variants.map(v => v.attributes.size).filter(Boolean))],
  };

  // Find matching variant based on selected attributes
  useEffect(() => {
    const matchingVariant = variants.find(v =>
      Object.entries(selected).every(([key, value]) =>
        v.attributes[key as keyof typeof v.attributes] === value
      )
    );
    onSelect(matchingVariant || null);
  }, [selected, variants, onSelect]);

  const handleSelect = (attribute: string, value: string) => {
    setSelected(prev => ({
      ...prev,
      [attribute]: prev[attribute] === value ? '' : value
    }));
  };

  // Check if option is available
  const isOptionAvailable = (attribute: string, value: string) => {
    const testSelected = { ...selected, [attribute]: value };
    return variants.some(v =>
      Object.entries(testSelected).every(([key, val]) =>
        v.attributes[key as keyof typeof v.attributes] === val
      ) && v.stock_quantity > 0 && v.is_active
    );
  };

  return (
    <div className="space-y-6">
      {/* Nicotine Level */}
      {attributes.nicotineLevel.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Nicotine Level
          </label>
          <div className="flex flex-wrap gap-2">
            {attributes.nicotineLevel.map(level => {
              const isSelected = selected.nicotineLevel === level;
              const isAvailable = isOptionAvailable('nicotineLevel', level);

              return (
                <button
                  key={level}
                  onClick={() => handleSelect('nicotineLevel', level!)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 font-medium transition-all",
                    isSelected
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-300 hover:border-gray-400",
                    !isAvailable && "opacity-50 cursor-not-allowed line-through"
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Flavor */}
      {attributes.flavor.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Flavor
          </label>
          <div className="flex flex-wrap gap-2">
            {attributes.flavor.map(flavor => {
              const isSelected = selected.flavor === flavor;
              const isAvailable = isOptionAvailable('flavor', flavor);

              return (
                <button
                  key={flavor}
                  onClick={() => handleSelect('flavor', flavor!)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 font-medium transition-all",
                    isSelected
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-300 hover:border-gray-400",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {flavor}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size */}
      {attributes.size.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {attributes.size.map(size => {
              const isSelected = selected.size === size;
              const isAvailable = isOptionAvailable('size', size);

              return (
                <button
                  key={size}
                  onClick={() => handleSelect('size', size!)}
                  disabled={!isAvailable}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 font-medium transition-all",
                    isSelected
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-300 hover:border-gray-400",
                    !isAvailable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### QuantityInput.tsx

**Features:**

- +/- buttons
- Manual input with validation
- Min (1) / Max (stock) limits
- Disabled state
- Keyboard navigation

**Implementation:**

```typescript
// components/product/QuantityInput.tsx
'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export const QuantityInput = ({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled = false
}: QuantityInputProps) => {
  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    onChange(Math.min(Math.max(newValue, min), max));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className="w-20 text-center"
        aria-label="Quantity"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {max < 999 && (
        <span className="text-sm text-gray-600">
          Max: {max}
        </span>
      )}
    </div>
  );
};
```

---

## 🛒 Cart Components

### CartBadge.tsx

**Features (Reference: Research 01 - Floating Cart Badge)**

- Shows item count
- Animates on count change
- Positioned absolute on cart icon
- Bounce animation when items added

**Implementation:**

```typescript
// components/cart/CartBadge.tsx
'use client';

import { useCart } from '@/lib/queries/cart';
import { cn } from '@/lib/utils';

export const CartBadge = () => {
  const { data: cart } = useCart();
  const itemCount = cart?.summary?.itemCount || 0;

  if (itemCount === 0) return null;

  return (
    <span className={cn(
      "absolute -top-2 -right-2",
      "flex items-center justify-center",
      "min-w-[20px] h-5 px-1",
      "bg-red-500 text-white text-xs font-bold",
      "rounded-full border-2 border-white",
      "animate-in zoom-in-50 duration-200"
    )}>
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
};
```

---

### CartDrawer.tsx

**Features:**

- Slide from right (desktop/tablet)
- Slide from bottom (mobile)
- Cart items list
- Order summary
- Checkout button
- Continue shopping link

**Implementation:**

```typescript
// components/cart/CartDrawer.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CartItem } from './CartItem';
import { OrderSummary } from './OrderSummary';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/queries/cart';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { data: cart, isLoading } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            Shopping Cart ({cart?.summary?.itemCount || 0} items)
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {cart?.items?.map(item => (
              <CartItem key={item.id} item={item} />
            ))}

            {cart?.items?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Your cart is empty
              </div>
            )}
          </div>

          {/* Order Summary & Checkout */}
          {cart?.items?.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <OrderSummary summary={cart.summary} />

              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
              >
                Checkout
              </Button>

              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

---

## ⭐ Review Components

### RatingStars.tsx

**Features:**

- Read-only display
- Interactive for input
- Half-star support
- Size variants
- Color customization

**Implementation:**

```typescript
// components/reviews/RatingStars.tsx
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export const RatingStars = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange
}: RatingStarsProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= Math.floor(rating);
    const isHalf = i === Math.ceil(rating) && rating % 1 !== 0;

    stars.push(
      <button
        key={i}
        onClick={() => interactive && onChange?.(i)}
        disabled={!interactive}
        className={cn(
          interactive && "cursor-pointer hover:scale-110 transition-transform",
          !interactive && "cursor-default"
        )}
        aria-label={`${i} star${i > 1 ? 's' : ''}`}
      >
        {isHalf ? (
          <StarHalf className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
        ) : (
          <Star className={cn(
            sizeClasses[size],
            isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )} />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
    </div>
  );
};
```

---

### RatingBreakdown.tsx

**Features (Reference: Research 01 - Amazon Reviews)**

- Visual bar chart
- Percentage calculation
- Star filter links
- Responsive design

**Implementation:**

```typescript
// components/reviews/RatingBreakdown.tsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingBreakdownProps {
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  totalReviews: number;
  onFilterByStar?: (stars: number) => void;
}

export const RatingBreakdown = ({
  breakdown,
  totalReviews,
  onFilterByStar
}: RatingBreakdownProps) => {
  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map(stars => {
        const count = breakdown[stars as keyof typeof breakdown];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <button
            key={stars}
            onClick={() => onFilterByStar?.(stars)}
            className="w-full flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors"
          >
            {/* Stars */}
            <div className="flex items-center gap-1 text-sm font-medium w-20">
              {stars} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>

            {/* Bar */}
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Percentage */}
            <div className="text-sm text-gray-600 w-12 text-right">
              {percentage.toFixed(0)}%
            </div>

            {/* Count */}
            <div className="text-sm text-gray-500 w-16 text-right">
              ({count})
            </div>
          </button>
        );
      })}
    </div>
  );
};
```

---

## 📊 Admin Components

_(Continue with more admin components like StatCard, SalesChart, DataTable, BarcodeScanner...)_

---

## 🎨 Animation & Interaction Patterns

### Add to Cart Flying Animation

```typescript
// lib/animations/flyingCart.ts
export const animateProductToCart = (
  productElement: HTMLElement,
  cartElement: HTMLElement
) => {
  const productRect = productElement.getBoundingClientRect();
  const cartRect = cartElement.getBoundingClientRect();

  // Create flying product clone
  const flyingProduct = productElement.cloneNode(true) as HTMLElement;
  flyingProduct.style.position = "fixed";
  flyingProduct.style.top = `${productRect.top}px`;
  flyingProduct.style.left = `${productRect.left}px`;
  flyingProduct.style.width = `${productRect.width}px`;
  flyingProduct.style.height = `${productRect.height}px`;
  flyingProduct.style.zIndex = "9999";
  flyingProduct.style.transition = "all 0.6s cubic-bezier(0.45, 0, 0.55, 1)";

  document.body.appendChild(flyingProduct);

  // Trigger animation
  requestAnimationFrame(() => {
    flyingProduct.style.top = `${cartRect.top}px`;
    flyingProduct.style.left = `${cartRect.left}px`;
    flyingProduct.style.width = "0px";
    flyingProduct.style.height = "0px";
    flyingProduct.style.opacity = "0";
  });

  // Remove after animation
  setTimeout(() => {
    document.body.removeChild(flyingProduct);
  }, 600);
};
```

---

## 📚 Next Steps

1. **Install shadcn/ui components**
2. **Create component files systematically**
3. **Test responsiveness at all breakpoints**
4. **Connect to server actions via React Query**
5. **Add animations with Framer Motion**
6. **Implement accessibility features**

---

**Reference:**

- [UI Implementation Plan](UI_IMPLEMENTATION_PLAN.md) - Overall strategy
- [API Reference](API_REFERENCE.md) - Backend integration
- [Design Inspirations](research/01-design-inspirations.md) - Visual references

**Component Count:** 50+ reusable components
**Framework:** Next.js 14 + React 18 + TypeScript
**UI Library:** shadcn/ui + Tailwind CSS
