-- Run this in your Supabase SQL editor to check your products

-- 1. Check total products
SELECT COUNT(*) as total_products FROM products;

-- 2. Check published products
SELECT COUNT(*) as published_products FROM products WHERE is_published = true;

-- 3. Check products with images
SELECT 
  p.id,
  p.name,
  p.slug,
  p.is_published,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.slug, p.is_published
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check if any products have a primary image
SELECT 
  p.name,
  p.is_published,
  pi.url as primary_image,
  pi.is_primary
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
WHERE p.is_published = true
LIMIT 10;
