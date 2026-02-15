-- ================================================
-- QUICK FIX: Publish all products and check data
-- ================================================
-- Run this in your Supabase SQL Editor
-- Copy and paste each section one at a time

-- STEP 1: Check current state
-- -----------------------------
SELECT 
  'Total Products' as metric,
  COUNT(*) as count
FROM products
UNION ALL
SELECT 
  'Published Products',
  COUNT(*)
FROM products
WHERE is_published = true
UNION ALL
SELECT 
  'Products with Images',
  COUNT(DISTINCT p.id)
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id;


-- STEP 2: Publish ALL products (if count is 0 above)
-- -----------------------------------------------------
UPDATE products 
SET is_published = true
WHERE is_published = false OR is_published IS NULL;
-- Check: How many rows were updated?


-- STEP 3: Check RLS policies (important!)
-- -----------------------------------------
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('products', 'product_images')
ORDER BY tablename, policyname;


-- STEP 4: Disable RLS temporarily for testing (optional)
-- --------------------------------------------------------
-- WARNING: Only do this for testing! Re-enable after testing!
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;


-- STEP 5: Check actual product data
-- -----------------------------------
SELECT 
  p.id,
  p.name,
  p.slug,
  p.base_price,
  p.is_published,
  p.created_at,
  COUNT(pi.id) as image_count,
  COALESCE(
    MAX(CASE WHEN pi.is_primary THEN pi.url END),
    MAX(pi.url)
  ) as primary_or_first_image
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.slug, p.base_price, p.is_published, p.created_at
ORDER BY p.created_at DESC
LIMIT 10;


-- STEP 6: Add sample product if none exist
-- ------------------------------------------
-- UNCOMMENT TO RUN:
/*
INSERT INTO products (
  name, 
  slug, 
  sku,
  base_price, 
  is_published,
  stock_quantity,
  description
) VALUES (
  'Sample Vape Device',
  'sample-vape-device',
  'SAMPLE-001',
  49.99,
  true,
  100,
  '<p>This is a sample product for testing.</p>'
) RETURNING id, name, slug;
*/


-- STEP 7: Add sample image to existing product
-- ----------------------------------------------
-- UNCOMMENT AND REPLACE <product-id> WITH ACTUAL ID:
/*
INSERT INTO product_images (
  product_id,
  url,
  alt_text,
  is_primary,
  sort_order
) VALUES (
  '<product-id>',
  'https://placehold.co/600x600/9333ea/white?text=Sample+Product',
  'Sample Product Image',
  true,
  1
);
*/


-- STEP 8: Verify everything is working
-- --------------------------------------
SELECT 
  p.id,
  p.slug,
  p.name,
  p.base_price,
  p.is_published,
  jsonb_agg(
    jsonb_build_object(
      'url', pi.url,
      'is_primary', pi.is_primary
    )
  ) FILTER (WHERE pi.id IS NOT NULL) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_published = true
GROUP BY p.id, p.slug, p.name, p.base_price, p.is_published
ORDER BY p.created_at DESC
LIMIT 5;
