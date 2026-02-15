# Vapour Lounge E-Commerce System - Complete Implementation Guide

## 🎯 Project Overview

A comprehensive vape shop e-commerce platform with advanced POS, inventory management, and payment verification systems.

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Email**: SMTP Integration
- **File Storage**: Supabase Storage
- **Payment**: Manual verification system

### User Roles

1. **Admin** - Full system access, manage everything
2. **Staff** - POS operations, limited management
3. **Customer** - Browse, purchase, track orders

---

## 📋 Feature Checklist

### 1.0 Mobile Responsiveness ✓

- [x] Mobile layout (320px-639px)
- [x] Tablet layout (640px-1023px)
- [x] Desktop layout (1024px+)
- [x] Touch-optimized (44px minimum touch targets)
- [x] Responsive images with Next.js Image
- [x] Bottom navigation for mobile
- [x] Collapsible sidebar for desktop

### 1.1 Authentication & Account Management

- [x] Separate login portals (customer/admin/staff)
- [x] Customer registration with email verification
- [x] Profile management
- [x] Password change with email confirmation
- [x] ID verification upload for age verification
- [x] Admin approval of ID verification
- [x] Force logout (admin feature)
- [x] Session management
- [x] Audit logs for auth events

### 1.2 Inventory Management

- [ ] Batch & expiry date tracking
- [ ] QR/Barcode scanning for POS
- [ ] Supplier management
- [ ] Purchase order generation
- [ ] Variant management (nicotine levels, flavors)
- [ ] Stock-in/stock-out/adjustments
- [ ] Low stock alerts

### 1.3 POS Features

- [ ] Split payments (cash + e-wallet)
- [ ] Shift management (clock in/out)
- [ ] Cash drawer tracking
- [ ] Hold/park orders
- [ ] End-of-day reports
- [ ] Receipt generation (print/email)
- [ ] Refunds/returns logging

### 1.4 Payment Gateway Integration

- [ ] Upload payment screenshot
- [ ] Admin extract reference number
- [ ] In-store verification scan
- [ ] Duplicate detection
- [ ] Payment status tracking

### 1.5 Product Management

- [ ] Create/update/delete products
- [ ] Category management
- [ ] Product variants
- [ ] Product images gallery
- [ ] Pricing and discounts
- [ ] Product filtering

### 1.6 Order Management

- [ ] Add to cart
- [ ] Place order
- [ ] Order status tracking
- [ ] Delivery address management
- [ ] Tracking number
- [ ] Order history
- [ ] Cancel/return orders
- [ ] Payment status tracking

### 1.7 Reporting Module

- [ ] Sales analytics
- [ ] Best-selling products
- [ ] Revenue graphs
- [ ] Filterable date ranges
- [ ] Export reports

### 1.8 Stock Level Alerts

- [ ] Automatic low stock detection
- [ ] Expiry date notifications
- [ ] Email alerts to admin

### 1.9 Email Verification & Password Recovery

- [ ] Email verification for new accounts
- [ ] Password reset via email
- [ ] Email templates

### 2.0 Order History & Reorder

- [ ] View past orders
- [ ] "Order again" feature

### 2.1 Customer Feedback & Ratings

- [ ] Product reviews
- [ ] Star ratings
- [ ] Review moderation
- [ ] Verified purchase badge
- [ ] Average rating display

### 2.2 Session Management

- [ ] Force logout
- [ ] Session timeout
- [ ] Active session tracking

### 2.3 Dashboard & Analytics

- [ ] User count
- [ ] Product count
- [ ] Order count
- [ ] Revenue metrics
- [ ] Charts and graphs

### 2.4 Audit Log Module

- [ ] Track all critical actions
- [ ] Price changes log
- [ ] Stock adjustments log
- [ ] Viewable by admin only

### 2.5 Settings & Configuration

- [ ] Shop information
- [ ] Tax settings
- [ ] Shipping settings
- [ ] Feature toggles

### 2.6 Compliance & Legal

