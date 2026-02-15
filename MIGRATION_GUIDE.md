# Migration Guide: Current Schema → Improved Schema

## Overview

This guide helps you transition from your current database schema to the improved schema. Choose the appropriate path based on whether you have production data.

---

## 🎯 Migration Paths

### Path A: Fresh Start (Recommended - No Production Data)

**When to use:**

- Development environment
- No important data to preserve
- Starting fresh

**Steps:**

1. Backup current database (just in case)
2. Drop all existing tables
3. Run `IMPROVED_SCHEMA.sql`
4. Run sample seed data
5. Test thoroughly

### Path B: Incremental Migration (Has Production Data)

**When to use:**

- Production environment with data

- Need to preserve users, orders, products

**Steps:**

1. Full database backup
2. Run migration scripts step-by-step
3. Migrate data from old structure to new
4. Verify data integrity
5. Drop old columns/tables

---

## 📋 Path A: Fresh Start (Detailed Steps)

### Step 1: Backup Current Schema (Optional)

```bash
# Export current schema using Supabase dashboard
# Settings → Database → Backups → Create Manual Backup
```

Or using SQL:

```sql
-- Export table list
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Step 2: Drop All Existing Tables

**⚠️ WARNING: This will delete ALL data!**

```sql
-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS age_verifications CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS parked_orders CASCADE;
DROP TABLE IF EXISTS payment_proofs CASCADE;
DROP TABLE IF EXISTS po_items CASCADE;
DROP TABLE IF EXISTS product_details CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;
DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS address CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Step 3: Run Improved Schema

In Supabase SQL Editor:

1. Go to **SQL Editor**
2. Create new query
3. Copy entire contents of `IMPROVED_SCHEMA.sql`
4. Click **Run**
5. Verify no errors

### Step 4: Verify Tables Created

```sql
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see **40+ tables**.

### Step 5: Create Sample Data (Optional)

See `SAMPLE_SEED_DATA.sql` (I'll create this next).

---

## 📋 Path B: Incremental Migration (Detailed Steps)

### Step 1: Full Backup

```bash
# In Supabase Dashboard:
# Settings → Database → Backups → Create Manual Backup

# Or use pg_dump if you have direct access:
# pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

### Step 2: Add New Tables (Non-Destructive)

These tables can be added without affecting existing data:

```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images table
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table (CRITICAL!)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_attributes JSONB,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS transactions
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT NOT NULL UNIQUE,
  shift_id UUID REFERENCES staff_shifts(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  customer_id UUID REFERENCES users(id),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  cash_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  receipt_number TEXT UNIQUE,
  customer_email TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('completed', 'refunded', 'parked')) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS transaction items
CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Return items
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  quantity INTEGER NOT NULL,
  reason TEXT,
  condition TEXT CHECK (condition IN ('unopened', 'opened', 'defective', 'damaged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review votes
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Payment verification log
CREATE TABLE payment_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_proof_id UUID REFERENCES payment_proofs(id),
  reference_number TEXT NOT NULL,
  action TEXT NOT NULL,
  staff_id UUID REFERENCES users(id),
  result TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Migrate Existing Data

#### 3.1 Extract Categories from Products

```sql
-- Insert unique categories
INSERT INTO categories (name, slug, is_active)
SELECT DISTINCT
  category as name,
  LOWER(REPLACE(category, ' ', '-')) as slug,
  TRUE as is_active
FROM products
WHERE category IS NOT NULL;
```

#### 3.2 Add category_id to products table

```sql
-- Add new column
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);

-- Populate from existing category text
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name;
```

#### 3.3 Migrate Product Images

```sql
-- Migrate images from array to separate table
INSERT INTO product_images (product_id, url, sort_order, is_primary)
SELECT
  id as product_id,
  UNNEST(images) as url,
  ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) - 1 as sort_order,
  ROW_NUMBER() OVER (PARTITION BY id ORDER BY id) = 1 as is_primary
FROM products
WHERE images IS NOT NULL AND array_length(images, 1) > 0;
```

#### 3.4 Migrate Orders to Order Items

**⚠️ CRITICAL: Your current orders table has product_id. This needs migration!**

```sql
-- Migrate existing orders to order_items
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  sku,
  quanity,
  unit_price,
  subtotal
)
SELECT
  o.id as order_id,
  o.product_id,
  p.name as product_name,
  p.sku,
  o.quantity,
  o.price as unit_price,
  o.total_price as subtotal
FROM orders o
INNER JOIN products p ON o.product_id = p.id;
```

### Step 4: Update Products Table Structure

```sql
-- Add new columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT CHECK (product_type IN ('simple', 'variant')) DEFAULT 'simple';
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Convert pric to base_price
UPDATE products SET base_price = price WHERE base_price IS NULL;

-- Generate SKUs if missing
UPDATE products
SET sku = 'SKU- || SUBSTRING(id::TEXT, 1, 8)
WHERE sku IS NULL;

-- Generate slugs if missing
UPDATE products
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE slug IS NULL;

-- Make SKU unique
ALTER TABLE products ADD CONSTRAINT products_sku_unique UNIQUE (sku);
ALTER TABLE products ADD CONSTRAINT products_slug_unique UNIQUE (slug);
```

### Step 5: Fix Data Types

```sql
-- Change double precision to DECIMAL for existing money columns
-- This is tricky because you need to drop and recreate

-- For products table
ALTER TABLE products ALTER COLUMN base_price TYPE DECIMAL(10,2);
ALTER TABLE products ALTER COLUMN compare_at_price TYPE DECIMAL(10,2);
ALTER TABLE products ALTER COLUMN cost_price TYPE DECIMAL(10,2);

