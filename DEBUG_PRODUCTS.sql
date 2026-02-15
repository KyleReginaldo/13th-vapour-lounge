/**
 * Debug script to check products in database
 * 
 * Instructions:
 * 1. Go to your Supabase Dashboard
 * 2. Navigate to SQL Editor
 * 3. Run these queries one by one
 */

-- Query 1: Check total products
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published_products,
  COUNT(CASE WHEN is_published = false OR is_published IS NULL THEN 1 END) as unpublished_products
FROM products;

-- Query 2: Check products with/without images
SELECT 
  COUNT(DISTINCT p.id) as products_with_images,
  (SELECT COUNT(*) FROM products) - COUNT(DISTINCT p.id) as products_without_images
FROM products p
INNER JOIN product_images pi ON p.id = pi.product_id;

-- Query 3: List first 10 products with details
SELECT 
  p.id,
  p.name,
  p.slug,
  p.base_price,
  p.is_published,
  COUNT(pi.id) as image_count,
  MAX(CASE WHEN pi.is_primary = true THEN pi.url END) as primary_image_url
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.slug, p.base_price, p.is_published
ORDER BY p.created_at DESC
LIMIT 10;

-- Query 4: If no published products, publish them
-- UNCOMMENT THIS IF YOU WANT TO PUBLISH ALL PRODUCTS:
-- UPDATE products SET is_published = true WHERE is_published = false OR is_published IS NULL;

-- Query 5: Check categories and brands
SELECT 'Categories' as type, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Brands' as type, COUNT(*) as count FROM brands
UNION ALL  
SELECT 'Product Images' as type, COUNT(*) as count FROM product_images;
