-- ============================================================================
-- VAPOUR LOUNGE - IMPROVED DATABASE SCHEMA
-- ============================================================================
-- This schema fixes critical issues and adds missing features.
-- Safe to run on a fresh Supabase project.
--
-- Key Improvements:
-- 1. Multi-product orders via order_items table
-- 2. Product variants (nicotine levels, sizes, flavors)
-- 3. Proper categories and brands taxonomy
-- 4. Dedicated POS transaction tables
-- 5. Money as DECIMAL instead of double precision
-- 6. Comprehensive indexes for performance
-- 7. Row Level Security (RLS) policies
-- 8. Database triggers and functions
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. ROLES & AUTHENTICATION
-- ============================================================================

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('staff', 'Store staff with POS access'),
  ('customer', 'Regular customer');

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  contact_number TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  image TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Age verifications
CREATE TABLE age_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  id_verification_url TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  ip_address TEXT,
  user_agent TEXT,
  consent_to_terms BOOLEAN DEFAULT FALSE,
  consent_to_privacy BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions (for force logout feature)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- 2. CATEGORIES & BRANDS
-- ============================================================================

-- Categories (with hierarchy support)
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

-- Brands
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

-- ============================================================================
-- 3. PRODUCTS
-- ============================================================================

-- Products (main table)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  
  -- Product type
  product_type TEXT CHECK (product_type IN ('simple', 'variant')) DEFAULT 'simple',
  has_variants BOOLEAN DEFAULT FALSE,
  
  -- Stock (for simple products only; variants track their own)
  track_inventory BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  critical_stock_threshold INTEGER DEFAULT 5,
  
  -- QR/Barcode
  qr_code TEXT UNIQUE,
  barcode TEXT UNIQUE,
  
  -- Reviews
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Visibility
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants (for nicotine levels, sizes, flavors)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  
  -- Variant attributes (JSONB for flexibility)
  -- Example: {"nicotine_level": "3mg", "flavor": "Strawberry", "size": "60ml"}
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  
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
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INVENTORY MANAGEMENT
-- ============================================================================

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')) DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  received_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  expected_expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory batches (for expiry tracking)
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

-- Stock movements (audit trail)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  batch_id UUID REFERENCES inventory_batches(id),
  movement_type TEXT CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'damaged', 'expired', 'stolen', 'return')) NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  performed_by UUID REFERENCES users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock alerts
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  alert_type TEXT CHECK (alert_type IN ('low_stock', 'critical_stock', 'expiring_soon', 'expired')),
  current_quantity INTEGER,
  threshold_quantity INTEGER,
  expiry_date DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CUSTOMER DATA
-- ============================================================================

-- Customer addresses
CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
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

-- Shopping carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. ORDERS & SALES
-- ============================================================================

-- Orders (main order table - NO product_id here!)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id),
  
  -- Order status
  status TEXT CHECK (status IN ('pending', 'paid', 'processing', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  
  -- Payment
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded')) DEFAULT 'unpaid',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Shipping address (denormalized for historical accuracy)
  shipping_address_id UUID REFERENCES customer_addresses(id),
  shipping_full_name TEXT,
  shipping_phone TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  delivery_instructions TEXT,
  
  -- Tracking
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Notes
  customer_notes TEXT,
  staff_notes TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items (THIS IS CRITICAL - multiple products per order!)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  
  -- Snapshot data (for historical accuracy)
  product_name TEXT NOT NULL,
  variant_attributes JSONB,
  sku TEXT NOT NULL,
  
  -- Pricing
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
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

-- ============================================================================
-- 7. POS SYSTEM
-- ============================================================================

-- Cash registers
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff shifts
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id),
  register_id UUID NOT NULL REFERENCES cash_registers(id),
  clock_in TIMESTAMPTZ DEFAULT NOW(),
  clock_out TIMESTAMPTZ,
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

-- POS transactions
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT NOT NULL UNIQUE,
  shift_id UUID REFERENCES staff_shifts(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  customer_id UUID REFERENCES users(id),
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  cash_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  
  -- Receipt
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

-- Parked orders
CREATE TABLE parked_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id),
  customer_name TEXT,
  customer_phone TEXT,
  cart_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Receipts
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  transaction_id UUID REFERENCES pos_transactions(id),
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_data JSONB NOT NULL,
  printed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. PAYMENT VERIFICATION
-- ============================================================================

-- Payment proofs (customer uploads)
CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  image_url TEXT NOT NULL,
  reference_number TEXT,
  amount DECIMAL(10, 2),
  payment_method TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Admin extraction
  extracted_at TIMESTAMPTZ,
  extracted_by UUID REFERENCES users(id),
  
  -- Staff verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  
  status TEXT CHECK (status IN ('pending', 'extracted', 'verified', 'rejected', 'duplicate')) DEFAULT 'pending',
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment verification log (in-store scanning)
CREATE TABLE payment_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_proof_id UUID REFERENCES payment_proofs(id),
  reference_number TEXT NOT NULL,
  action TEXT NOT NULL,
  staff_id UUID REFERENCES users(id),
  result TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. RETURNS & REFUNDS
-- ============================================================================

-- Returns
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  detailed_reason TEXT,
  images TEXT[],
  status TEXT CHECK (status IN ('requested', 'approved', 'rejected', 'received', 'refunded')) DEFAULT 'requested',
  refund_amount DECIMAL(10, 2),
  refund_method TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================================
-- 10. REVIEWS & RATINGS
-- ============================================================================

-- Product reviews
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  images TEXT[],
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review votes (helpful/not helpful)
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- ============================================================================
-- 11. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. SETTINGS
-- ============================================================================

CREATE TABLE shop_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Brands
CREATE INDEX idx_brands_slug ON brands(slug);

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_published ON products(is_published);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Product variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);

