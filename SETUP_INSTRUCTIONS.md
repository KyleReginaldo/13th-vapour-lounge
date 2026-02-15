# 🚀 Phase 0: Foundation Setup Instructions

This guide walks you through setting up the database schema and storage buckets for Vapour Lounge.

---

## ✅ Prerequisites

- [ ] Supabase project created (https://supabase.com)
- [ ] Project URL and keys saved
- [ ] Environment variables configured in `.env.local`

**Required environment variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!
```

---

## 📊 Step 1: Deploy Database Schema

### 1.1. Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 1.2. Run IMPROVED_SCHEMA.sql

1. Open the file [`IMPROVED_SCHEMA.sql`](./IMPROVED_SCHEMA.sql)
2. Copy the entire contents (972 lines)
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl/Cmd + Enter`)

**Expected result:** Schema successfully created

### 1.3. Verify Tables Created

Run this query to verify all 40+ tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected count:** 40+ tables including:

- roles, users, age_verifications
- categories, brands, products, product_variants
- orders, order_items
- pos_transactions, staff_shifts
- payment_proofs, inventory_batches
- etc.

### 1.4. Load Sample Data (Optional - for Development)

1. Open the file [`SAMPLE_SEED_DATA.sql`](./SAMPLE_SEED_DATA.sql)
2. Copy the contents
3. Paste into Supabase SQL Editor
4. Click **Run**

**What this adds:**

- 3 roles (admin, staff, customer)
- 8 categories (E-liquids, Devices, etc.)
- 10 brands (Vapetasia, SMOK, etc.)
- 6 sample products with variants
- Sample users and addresses

---

## 🗄️ Step 2: Create Storage Buckets

### 2.1. Navigate to Storage

1. In Supabase dashboard, go to **Storage** in left sidebar
2. Click **Create a new bucket**

### 2.2. Create Buckets

Create the following 3 buckets:

#### **Bucket 1: product-images**

- **Name:** `product-images`
- **Public bucket:** ✅ Yes (images need to be publicly accessible)
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

**Configuration:**

```javascript
{
  "maxFileSize": 5242880,
  "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"]
}
```

#### **Bucket 2: id-verifications**

- **Name:** `id-verifications`
- **Public bucket:** ❌ No (sensitive documents - private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`

**Configuration:**

```javascript
{
  "maxFileSize": 10485760,
  "allowedMimeTypes": ["image/jpeg", "image/png", "application/pdf"]
}
```

#### **Bucket 3: payment-proofs**

- **Name:** `payment-proofs`
- **Public bucket:** ❌ No (sensitive documents - private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `application/pdf`

**Configuration:**

```javascript
{
  "maxFileSize": 10485760,
  "allowedMimeTypes": ["image/jpeg", "image/png", "application/pdf"]
}
```

### 2.3. Set Storage Policies

For private buckets (`id-verifications` and `payment-proofs`), add RLS policies:

**Navigate to:** Storage → [bucket-name] → Policies

#### Policy 1: Users can upload their own files

```sql
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Users can view their own files

```sql
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Admins can view all files

```sql
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    INNER JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name = 'admin'
  )
);
```

---

## 🔐 Step 3: Verify Row Level Security (RLS)

RLS is already enabled in `IMPROVED_SCHEMA.sql` for sensitive tables.

**Test RLS is working:**

```sql
-- This should return RLS status for all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** RLS enabled (`true`) for:

- users
- age_verifications
- customer_addresses
- carts
- orders
- order_items
- payment_proofs
- returns
- product_reviews
- notifications

---

## ✅ Step 4: Verification Checklist

Run these checks to ensure everything is set up correctly:

### Database

- [ ] All 40+ tables created
- [ ] Sample data loaded (if using development mode)
- [ ] RLS policies active on sensitive tables
- [ ] Triggers created (`update_product_rating`, `update_updated_at`)
- [ ] Functions created (`decrease_variant_stock`, `generate_order_number`)
- [ ] Indexes created for performance

**Verification query:**

```sql
-- Check tables
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
-- Should be 40+

-- Check RLS policies
SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';
-- Should be 10+

-- Check functions
SELECT COUNT(*) as function_count FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
-- Should be 3+

-- Check indexes
SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public';
-- Should be 50+
```

### Storage

- [ ] `product-images` bucket created (public)
- [ ] `id-verifications` bucket created (private)
- [ ] `payment-proofs` bucket created (private)
- [ ] RLS policies configured on private buckets

**Test upload (in code):**

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();

// Test upload
const { data, error } = await supabase.storage
  .from("product-images")
  .upload("test.jpg", file);

console.log(data, error);
```

### Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-side only)

---

## 🎯 Next Steps

**Phase 0 Complete!** ✅

You can now proceed to **Phase 1: Authentication & Security**

**What to do next:**

1. Create age verification file upload action
2. Build admin approval system
3. Implement force logout feature
4. Enhance audit logging

Refer to [`PROGRESS_TRACKER.md`](./PROGRESS_TRACKER.md) for the full implementation checklist.

---

## 🐛 Troubleshooting

### Issue: "relation already exists" error

**Solution:** Tables already created. Either:

- Drop all tables and re-run schema: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- Or skip to loading sample data

### Issue: Storage policy errors

**Solution:** Make sure you're creating policies in the correct bucket and the RLS is enabled.

### Issue: Service role key not working

**Solution:**

- Verify key is correct in Supabase dashboard → Settings → API
- Make sure it's set in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`
- Restart Next.js dev server after adding env var

### Issue: Can't upload files to storage

**Solution:**

- Check bucket exists
- Verify RLS policies allow your user to upload
- Check file size and MIME type restrictions

---

## 📚 Related Documentation

- [DATABASE_README.md](./DATABASE_README.md) - Database overview
- [SCHEMA_ANALYSIS.md](./SCHEMA_ANALYSIS.md) - What was improved and why
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migrating from old schema
- [IMPROVED_SCHEMA.sql](./IMPROVED_SCHEMA.sql) - Full schema SQL
- [SAMPLE_SEED_DATA.sql](./SAMPLE_SEED_DATA.sql) - Test data

---

**Need help?** Check the Supabase documentation:

- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
