# Deployment & Testing Checklist

Complete checklist for deploying and testing the Vapour Lounge platform.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup

- [ ] Create Supabase project
- [ ] Run `IMPROVED_SCHEMA.sql` in SQL Editor
- [ ] Verify all 40+ tables created
- [ ] Check RLS policies enabled on all tables
- [ ] Test database functions (increment_product_stock, etc.)
- [ ] Create database indexes (check query performance)

**Verification Query:**

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should return ~40+

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- Should return empty (all have RLS)
```

---

### 2. Storage Buckets

- [ ] Create `product-images` bucket (Public)
  - [ ] Set max file size: 5MB
  - [ ] Configure RLS policies (public read, auth write)
  - [ ] Test image upload
  - [ ] Test public URL generation

- [ ] Create `payment-proofs` bucket (Private)
  - [ ] Set max file size: 10MB
  - [ ] Configure RLS policies (owner + admin read)
  - [ ] Test upload and access control

- [ ] Create `id-verifications` bucket (Private)
  - [ ] Set max file size: 10MB
  - [ ] Configure RLS policies (owner + admin read)
  - [ ] Test upload and access control

**Storage RLS Policy Examples:**

```sql
-- product-images: Public read
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- product-images: Authenticated upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- payment-proofs: Owner read
CREATE POLICY "Owner read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 3. Environment Variables

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep secret!)
- [ ] Set `NEXT_PUBLIC_APP_URL` (production domain)
- [ ] Optional: Set `RESEND_API_KEY` for emails
- [ ] Optional: Set `SENTRY_DSN` for error tracking

**Security Check:**

```bash
# Verify .env.local is in .gitignore
grep -q "\.env\.local" .gitignore && echo "✅ Safe" || echo "❌ Add to .gitignore!"
```

---

### 4. Dependencies

- [ ] Run `npm install`
- [ ] Verify all packages installed:
  - [ ] `isomorphic-dompurify` (security)
  - [ ] `file-type` (validation)
  - [ ] `qrcode` (QR generation)
  - [ ] `bwip-js` (barcode generation)
  - [ ] `@types/qrcode` (dev)

```bash
npm list isomorphic-dompurify file-type qrcode bwip-js
```

---

### 5. Authentication Setup

- [ ] Enable Email authentication in Supabase
- [ ] Configure email templates (optional)
- [ ] Set redirect URLs for auth
- [ ] Test user signup
- [ ] Test user login
- [ ] Test password reset

**Auth Redirect URLs:**

- Development: `http://localhost:3000/**`
- Production: `https://yourdomain.com/**`

---

## 🧪 Testing Checklist

### User Management

- [ ] **Sign Up**
  - [ ] Create customer account
  - [ ] Verify email sent
  - [ ] Check user created in database
  - [ ] Default role is 'customer'

- [ ] **Age Verification**
  - [ ] Upload ID documents (JPEG, PNG, PDF)
  - [ ] Submit with consents
  - [ ] Admin can view pending verifications
  - [ ] Admin can approve/reject
  - [ ] User receives notification
  - [ ] `is_verified` flag updated

- [ ] **User Admin**
  - [ ] View all users
  - [ ] Force logout user
  - [ ] Deactivate user
  - [ ] Change user role
  - [ ] Delete user (requires confirmation)

---

### Product Management

- [ ] **Categories & Brands**
  - [ ] Create category
  - [ ] Create child category (hierarchy)
  - [ ] Create brand
  - [ ] Prevent deletion if products exist

- [ ] **Products**
  - [ ] Create product
  - [ ] Upload multiple images
  - [ ] Set primary image
  - [ ] Update product
  - [ ] Search products (text, filters)
  - [ ] Autocomplete works
  - [ ] Delete product

- [ ] **Product Variants**
  - [ ] Enable variants on product
  - [ ] Create variant (nicotine level, size, flavor)
  - [ ] Generate barcode for variant
  - [ ] Update variant stock
  - [ ] Prevent deletion if ordered

---

### Shopping Flow

- [ ] **Cart**
  - [ ] Add product to cart
  - [ ] Add variant to cart
  - [ ] Update quantity (stock validation)
  - [ ] Auto-merge duplicate items
  - [ ] Remove from cart
  - [ ] VAT calculated correctly (12%)
  - [ ] Cart persists across sessions

- [ ] **Checkout**
  - [ ] Create order from cart
  - [ ] Stock decreases correctly
  - [ ] Cart clears after order
  - [ ] Order number generated (ORD-YYYYMMDD-XXXX)
  - [ ] Shipping address saved
  - [ ] Order appears in customer's history

---

### Payment Flow

- [ ] **Payment Proof**
  - [ ] Upload payment proof (PDF/image)
  - [ ] File size validation (10MB max)
  - [ ] Admin sees pending proofs
  - [ ] Admin extracts data (ref, amount, method)