- [ ] Age warning display
- [ ] Legal disclaimers
- [ ] T&C/Privacy Policy consent
- [ ] Timestamp storage

### 2.7 Payment & Verification Module

- [ ] Upload transaction image
- [ ] Extract ref# and amount
- [ ] Scan receipt in-store
- [ ] Match verification
- [ ] Fraud prevention

---

## 🏗️ Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up project structure, auth, and basic CRUD

#### Tasks:

1. **Project Setup**

   ```bash
   npx create-next-app@latest vapour-lounge --typescript --tailwind --app
   cd vapour-lounge
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npx shadcn-ui@latest init
   ```

2. **Supabase Setup**
   - Create Supabase project
   - Run database migrations from `/planning/02-database-schema.md`
   - Configure environment variables:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

3. **Authentication System**
   - Implement sign-up (customer)
   - Implement sign-in (all roles)
   - Email verification
   - Password reset
   - Profile management
   - Role-based routing

4. **Basic UI Structure**
   - Create layout components (Header, Footer, Sidebar)
   - Set up navigation
   - Implement responsive breakpoints
   - Add Shadcn components: Button, Input, Label, Card

5. **Testing**
   - Test user registration
   - Test role-based access
   - Test email flows

**Deliverables**: Working auth system with role-based access

---

### Phase 2: Products & Inventory (Week 3-4)

**Goal**: Product catalog, inventory management, and categories

#### Tasks:

1. **Category Management**
   - CRUD operations for categories
   - Category hierarchy
   - Category images

2. **Product Management**
   - Create product form (admin)
   - Product variant system
   - Image upload and gallery
   - Product listing page
   - Product detail page
   - Search and filters

3. **Inventory System**
   - Batch tracking
   - Expiry date management
   - Stock adjustments
   - Low stock alerts
   - Supplier management

4. **Barcode Scanning**
   - Integrate QuaggaJS for barcode scanning
   - Link products to barcodes
   - Test scanning workflow

**Deliverables**: Complete product catalog with inventory management

---

### Phase 3: Shopping & Orders (Week 5-6)

**Goal**: Customer shopping experience and order management

#### Tasks:

1. **Shopping Cart**
   - Add to cart functionality
   - Cart persistence (localStorage + DB)
   - Cart drawer/modal
   - Quantity updates

2. **Checkout Flow**
   - Shipping address form
   - Address autocomplete
   - Payment method selection
   - Order review
   - Order confirmation

3. **Payment System**
   - Upload payment screenshot
   - Admin verification interface
   - Reference number extraction
   - In-store verification

4. **Order Management**
   - Order listing (customer & admin)
   - Order detail view
   - Status updates
   - Tracking number
   - Email notifications

5. **Customer Dashboard**
   - Order history
   - "Order Again" feature
   - Address book
   - Profile settings

**Deliverables**: Complete shopping and order flow

---

### Phase 4: POS System (Week 7-8)

**Goal**: Point of sale for in-store transactions

#### Tasks:

1. **POS Interface**
   - Product lookup
   - Cart management
   - Customer selection
   - Quick actions

2. **Shift Management**
   - Clock in/out
   - Opening cash drawer
   - Closing shift
   - Cash reconciliation
   - EOD reports

3. **Transactions**
   - Process sale
   - Split payments
   - Receipt generation
   - Print functionality

4. **Order Operations**
   - Park/hold orders
   - Retrieve parked orders
   - Refund processing

**Deliverables**: Fully functional POS system

---

### Phase 5: Advanced Features (Week 9-10)

**Goal**: Reviews, analytics, and admin tools

#### Tasks:

1. **Review System**
   - Submit review form
   - Star ratings
   - Review moderation (admin)
   - Display reviews on PDP
   - Review statistics

2. **Dashboard & Analytics**
   - Admin dashboard
   - Sales charts (Chart.js or Recharts)
   - KPI cards
   - Best sellers
   - Revenue reports