-- For orders table
ALTER TABLE orders ALTER COLUMN subtotal TYPE DECIMAL(10,2);
ALTER TABLE orders ALTER COLUMN tax TYPE DECIMAL(10,2);
ALTER TABLE orders ALTER COLUMN shipping_cost TYPE DECIMAL(10,2);
ALTER TABLE orders ALTER COLUMN discount TYPE DECIMAL(10,2);
ALTER TABLE orders ALTER COLUMN total TYPE DECIMAL(10,2);

-- Continue for other money columns...
```

### Step 6: Remove Old Columns

**⚠️ Only after verifying data migration is successful!**

```sql
-- Remove product_id from orders (now in order_items)
ALTER TABLE orders DROP COLUMN IF EXISTS product_id;
ALTER TABLE orders DROP COLUMN IF EXISTS quantity;
ALTER TABLE orders DROP COLUMN IF EXISTS price;
-- Keep total_price but rename if needed

-- Remove images array from products
ALTER TABLE products DROP COLUMN IF EXISTS images;

-- Remove category text from products
ALTER TABLE products DROP COLUMN IF EXISTS category;
```

### Step 7: Add Indexes

```sql
-- Products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Product variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode ON product_variants(barcode);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- POS transactions
CREATE INDEX IF NOT EXISTS idx_pos_transactions_shift_id ON pos_transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at);

-- Continue with other indexes from IMPROVED_SCHEMA.sql...
```

### Step 8: Enable RLS Policies

```sql
-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

-- Add policies (see IMPROVED_SCHEMA.sql for complete policies)
```

### Step 9: Add Triggers

```sql
-- Copy triggers from IMPROVED_SCHEMA.sql
-- Example: Update product rating trigger
CREAT OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
      FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    ),
    total_reviews = (
      SELECT COUNT(*)
    FROM product_reviews
      WHERE product_id = NEW.product_id AND is_approved = TRUE
    )
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_trigger
AFTER INSERT OR UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_product_rating();
```

---

## ✅ Verification Checklist

After migration, verify:

### Daa Integrity

```sql
-- Check all orders have order_items
SELECT
  COUNT(*) as orders_without_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE oi.id IS NULL;
-- Should be 0

-- Check all products have category
SELECTCOUNT(*) FROM products WHERE category_id IS NULL;
-- Should be 0 (or acceptable if you have uncategorized products)

-- Check image migration
SELECT
  p.id,
  p.name,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name
ORDER BY image_count DESC;
```

### Table Count

```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Should be 40+
```

### Index Count

```sql
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Verify all indexes exist
```

### RLS Policies

```sql
SELECT
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🚨 Rollback Plan

If something goes wrong during migration:

### Option 1: Restore from Backup

```bash
# In Supabase Dashboard:
# Settings → Database → Backups → Restore
```

### Option 2: Manual Rollback

If you've kept detailed logs of each step:

```sql
-- Reverse changes in opposite order
-- Drop new tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
-- etc...

-- Restore old columns
ALTER TABLE products ADD COLUMN category TEXT;
ALTER TABLE orders ADD COLUMN product_id UUID;
-- etc...
```

---

## 📊 Post-Migration Tasks

### 1. Update Application Code

Your API calls need updates:

**Before"**"
""

```typ"sc"ipt
// Old: Orders with single product
const order = await supabase
  .from('orders')

  .select('*, products(*)')
  .eq('id', orderId);
```

""
**After:**

```typescript
// New: Orders with multiple items
const order = await supabase
  .from("orders")
  .select(
    `
   
   *,
    or"er"items (
      *,
      products (*),
      product_variants (*)
    )
  `
  )
  .eq("id", orderId);
```

### 2. Update Server Actions

See `/app/actions/` files - these need updates to work with new schema.

### 3. Test Critical Flows

- [ ] User signup
- [ ] Product browsing
- [ ] Add to cart (with variants)
- [ ] Checkout (multiple products)
- [ ] Payment upload
- [ ] POS transaction
- [ ] Inventory management
- [ ] Reports

### 4. Repopulate Materialized Views (if any)

```sql
REFRESH MATERIALIZED VIEW IF EXISTS sales_summary;
```

---

## 🎯 Recommended Approach

**For most users, I recommend Path A (Fresh Start) because:**

1. ✅ Cleaner - no legacy issues
2. ✅ Faster - no complex migration
3. ✅ Safer - less chance of errors
4. ✅ Testing phase - you likely don't have production data yet

**Only use Path B if:**

- You have production users
- You have real orders/transactions
- Data loss is unacceptable

---

## 📞 Need Help?ay

---

## Next Steps

1. ✅ Review this guide
2. ⏳ Choose migration path (A or B)
3. ⏳ Crete backup
4. ⏳ Run migration
5. ⏳ Verif data
6. ⏳ Update application code
7. ⏳ Test thoroughly

If

\_Last Updated: February 15, 2026_you encounter issues during migration:

1. **Check Supabase logs**: Database → Logs
2. **Test queries**: Use SQL Editor to verify data
3. **Incremental testing**: Don't run everything at once
4. **Keep backups**: Every step of the way

---

## Next Steps

1. ✅ Review this guide
2. ⏳ Choose migration path (A or B)
3. ⏳ Create backup
4. ⏳ Run migration
5. ⏳ Verify data
6. ⏳ Update application code
7. ⏳ Test thoroughly

---

_Last Updated: February 15, 2026_