- [ ] **Payment Verification**
  - [ ] Staff scans barcode/QR
  - [ ] Reference number lookup works
  - [ ] Duplicate detection works
  - [ ] Order status updates to 'processing'
  - [ ] Payment status becomes 'paid'
  - [ ] Verification log created

---

### Reviews System

- [ ] **Customer Reviews**
  - [ ] Only purchased products can be reviewed
  - [ ] No duplicate reviews
  - [ ] Review requires moderation
  - [ ] Upload review images
  - [ ] Vote helpful/not helpful

- [ ] **Review Moderation**
  - [ ] Admin sees pending reviews
  - [ ] Approve review (becomes visible)
  - [ ] Reject/hide review
  - [ ] Bulk approve reviews

---

### Returns & Refunds

- [ ] **Return Request**
  - [ ] 30-day window enforced
  - [ ] Must have purchased product
  - [ ] Select items and quantities
  - [ ] Choose return method (refund/exchange/credit)

- [ ] **Return Processing**
  - [ ] Admin approves return
  - [ ] Stock restocked correctly
  - [ ] Refund processed (to original/credit/cash)
  - [ ] Store credit created if applicable
  - [ ] Customer receives notification

---

### Point of Sale

- [ ] **Shift Management**
  - [ ] Clock in with opening cash
  - [ ] Create POS transaction
  - [ ] Stock decreases
  - [ ] Shift totals update
  - [ ] Clock out (cash difference calculated)

- [ ] **Parked Orders**
  - [ ] Park order
  - [ ] Retrieve parked order
  - [ ] Auto-expire after 24hrs

---

### Analytics & Reports

- [ ] **Sales Reports**
  - [ ] Sales overview shows correct totals
  - [ ] Top products ranked correctly
  - [ ] Daily sales chart data accurate
  - [ ] Date range filters work

- [ ] **Customer Analytics**
  - [ ] Total customers count
  - [ ] Verified customers count
  - [ ] Top spenders ranked
  - [ ] New customers this month

- [ ] **Inventory Insights**
  - [ ] Low stock alerts
  - [ ] Out of stock count
  - [ ] Total inventory value calculation

---

### Barcodes & QR Codes

- [ ] **Product Codes**
  - [ ] Generate product QR (links to page)
  - [ ] Generate product barcode (from SKU)
  - [ ] Bulk generate QR codes

- [ ] **Order Codes**
  - [ ] Generate order QR (for pickup)
  - [ ] Verification code correct format

- [ ] **Payment Codes**
  - [ ] Generate payment QR (from reference)
  - [ ] QR scan works in verification

---

### Email Notifications

- [ ] **Order Emails**
  - [ ] Order confirmation sent
  - [ ] Payment verified email sent
  - [ ] Order ready email sent

- [ ] **User Emails**
  - [ ] Welcome email sent
  - [ ] Age verification result sent

- [ ] **Return Emails**
  - [ ] Return approved email sent
  - [ ] Return rejected email sent

- [ ] **Admin Alerts**
  - [ ] Low stock alert sent to admins

**Note:** Configure email service (Resend, SendGrid, etc.) or emails will only log to console.

---

## 🔒 Security Testing

### Input Validation

- [ ] XSS prevented (HTML sanitization works)
- [ ] SQL injection prevented (parameterized queries)
- [ ] File upload validation works
- [ ] MIME type checking works
- [ ] File size limits enforced
- [ ] Malicious filenames rejected

**Test Cases:**

```javascript
// Try XSS
await submitReview({
  comment: '<script>alert("XSS")</script>',
});
// Should be sanitized

// Try oversized file
// Upload 11MB PDF
// Should be rejected

// Try wrong file type
// Upload .exe file
// Should be rejected
```

---

### Authorization

- [ ] Customer cannot access admin routes
- [ ] Staff cannot delete users (admin only)
- [ ] Customer can only view own orders
- [ ] RLS prevents data leaks
- [ ] Service role only used where necessary

**Test Cases:**

```javascript
// As customer, try to access admin function
await deleteUser("some-user-id");
// Should return FORBIDDEN error

// Try to access another user's order
await getOrderDetails("not-my-order-id");
// Should return NOT_FOUND or FORBIDDEN
```

---

### Audit Logging

- [ ] Admin actions logged
- [ ] Logs include user ID, timestamp
- [ ] Logs include old/new values
- [ ] Payment verifications logged
- [ ] User deletions logged

**Verify:**

```sql
SELECT * FROM audit_log
WHERE action = 'delete_user'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - [ ] Push code to GitHub
   - [ ] Connect Vercel to repository
   - [ ] Import project

2. **Environment Variables**
   - [ ] Add all `.env.local` variables to Vercel
   - [ ] Use production Supabase project
   - [ ] Set `NEXT_PUBLIC_APP_URL` to production domain

3. **Build Settings**
   - [ ] Framework preset: Next.js
   - [ ] Build command: `npm run build`
   - [ ] Output directory: `.next`

4. **Domain**
   - [ ] Configure custom domain
   - [ ] Update Supabase auth redirect URLs
   - [ ] Test authentication flow

---

### Database Migrations

For future schema changes:

```bash
# Create migration
supabase migration new add_new_feature