3. **Reporting**
   - Sales reports
   - Inventory reports
   - Staff reports
   - Date range filtering
   - Export to CSV/PDF

4. **Notifications**
   - In-app notifications
   - Email notifications (SMTP)
   - Low stock alerts
   - Order status updates

**Deliverables**: Complete admin tools and customer features

---

### Phase 6: Compliance & Legal (Week 11)

**Goal**: Age verification and legal compliance

#### Tasks:

1. **Age Verification**
   - ID upload interface
   - Admin verification dashboard
   - Approval/rejection workflow
   - Access restrictions

2. **Legal Pages**
   - Terms & Conditions
   - Privacy Policy
   - Age gate
   - Disclaimers

3. **Audit System**
   - Audit log interface
   - Filter and search logs
   - Export logs

**Deliverables**: Compliant system with age verification

---

### Phase 7: Polish & Testing (Week 12)

**Goal**: Optimization, testing, and deployment

#### Tasks:

1. **Performance Optimization**
   - Image optimization
   - Code splitting
   - Lazy loading
   - Database query optimization

2. **Testing**
   - Unit tests (Jest)
   - E2E tests (Playwright)
   - User acceptance testing
   - Security audit

3. **Mobile Testing**
   - Test on real devices
   - iOS Safari
   - Android Chrome
   - Responsive issues

4. **Deployment**
   - Deploy to Vercel
   - Configure custom domain
   - SSL certificate
   - Environment variables
   - Backup strategy

**Deliverables**: Production-ready application

---

## 📂 Project Structure

```
vapour-lounge/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Dashboard
│   │       ├── products/
│   │       ├── inventory/
│   │       ├── orders/
│   │       ├── pos/
│   │       ├── reports/
│   │       ├── staff/
│   │       └── settings/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (shop)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx          # Product listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Product detail
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── account/
│   │       ├── orders/
│   │       ├── addresses/
│   │       └── settings/
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── pos.ts
│   │   ├── inventory.ts
│   │   └── payments.ts
│   ├── api/                      # API Routes
│   │   └── v1/
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                       # Shadcn components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   └── ProductReviews.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   └── CartItem.tsx
│   ├── pos/
│   │   ├── POSInterface.tsx
│   │   ├── BarcodeScanner.tsx
│   │   └── SplitPaymentModal.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── DataTable.tsx
│       └── Charts.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client-side
│   │   ├── server.ts             # Server-side
│   │   └── middleware.ts         # Middleware
│   ├── auth/
│   │   ├── supabase-auth.ts
│   │   ├── roles.ts
│   │   └── audit.ts
│   ├── validations/              # Zod schemas
│   ├── utils.ts
│   └── constants.ts
│
├── hooks/
│   ├── useUser.ts
│   ├── useCart.ts
│   ├── usePermissions.ts
│   └── useProducts.ts
│
├── types/
│   ├── database.types.ts         # Generated from Supabase
│   ├── product.ts
│   ├── order.ts
│   └── user.ts
│
├── public/
│   └── images/
│
├── research/                     # Research documents
│   ├── README.md
│   ├── 01-design-inspirations.md
│   ├── 02-mobile-responsiveness.md
│   └── ...
│
├── planning/                     # Planning documents
│   ├── README.md
│   ├── 02-database-schema.md
│   └── ...
│
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔧 Key Technical Implementations

### 1. Database Connection

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
```

### 2. Server Actions Pattern

```typescript
// app/actions/products.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();

  // Verify admin/staff
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Extract data
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);

  // Insert product
  const { data, error } = await supabase
    .from("products")
    .insert({ name, base_price: price })
    .select()
    .single();

  if (error) throw error;

  // Revalidate cache
  revalidatePath("/admin/products");

  return data;
}
```

### 3. Permission Hook

```typescript
// hooks/usePermissions.ts
import { useUser } from "./useUser";

export function usePermissions() {
  const { profile, staffProfile } = useUser();

  const hasPermission = (permission: string): boolean => {
    if (profile?.role === "admin") return true;
    if (profile?.role === "staff") {
      return staffProfile?.permissions?.[permission] === true;
    }
    return false;
  };

  return { hasPermission };
}
```

