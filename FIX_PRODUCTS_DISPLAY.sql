-- STEP 1: Fix the URL with newline
UPDATE product_images 
SET url = TRIM(url)
WHERE url LIKE '%
%';

-- STEP 2: Verify all URLs are clean
SELECT 
  product_id,
  LENGTH(url) as url_length,
  url
FROM product_images
ORDER BY product_id;

-- STEP 3: Check RLS policies on products table
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('products', 'product_images');

-- STEP 4: Test if you can read products
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_published = true) as published_products
FROM products;

-- STEP 5: Test if you can read product_images
SELECT COUNT(*) as total_images
FROM product_images;

-- STEP 6: Test the actual query that getProducts uses
SELECT 
  p.id,
  p.slug,
  p.name,
  p.base_price,
  p.is_published,
  pi.url,
  pi.is_primary
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.is_published = true
ORDER BY p.created_at DESC
LIMIT 20;

-- STEP 7: If you get 0 results above, enable public read access
-- Run these to allow anonymous users to read products:

DROP POLICY IF EXISTS "Allow public read published products" ON products;
DROP POLICY IF EXISTS "Allow public read product images" ON product_images;

CREATE POLICY "Allow public read published products" 
ON products FOR SELECT 
USING (is_published = true);

CREATE POLICY "Allow public read product images" 
ON product_images FOR SELECT 
USING (true);

-- STEP 8: Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('products', 'product_images')
AND cmd = 'SELECT';