# Edit migration file
code supabase/migrations/timestamp_add_new_feature.sql

# Apply locally
supabase db push

# Apply to production (in Supabase dashboard)
# Copy migration SQL and run in SQL Editor
```

---

### Performance Optimization

- [ ] **Database Indexes**

  ```sql
  -- Check slow queries
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;

  -- Add indexes as needed
  CREATE INDEX idx_orders_customer_created
  ON orders(customer_id, created_at DESC);
  ```

- [ ] **Image Optimization**
  - [ ] Use Next.js Image component
  - [ ] Enable Vercel image optimization
  - [ ] Lazy load images

- [ ] **Caching**
  - [ ] Cache product listings (React Query)
  - [ ] Cache static pages (ISR)
  - [ ] CDN for images

- [ ] **Database Connection Pooling**
  ```javascript
  // In lib/supabase/server.ts
  // Supabase automatically handles pooling
  // Monitor connection count in Supabase dashboard
  ```

---

## 📊 Monitoring

### Error Tracking

- [ ] Set up Sentry or similar
- [ ] Monitor server action errors
- [ ] Set up error alerts
- [ ] Track user sessions

### Analytics

- [ ] Google Analytics 4
- [ ] Track conversions (orders)
- [ ] Track funnel (view → cart → checkout → order)
- [ ] Monitor bounce rate

### Database Monitoring

- [ ] Monitor query performance
- [ ] Set up slow query alerts
- [ ] Monitor storage usage
- [ ] Monitor connection count

**Supabase Metrics to Watch:**

- Database size
- API requests per second
- Authentication requests
- Storage usage

---

## 🧰 Development Workflow

### Git Workflow

```bash
# Feature branch
git checkout -b feature/product-variants

# Make changes
git add .
git commit -m "feat: add product variants system"

# Push
git push origin feature/product-variants

# Create PR, merge to main
# Vercel auto-deploys on merge
```

### Testing Workflow

```bash
# Run type check
npm run type-check

# Run linter
npm run lint

# Run tests (if configured)
npm test

# Build check
npm run build
```

### Code Review Checklist

- [ ] No console.logs in production code
- [ ] Error handling present
- [ ] Type safety (no `any` types)
- [ ] Comments for complex logic
- [ ] Audit logging for admin actions
- [ ] RLS policies tested
- [ ] Input sanitization applied

---

## 📝 Documentation

- [ ] Update README.md with setup instructions
- [ ] Document API endpoints (API_REFERENCE.md) ✅
- [ ] Document deployment process ✅
- [ ] Create user manual for staff
- [ ] Create admin training guide

---

## 🎯 Launch Checklist

### Day Before Launch

- [ ] Final database backup
- [ ] Test all critical flows end-to-end
- [ ] Verify production environment variables
- [ ] Test email notifications
- [ ] Clear test data from production DB
- [ ] Create initial admin user
- [ ] Import initial product catalog
- [ ] Set up categories and brands
- [ ] Test payment verification flow

### Launch Day

- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test authentication
- [ ] Test one complete order flow
- [ ] Monitor error logs
- [ ] Monitor server load
- [ ] Have rollback plan ready

### Post-Launch (First Week)

- [ ] Monitor daily for errors
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Monitor database performance
- [ ] Check email deliverability
- [ ] Verify payment verifications working
- [ ] Review analytics data

---

## 🐛 Common Issues & Solutions

### Issue: "User not found" after signup

**Solution:** Check if user was created in `auth.users` and `public.users` trigger fired.

### Issue: Images not uploading

**Solution:**

1. Check storage bucket exists
2. Verify RLS policies allow upload
3. Check file size/type validation
4. Inspect browser network tab

### Issue: "Insufficient permissions"

**Solution:**

1. Check user role in database
2. Verify RLS policies on table
3. Check `requireRole()` in server action

### Issue: Orders not decreasing stock

**Solution:**

1. Check if `createOrderFromCart` transaction completed
2. Verify stock_quantity column updated
3. Check for database triggers interfering

### Issue: Emails not sending

**Solution:**

1. Verify RESEND_API_KEY set
2. Check Resend dashboard for errors
3. Confirm email service configured in `notifications.ts`

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **This Project:**
  - `SETUP_INSTRUCTIONS.md` - Database setup
  - `IMPLEMENTATION_SUMMARY.md` - Feature overview
  - `API_REFERENCE.md` - Complete API docs

---

## ✅ Final Checklist

Before going live:

- [ ] All database tables created
- [ ] Storage buckets configured
- [ ] RLS policies active
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Build succeeds without errors
- [ ] No TypeScript errors
- [ ] Core flows tested end-to-end
- [ ] Admin user created
- [ ] Test data cleared
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Documentation complete

---

**Status:** Ready for deployment 🚀

**Last Updated:** 2024
