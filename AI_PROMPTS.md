# AI Implementation Prompts - Ready to Use

## Overview

This document contains ready-to-use prompts for AI coding assistants to implement each feature of the Vapour Lounge e-commerce system. Copy and paste these prompts when you're ready to implement each section.

---

## 🔐 PHASE 1: Authentication System

### Prompt 1.1: Set Up Supabase Auth

```
I'm building a Next.js 14+ e-commerce app with Supabase. I need to set up authentication with three user roles: admin, staff, and customer.

Requirements:
1. Create Supabase client utilities for client-side, server-side, and middleware
2. Set up the database schema with profiles, customer_profiles, and staff_profiles tables
3. Implement Row Level Security (RLS) policies
4. Create a sign-up form for customers with email verification
5. Create a sign-in form that redirects based on role (admin → /admin, staff → /admin/pos, customer → /)

Tech stack: Next.js 14 App Router, Supabase, TypeScript, Shadcn UI, Tailwind CSS

Please provide:
- File structure
- Complete code for each file
- Database migration SQL
- Step-by-step instructions

Reference: Use the database schema from /planning/02-database-schema.md sections 1.1-1.3
```

### Prompt 1.2: Role-Based Access Control

```
Building on the authentication system, I need to implement role-based access control with permissions.

Requirements:
1. Create a usePermissions() hook to check user permissions
2. Create a PermissionGate component to conditionally render UI elements
3. Implement middleware to protect routes (/admin/* requires admin or staff role)
4. Add a force logout feature for admins
5. Create an audit log system to track authentication events

Please provide complete code with TypeScript types and usage examples.

Reference: See /research/07-authentication-roles.md sections 7 and 8
```

### Prompt 1.3: ID Verification for Age Check

```
I need an age verification system where customers upload their ID for admin approval.

Requirements:
1. File upload form (supports jpg, png, pdf)
2. Upload to Supabase Storage in 'id-verifications' bucket
3. Admin dashboard to view pending verifications
4. Admin can approve/reject with reason
5. Store verification timestamp and who approved it
6. Restrict access to certain pages until verified

Database tables: customer_profiles (id_verification_url, age_verified, id_verified_at, id_verified_by)

Please provide the upload component, admin review interface, and middleware for access control.

Reference: See /research/07-authentication-roles.md section 6
```

---

## 🛍️ PHASE 2: Products & Inventory

### Prompt 2.1: Product Management System

```
I need a complete product management system for a vape shop with support for product variants.

Requirements:
1. Products can be "simple" or have "variants" (nicotine levels, flavors, sizes)
2. Admin can create/edit/delete products
3. Products belong to categories and brands
4. Support multiple product images
5. Track inventory for both simple products and variants
6. Display products in a grid with filtering and sorting

Database tables: products, product_variants, categories, brands, product_images

Please provide:
- Admin product creation form (multi-step: Details → Variants → Images)
- Product listing page with filters
- Product detail page with variant selector
- Server actions for CRUD operations

Reference: /planning/02-database-schema.md sections 2.1-2.5
```

### Prompt 2.2: Inventory Management with Batch Tracking

```
I need an inventory management system that tracks batches with expiry dates.

Requirements:
1. Receive inventory (stock-in) with batch number and expiry date
2. Track stock adjustments (damaged, expired, stolen)
3. Display low stock alerts
4. Show upcoming expiry dates
5. Generate inventory reports

Database tables: inventory_batches, stock_adjustments

Please provide:
- Stock-in form (batch number, quantity, expiry date)
- Stock adjustment interface
- Low stock alert system (email notifications)
- Inventory report page with filters

Reference: /planning/02-database-schema.md sections 2.6-2.7
```

### Prompt 2.3: Barcode Scanning for POS

```
Add barcode scanning capability using QuaggaJS to quickly look up products in the POS system.

Requirements:
1. Camera-based barcode scanner component
2. Support for Code 128, EAN, UPC barcodes
3. Auto-add product to cart when scanned
4. Handle "product not found" gracefully
5. Mobile-responsive

Please provide:
- BarcodeScanner component using QuaggaJS
- Integration with POS cart
- Error handling

Reference: /research/08-pos-systems.md section 6
```

---

## 🛒 PHASE 3: Shopping Cart & Orders

### Prompt 3.1: Shopping Cart System

```
I need a shopping cart system with persistence and a slide-out drawer UI.

Requirements:
1. Add to cart with quantity selection
2. Update quantities (+/- buttons)
3. Remove items
4. Persist cart in localStorage and sync with database for logged-in users
5. Cart drawer/modal that slides from right
6. Display subtotal, tax, and total
7. Proceed to checkout button

Please provide:
- useCart() hook with add, update, remove, clear functions
- CartDrawer component
- CartItem component
- Cart persistence logic

Stack: Next.js, Supabase, Zustand or Context API for state management

Reference: /research/01-design-inspirations.md section 2 (Lazada cart experience)
```