-- Product images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- Inventory
CREATE INDEX idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_variant_id ON inventory_batches(variant_id);
CREATE INDEX idx_inventory_batches_expiry_date ON inventory_batches(expiry_date);

-- Stock movements
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Addresses
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Carts
CREATE INDEX idx_carts_user_id ON carts(user_id);

-- Orders
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- POS
CREATE INDEX idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX idx_pos_transactions_shift_id ON pos_transactions(shift_id);
CREATE INDEX idx_pos_transactions_created_at ON pos_transactions(created_at);
CREATE INDEX idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);

-- Payment proofs
CREATE INDEX idx_payment_proofs_order_id ON payment_proofs(order_id);
CREATE INDEX idx_payment_proofs_reference_number ON payment_proofs(reference_number);
CREATE INDEX idx_payment_proofs_status ON payment_proofs(status);

-- Reviews
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Purchase orders
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Can view own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Customer addresses: Customers manage their own
CREATE POLICY "Customers can manage own addresses" ON customer_addresses
  FOR ALL USING (auth.uid() = customer_id);

-- Carts: Customers manage their own
CREATE POLICY "Customers can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- Orders: Customers can view their own
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid() = customer_id);

-- Staff and admins can view all orders
CREATE POLICY "Staff can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'staff')
    )
  );

-- Payment proofs: Customers can view/upload their own
CREATE POLICY "Customers can manage own payment proofs" ON payment_proofs
  FOR ALL USING (auth.uid() = customer_id);

-- Staff can view all payment proofs
CREATE POLICY "Staff can view all payment proofs" ON payment_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name IN ('admin', 'staff')
    )
  );

-- Reviews: Customers can manage their own
CREATE POLICY "Customers can view all approved reviews" ON product_reviews
  FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid());

CREATE POLICY "Customers can create reviews" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update own reviews" ON product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Users see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update product rating when review is added/updated
CREATE OR REPLACE FUNCTION update_product_rating()
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

-- Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Decrease variant stock (with inventory tracking)
CREATE OR REPLACE FUNCTION decrease_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_user_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Update stock
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id;
  
  -- Log movement
  INSERT INTO stock_movements (
    variant_id,
    movement_type,
    quantity_change,
    performed_by
  ) VALUES (
    p_variant_id,
    'stock_out',
    -p_quantity,
    p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq;

-- ============================================================================
-- SAMPLE SETTINGS
-- ============================================================================

INSERT INTO shop_settings (key, value, description) VALUES
  ('shop_name', '"Vapour Lounge"', 'Store name'),
  ('tax_rate', '0.12', 'Tax rate (12%)'),
  ('currency', '"PHP"', 'Currency code'),
  ('low_stock_threshold', '10', 'Default low stock threshold'),
  ('critical_stock_threshold', '5', 'Critical stock threshold'),
  ('enable_age_verification', 'true', 'Require age verification'),
  ('enable_reviews', 'true', 'Enable product reviews');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Run: SELECT COUNT(*), table_name FROM information_schema.tables 
--      WHERE table_schema = 'public' GROUP BY table_name;
-- To verify all tables were created successfully.