### 4. Protected Route

```typescript
// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "staff") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
```

---

## 📧 Email Configuration

```typescript
// lib/email/smtp.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Vapour Lounge",
    html: `<h1>Welcome ${name}!</h1><p>Thanks for signing up.</p>`,
  }),
  orderConfirmation: (orderNumber: string) => ({
    subject: `Order Confirmation #${orderNumber}`,
    html: `<h1>Order Confirmed</h1><p>Your order ${orderNumber} has been placed.</p>`,
  }),
};
```

---

## 🎨 Design System

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --primary: 270 91% 65%; /* Purple */
    --secondary: 189 94% 43%; /* Cyan */
    --accent: 22 93% 53%; /* Orange */
    --success: 142 71% 45%; /* Green */
    --error: 0 84% 60%; /* Red */
    --warning: 38 92% 50%; /* Amber */

    /* Neutrals */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    /* Radius */
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
  }
}

@layer components {
  .container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-md hover:opacity-90 transition;
  }
}
```

---

## 🧪 Testing Strategy

```typescript
// __tests__/products.test.ts
import { describe, it, expect } from "@jest/globals";
import { createProduct } from "@/app/actions/products";

describe("Product Actions", () => {
  it("should create a product", async () => {
    const formData = new FormData();
    formData.append("name", "Test Product");
    formData.append("price", "29.99");

    const product = await createProduct(formData);

    expect(product.name).toBe("Test Product");
    expect(product.base_price).toBe(29.99);
  });
});
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] RLS policies enabled
- [ ] SMTP configured
- [ ] Image storage configured
- [ ] Custom domain set up
- [ ] SSL certificate active
- [ ] Analytics integrated
- [ ] Error tracking (Sentry)
- [ ] Backup strategy
- [ ] Performance monitoring
- [ ] SEO optimization
- [ ] Sitemap generated
- [ ] robots.txt configured

---

## 📚 Resources & References

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Research Documents

- See `/research` folder for all research findings
- See `/planning` folder for implementation plans

### Key Files to Reference

- `/planning/02-database-schema.md` - Complete DB schema
- `/research/01-design-inspirations.md` - UI/UX patterns
- `/research/07-authentication-roles.md` - Auth implementation
- `/research/08-pos-systems.md` - POS system design
- `/research/09-payment-verification.md` - Payment flow

---

## 🎯 Next Action Items

1. **Set up development environment**
   - Clone/create Next.js project
   - Install dependencies
   - Configure Supabase

2. **Run database migrations**
   - Use schema from `/planning/02-database-schema.md`
   - Enable RLS
   - Seed initial data

3. **Implement Phase 1**
   - Follow Phase 1 tasks above
   - Use research docs as reference
   - Test thoroughly

4. **Iterate through phases**
   - Complete one phase before moving to next
   - Test each feature
   - Get feedback

---

## 💡 Implementation Tips

### Best Practices

✓ Use Server Components by default
✓ Client Components only when needed (interactivity, hooks)
✓ Server Actions for mutations
✓ TypeScript for type safety
✓ Error boundaries for error handling
✓ Loading states everywhere
✓ Optimistic updates for better UX

### Common Patterns

✓ Loader pattern for async components
✓ Suspense boundaries for data fetching
✓ Progressive enhancement
✓ Mobile-first responsive design
✓ Semantic HTML
✓ Accessible components (ARIA labels)

### Performance

✓ Image optimization with Next.js Image
✓ Code splitting and lazy loading
✓ Database query optimization
✓ Caching strategies (server/client)
✓ Edge functions for global distribution

---

## 📞 Support & Questions

For any questions during implementation, refer to:

1. Research documents in `/research` folder
2. Planning documents in `/planning` folder
3. This main implementation guide
4. Official documentation for each technology

Good luck with the implementation! 🚀
