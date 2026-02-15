# Complete Database Schema for Vapour Lounge

## Overview

Comprehensive Supabase PostgreSQL database schema for the complete vape shop e-commerce system.

---

## 1. Authentication & Users

### 1.1 Profiles (extends auth.users)

```sql
-- Main profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')) DEFAULT 'customer',
  avatar_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 1.2 Customer Profiles

```sql
CREATE TABLE customer_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  date_of_birth DATE,
  age_verified BOOLEAN DEFAULT FALSE,
  id_verification_url TEXT,
  id_verified_at TIMESTAMPTZ,
  id_verified_by UUID REFERENCES profiles(id),
  consent_timestamp TIMESTAMPTZ,
  newsletter_subscribed BOOLEAN DEFAULT FALSE,
  preferred_payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own data" ON customer_profiles
  FOR SELECT USING (auth.uid() = id);
```

### 1.3 Staff Profiles

```sql
CREATE TABLE staff_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  hire_date DATE NOT NULL,
  position TEXT,
  hourly_rate DECIMAL(10, 2),
  permissions JSONB DEFAULT'{}'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions example:
-- {
--   "can_edit_prices": false,
--   "can_delete_products": false,
--   "can_process_refunds": true,
--   "can_view_reports": true
-- }

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage staff" ON staff_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can view own data" ON staff_profiles
  FOR SELECT USING (auth.uid() = id);
```

### 1.4 Customer Addresses

```sql
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT, -- 'Home', 'Work', etc.
  is_default BOOLEAN DEFAULT FALSE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Philippines',
  delivery_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage own addresses" ON customer_addresses
  FOR ALL USING (auth.uid() = customer_id);
```

---

## 2. Products & Inventory

### 2.1 Categories

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Example: Vape Juice, Devices, Accessories, Coils, Batteries
```

### 2.2 Brands

```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);
```

### 2.3 Products

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  base_price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2), -- Original price for discount display
  cost_price DECIMAL(10, 2), -- For profit calculation
  featured BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT TRUE,
  tags TEXT[], -- ['new-arrival', 'best-seller', 'sale']

  -- Product type specific
  product_type TEXT CHECK (product_type IN ('simple', 'variant')),
  has_variants BOOLEAN DEFAULT FALSE,

  -- Stock tracking (for simple products)
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Stats
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_published ON products(published);
```

### 2.4 Product Variants

```sql
-- For nicotine levels, flavors, sizes, etc.
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,

  -- Variant attributes
  attributes JSONB NOT NULL,
  -- Example: {"nicotine_level": "3mg", "flavor": "Strawberry", "size": "60ml"}

  -- Pricing (can override base price)
  price DECIMAL(10, 2),
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),

  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,

  -- Display
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
```

### 2.5 Product Images

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
```

### 2.6 Inventory Batches (for expiry tracking)

```sql
CREATE TABLE inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  batch_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  cost_per_unit DECIMAL(10, 2),
  manufacture_date DATE,
  expiry_date DATE,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('active', 'expired', 'recalled', 'sold_out')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_variant_id ON inventory_batches(variant_id);
CREATE INDEX idx_inventory_batches_expiry_date ON inventory_batches(expiry_date);
```

### 2.7 Stock Adjustments

```sql
CREATE TABLE stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  batch_id UUID REFERENCES inventory_batches(id),
  adjustment_type TEXT CHECK (adjustment_type IN (
    'stock_in',      -- Delivery/purchase
    'stock_out',     -- Sale
    'adjustment',    -- Manual correction
    'damaged',       -- Damaged goods
    'expired',       -- Expired products
    'stolen',        -- Theft
    'return'         -- Customer return
  )),
  quantity_change INTEGER NOT NULL, -- Positive or negative
  reason TEXT,
  reference_id UUID, -- Link to PO, sale, etc.
  adjusted_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_created_at ON stock_adjustments(created_at);
```

---

## 3. Suppliers & Purchase Orders

### 3.1 Suppliers

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  payment_terms TEXT, -- 'Net 30', 'COD', etc.
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Purchase Orders

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  status TEXT CHECK (status IN (
    'draft',
    'sent',
    'confirmed',
    'partially_received',
    'received',
    'cancelled'
  )) DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
```

### 3.3 Purchase Order Items

```sql
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  expected_expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
```

---

## 4. Orders & Sales

### 4.1 Orders

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id),

  -- Order status
  status TEXT CHECK (status IN (
    'pending',         -- Created, awaiting payment
    'paid',            -- Payment confirmed
    'processing',      -- Being prepared
    'packed',          -- Ready to ship
    'shipped',         -- Out for delivery
    'delivered',       -- Completed
    'cancelled',       -- Cancelled
    'refunded'         -- Refunded
  )) DEFAULT 'pending',

  -- Payment
  payment_status TEXT CHECK (payment_status IN (
    'unpaid',
    'pending',         -- Payment uploaded, awaiting verification
    'paid',
    'failed',
    'refunded'
  )) DEFAULT 'unpaid',
  payment_method TEXT, -- 'cash', 'gcash', 'paymaya', 'upload'
  paid_at TIMESTAMPTZ,

  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Shipping
  shipping_address_id UUID REFERENCES customer_addresses(id),
  shipping_full_name TEXT,
  shipping_phone TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  delivery_instructions TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Notes
  customer_notes TEXT,
  staff_notes TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### 4.2 Order Items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  product_name TEXT NOT NULL, -- Snapshot at time of order
  variant_attributes JSONB,   -- Snapshot
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 4.3 Order Status History

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
```