### Prompt 3.2: Checkout Flow

```
Implement a single-page checkout flow with address management and payment options.

Requirements:
1. Shipping address selection (or add new address)
2. Auto-fill from customer profile
3. Payment method selection (Upload Screenshot, Cash on Delivery)
4. Order review section
5. Place order button
6. Order confirmation page with order number

Database tables: orders, order_items, customer_addresses

Please provide:
- Checkout page component
- Address form with validation (Zod)
- Server action to create order
- Order confirmation page

Reference: /research/02-mobile-responsiveness.md section 2.6
```

### Prompt 3.3: Order Tracking & History

```
Create an order management system for customers to track their orders.

Requirements:
1. Order history page (list all past orders)
2. Order detail page showing:
   - Order items
   - Status timeline (Pending → Paid → Packed → Shipped → Delivered)
   - Tracking number
   - Delivery address
3. "Order Again" button to add all items from a past order to cart
4. Cancel order (if status is still "pending")

Please provide:
- Order history page for customers
- Order detail page with status timeline
- Reorder functionality
- Cancel order with confirmation dialog

Reference: /planning/02-database-schema.md section 4 and requirements section 1.6
```

---

## 💳 PHASE 4: Payment Verification System

### Prompt 4.1: Payment Screenshot Upload

```
Implement a unique payment verification system where customers upload transaction screenshots.

Requirements:
1. Customer uploads payment proof (GCash/PayMaya screenshot)
2. Store in Supabase Storage
3. Update order payment_status to 'pending'
4. Notify admins of new upload
5. Display upload status to customer

Database table: payment_uploads

Please provide:
- File upload component with preview
- Server action to handle upload
- Order page showing payment status

Reference: /research/09-payment-verification.md sections 3.1
```

### Prompt 4.2: Admin Payment Verification Dashboard

```
Create an admin dashboard to extract reference numbers from uploaded payment screenshots.

Requirements:
1. List all pending payment verifications
2. Show uploaded image in modal
3. Input fields for reference number and amount
4. Optional: Auto-extract using OCR (Tesseract.js)
5. Detect duplicate reference numbers
6. Save extracted data
7. Warn if amount doesn't match order total

Please provide:
- Admin verification dashboard
- Image viewer with extraction form
- Duplicate detection logic
- Optional: OCR integration

Reference: /research/09-payment-verification.md sections 3.2 and 5.1
```

### Prompt 4.3: In-Store Payment Verification (Staff)

```
Create a verification interface for staff to scan/enter reference numbers when customers arrive in-store.

Requirements:
1. Input field for reference number (manual or QR scan)
2. Check against database for match
3. Show results:
   - "Verified" → Mark payment as verified, update order to paid
   - "Already Claimed" → Show when/who verified it
   - "Not Found" → No matching record
4. Log all verification attempts
5. Send email to customer on successful verification

Please provide:
- Verification modal for POS
- Server action for verification
- Logging system

Reference: /research/09-payment-verification.md sections 3.3 and 5.2
```

---

## 🏪 PHASE 5: POS System

### Prompt 5.1: POS Interface

```
Build a point-of-sale interface for in-store transactions.

Requirements:
1. Two-panel layout: Products (left) | Cart (right)
2. Product search and category filters
3. Click product to add to cart
4. Quantity adjustment in cart
5. Display subtotal, tax, total
6. Checkout button opens payment modal

Please provide:
- POS page layout
- Product search with filters
- Cart management
- Responsive design (tablet optimized)

Reference: /research/08-pos-systems.md section 2
```

### Prompt 5.2: Shift Management & Cash Drawer

```
Implement shift management for tracking cash drawer throughout the day.

Requirements:
1. "Open Shift" modal: Enter opening cash amount
2. "Close Shift" modal: Enter closing cash, calculate difference
3. Track all transactions during shift
4. Generate End-of-Day (EOD) report with:
   - Opening/closing cash
   - Cash sales vs e-wallet
   - Overage/shortage
   - Transaction count
5. Only one open shift per staff member at a time

Database table: pos_shifts

Please provide:
- Open/close shift modals
- Shift tracking logic
- EOD report component
- Server actions

Reference: /research/08-pos-systems.md sections 4.1 and 4.4
```

### Prompt 5.3: Split Payments & Receipt

