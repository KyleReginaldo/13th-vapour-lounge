-- ============================================
-- REMOVE ALL RLS POLICIES ON ALL TABLES
-- ============================================
-- WARNING: This removes ALL security policies
-- Only use this for development/debugging
-- ============================================

-- STEP 1: Show all current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- STEP 2: Drop all existing policies on public schema tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
    RAISE NOTICE 'Dropped policy % on table %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- STEP 3: Disable RLS on all tables in public schema
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl.tablename);
    RAISE NOTICE 'Disabled RLS on table %', tbl.tablename;
  END LOOP;
END $$;

-- STEP 4: Verify all RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- STEP 5: Verify no policies remain
SELECT 
  COUNT(*) as remaining_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- ALTERNATIVE: Disable RLS on specific tables
-- ============================================
-- If you only want to disable RLS on specific tables, use these instead:

-- Products table
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read published products" ON products;

-- Product images table
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read product images" ON product_images;

-- Product variants table
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- Categories table
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Brands table
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Carts table
ALTER TABLE carts DISABLE ROW LEVEL SECURITY;

-- Orders table
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Order items table
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Inventory table
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;

-- Suppliers table
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- Staff table
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- Customers table
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Age verifications table
ALTER TABLE age_verifications DISABLE ROW LEVEL SECURITY;

-- Audit logs table
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- Payment proofs table
ALTER TABLE payment_proofs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFY EVERYTHING IS WORKING
-- ============================================

-- Test query: Should return all products
SELECT 
  p.id,
  p.name,
  p.is_published,
  p.base_price,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
GROUP BY p.id, p.name, p.is_published, p.base_price
ORDER BY p.created_at DESC;

-- Test query: Should return all product images
SELECT 
  product_id,
  url,
  is_primary
FROM product_images
ORDER BY product_id;

-- Show table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