---

## 5. POS System

### 5.1 POS Shifts

```sql
CREATE TABLE pos_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  register_id TEXT NOT NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_cash DECIMAL(10, 2) NOT NULL,
  closing_cash DECIMAL(10, 2),
  expected_cash DECIMAL(10, 2),
  cash_difference DECIMAL(10, 2),
  total_sales DECIMAL(10, 2) DEFAULT 0,
  total_refunds DECIMAL(10, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pos_shifts_staff_id ON pos_shifts(staff_id);
CREATE INDEX idx_pos_shifts_opened_at ON pos_shifts(opened_at);
```

### 5.2 POS Transactions

```sql
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES pos_shifts(id),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id),
  transaction_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB, -- For split payments: {cash: 100, gcash: 67.97}
  cash_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  receipt_number TEXT UNIQUE,
  customer_email TEXT,
  notes TEXT,
  status TEXT CHECK (status IN ('completed', 'refunded', 'parked')) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pos_transactions_shift_id ON pos_transactions(shift_id);
CREATE INDEX idx_pos_transactions_created_at ON pos_transactions(created_at);
```

### 5.3 POS Transaction Items

```sql
CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
```

### 5.4 Parked Orders

```sql
CREATE TABLE parked_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  cart_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_parked_orders_staff_id ON parked_orders(staff_id);
```

---

## 6. Payment Verification

```sql
CREATE TABLE payment_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT NOT NULL,
  reference_number TEXT,
  amount DECIMAL(10, 2),
  payment_method TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  extracted_at TIMESTAMPTZ,
  extracted_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN (
    'pending_extraction',
    'extracted',
    'verified',
    'rejected',
    'duplicate'
  )) DEFAULT 'pending_extraction',
  rejection_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_uploads_order_id ON payment_uploads(order_id);
CREATE INDEX idx_payment_uploads_reference_number ON payment_uploads(reference_number);

CREATE TABLE payment_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_upload_id UUID REFERENCES payment_uploads(id),
  reference_number TEXT NOT NULL,
  action TEXT NOT NULL,
  staff_id UUID REFERENCES profiles(id),
  result TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Returns & Refunds

```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  detailed_reason TEXT,
  images TEXT[], -- Photos of defective items
  status TEXT CHECK (status IN (
    'requested',
    'approved',
    'rejected',
    'received',
    'refunded'
  )) DEFAULT 'requested',
  refund_amount DECIMAL(10, 2),
  refund_method TEXT, -- 'original_payment', 'store_credit', 'exchange'
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  condition TEXT CHECK (condition IN ('unopened', 'opened', 'defective', 'damaged')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. Reviews & Ratings

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  order_id UUID REFERENCES orders(id), -- Verified purchase
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')) DEFAULT 'pending',
  moderated_by UUID REFERENCES profiles(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_customer_id ON product_reviews(customer_id);

-- Review helpfulness votes
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);
```

---

## 9. Notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL, -- 'order_update', 'low_stock', 'new_review', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

---

## 10. Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  table_name TEXT,
  record_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
```

---

## 11. Settings

```sql
CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example settings:
-- shop_name, shop_address, contact_email, contact_phone
-- tax_rate, shipping_cost, currency
-- low_stock_threshold, enable_reviews, require_age_verification
-- smtp_settings, payment_gateway_settings
```

---

## 12. Utility Functions

### 12.1 Decrease Stock

```sql
CREATE OR REPLACE FUNCTION decrease_variant_stock(
  variant_id UUID,
  quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - quantity
  WHERE id = variant_id;

  -- Log adjustment
  INSERT INTO stock_adjustments (
    variant_id,
    adjustment_type,
    quantity_change,
    adjusted_by
  ) VALUES (
    variant_id,
    'stock_out',
    -quantity,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 12.2 Update Product Rating

```sql
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET average_rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM product_reviews
    WHERE product_id = NEW.product_id
    AND status = 'approved'
  ),
  review_count = (
    SELECT COUNT(*)
    FROM product_reviews
    WHERE product_id = NEW.product_id
    AND status = 'approved'
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

## 13. Indexes for Performance

```sql
-- Add these additional indexes for common queries

-- Product searches
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING gin (description gin_trgm_ops);

-- Order searches
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Date range queries
CREATE INDEX idx_orders_created_date ON orders(DATE(created_at));
CREATE INDEX idx_pos_transactions_created_date ON pos_transactions(DATE(created_at));
```

---

## Next Steps

1. Run migrations in Supabase dashboard
2. Enable RLS on all tables
3. Create necessary indexes
4. Test with sample data
5. Set up database backups
6. Configure replication (if needed)

---

## Notes

- All monetary values use DECIMAL(10, 2)
- All timestamps use TIMESTAMPTZ for timezone awareness
- UUIDs used for all primary keys
- Foreign keys have ON DELETE CASCADE where appropriate
- RLS enabled for security
- Audit trails for critical operations
- JSONB for flexible metadata storage