```
Add split payment support and receipt generation to the POS system.

Requirements:
1. Payment modal with options: Cash, E-Wallet, Split
2. For split: Input cash amount and e-wallet amount
3. Validate that total matches order total
4. Calculate change if cash payment
5. Generate receipt (printable thermal printer format)
6. Option to email receipt

Database table: pos_transactions

Please provide:
- Payment modal with split payment UI
- Receipt generation function
- Print functionality
- Email receipt option

Reference: /research/08-pos-systems.md sections 5 and 7
```

### Prompt 5.4: Park/Hold Orders

```
Implement the ability to park (hold) incomplete orders for later retrieval.

Requirements:
1. "Park Order" button in POS
2. Modal to enter customer name and phone
3. Save entire cart state to database
4. Show list of parked orders
5. Click to retrieve and load cart
6. Auto-delete parked orders after 24 hours

Database table: parked_orders

Please provide:
- Park order modal
- Parked orders list view
- Retrieve functionality
- Auto-cleanup logic

Reference: /research/08-pos-systems.md section 4.3
```

---

## 📊 PHASE 6: Dashboard & Analytics

### Prompt 6.1: Admin Dashboard

```
Create an admin dashboard with KPIs and analytics.

Requirements:
1. KPI cards: Total Revenue, Orders Today, Total Customers, Low Stock Items
2. Sales chart (last 7 days) - line or bar chart
3. Best-selling products table
4. Recent orders table
5. Low stock alerts
6. Responsive design

Please provide:
- Dashboard layout with sections
- KPI card components
- Sales chart (using Recharts or Chart.js)
- Data fetching server actions

Reference: /research/02-mobile-responsiveness.md section 2.7 and requirements section 2.3
```

### Prompt 6.2: Sales Reports

```
Build a reporting system with date range filtering.

Requirements:
1. Date range picker (Today, This Week, This Month, Custom)
2. Reports:
   - Sales by date
   - Sales by product
   - Sales by category
   - Staff performance
3. Export to CSV
4. Charts and graphs
5. Print-friendly view

Please provide:
- Report page with filters
- Data aggregation queries
- CSV export function
- Chart components

Reference: Requirements section 1.7
```

---

## ⭐ PHASE 7: Reviews & Ratings

### Prompt 7.1: Product Review System

```
Implement a product review and rating system.

Requirements:
1. Customers can leave reviews after purchase (verified purchase badge)
2. Star rating (1-5)
3. Review title and text
4. Upload images (optional)
5. "Helpful" votes on reviews
6. Admin moderation (approve/reject/hide)
7. Display average rating and rating breakdown on product page

Database tables: product_reviews, review_votes

Please provide:
- Review submission form
- Review list on product detail page
- Review moderation dashboard (admin)
- Helpful vote functionality

Reference: /planning/02-database-schema.md section 8 and requirements section 2.1
```

---

## 🚨 PHASE 8: Notifications & Alerts

### Prompt 8.1: Low Stock Email Alerts

```
Create an automated low stock alert system that emails admins.

Requirements:
1. Daily cron job to check stock levels
2. Compare stock_quantity vs low_stock_threshold
3. Send email to all admins with list of low stock items
4. Include product name, current stock, and threshold
5. Link to product in admin panel

Please provide:
- Cron job setup (Next.js route handler)
- Stock check function
- Email template
- SMTP configuration

Reference: Requirements section 1.8
```

### Prompt 8.2: Order Status Notifications

```
Send email notifications to customers when their order status changes.

Requirements:
1. Trigger on order status update
2. Email templates for each status:
   - Order Confirmed (payment verified)
   - Processing (being prepared)
   - Shipped (include tracking number)
   - Delivered
3. Professional email design
4. Personalized with customer name

Please provide:
- Database trigger or observer pattern
- Email templates for each status
- Server action to send emails

Reference: Requirements section 1.6
```

---

## 🔒 PHASE 9: Compliance & Security

### Prompt 9.1: Audit Log System

```
Implement a comprehensive audit logging system for admin oversight.

Requirements:
1. Log all critical actions:
   - Price changes
   - Stock adjustments
   - Product deletions
   - User role changes
   - Order modifications
2. Store: user_id, action, target_record, old_value, new_value, timestamp, IP address
3. Admin page to view logs with filters
4. Search by user, action, date range
5. Export logs to CSV

Database table: audit_logs

Please provide:
- Logging utility function
- Trigger hooks for tracked actions
- Audit log viewer page (admin)
- Filter and search functionality

Reference: /planning/02-database-schema.md section 10 and requirements section 2.4
```

### Prompt 9.2: Age Verification Gate

```
Create an age verification gate that restricts access until verified.

Requirements:
1. Modal/page showing age warning and legal disclaimers
2. Customer must upload ID
3. Show "Pending Verification" message after upload
4. Restrict access to /shop/* routes until verified
5. Admin approval required
6. Store consent timestamp for T&C and Privacy Policy

Please provide:
- Age gate modal
- ID upload interface
- Middleware to enforce restrictions
- Admin verification dashboard

Reference: /research/07-authentication-roles.md section 6 and requirements section 2.6
```

---

## 🎨 PHASE 10: UI Polish & Optimization

### Prompt 10.1: Mobile Responsive Optimization

```
Optimize the entire app for mobile responsiveness.

Requirements:
1. Bottom navigation for mobile (Home, Shop, Cart, Account)
2. Collapsible sidebar for desktop admin panel
3. Touch-friendly buttons (minimum 44px)
4. Swipe gestures for cart items (swipe to delete)
5. Optimize images for mobile (smaller file sizes)
6. Test on iPhone and Android

Please review and optimize:
- All layouts for mobile/tablet/desktop
- Touch target sizes
- Navigation patterns
- Image loading

Reference: /research/02-mobile-responsiveness.md (entire document)
```

### Prompt 10.2: Performance Optimization

```
Optimize the application for performance.

Tasks:
1. Implement Next.js Image component everywhere
2. Add loading states and skeletons
3. Lazy load below-the-fold content
4. Code split large components
5. Optimize database queries (add indexes)
6. Enable Incremental Static Regeneration (ISR) for product pages
7. Add Suspense boundaries

Please analyze the app and provide:
- Image optimization recommendations
- Loading state implementations
- Database query optimizations
- ISR configuration

Reference: IMPLEMENTATION_GUIDE.md Performance section
```

---

## 🧪 Testing Prompts

### Prompt: Unit Tests

```
Create unit tests for the core server actions.

Requirements:
1. Test authentication flows (sign up, sign in, password reset)
2. Test product CRUD operations
3. Test order creation
4. Test POS transaction processing
5. Test permission checks

Use Jest and React Testing Library.

Please provide test files for:
- app/actions/auth.ts
- app/actions/products.ts
- app/actions/orders.ts
- app/actions/pos.ts
```

### Prompt: E2E Tests

```
Create end-to-end tests for critical user flows.

Flows to test:
1. Customer registration → email verification → age verification
2. Browse products → add to cart → checkout → upload payment
3. Admin extracts payment → staff verifies in-store → order fulfilled
4. Staff opens shift → processes sales → closes shift

Use Playwright.

Please provide E2E test scenarios with step-by-step assertions.
```

---

## 📝 How to Use These Prompts

### Step-by-Step Process:

1. **Choose a Feature**: Start with Phase 1 and work sequentially

2. **Copy the Prompt**: Copy the entire prompt for the feature you want to implement

3. **Provide Context**: Before using the prompt, share relevant files:
   - Database schema from `/planning/02-database-schema.md`
   - Research docs from `/research/` folder
   - Current project structure

4. **Paste and Execute**: Paste the prompt to your AI assistant

5. **Review and Test**: Always review generated code and test thoroughly

6. **Iterate**: If the output isn't perfect, ask follow-up questions or refine

### Tips for Best Results:

- ✓ Share your current file structure
- ✓ Mention any existing code to avoid conflicts
- ✓ Specify exact file paths where code should go
- ✓ Ask for TypeScript types
- ✓ Request error handling
- ✓ Ask for loading states
- ✓ Request mobile-responsive designs

### Example Usage:

```
Context: I'm at Phase 2.1 - Product Management.
My current structure is in IMPLEMENTATION_GUIDE.md.
I've already completed authentication (Phase 1).

[Paste Prompt 2.1 here]

Additional requirements:
- Use Shadcn components for forms
- Add optimistic UI updates
- Include loading skeletons
- Add error boundaries
```

---

## 🎯 Prompt Customization

### You can modify these prompts by:

1. **Adding Technology Preferences**:
   - "Use Zustand for state management instead of Context"
   - "Use React Hook Form instead of plain forms"
   - "Use tRPC instead of Server Actions"

2. **Adjusting Scope**:
   - "Start with just the basic form, we'll add advanced features later"
   - "Include comprehensive error handling and edge cases"
   - "Make it production-ready with tests and documentation"

3. **Specifying Style**:
   - "Use a minimalist design"
   - "Match the Shopee aesthetic"
   - "Make it look professional and trustworthy"

---

## 📚 Additional Resources

- Full research: `/research/` folder
- Implementation plans: `/planning/` folder
- Main guide: `/IMPLEMENTATION_GUIDE.md`
- Database schema: `/planning/02-database-schema.md`

---

## ✅ Tracking Your Progress

As you implement each feature, check it off in the IMPLEMENTATION_GUIDE.md feature checklist to track your progress!

Good luck with implementation! 🚀
