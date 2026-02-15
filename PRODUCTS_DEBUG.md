# Products Page Debugging Guide

## Issue: Products not displaying

### Checklist:

#### 1. ✅ Check Products Exist in Database

Run this in Supabase SQL Editor:

```sql
SELECT id, name, is_published, stock_quantity
FROM products
WHERE is_published = true
LIMIT 10;
```

**Expected**: Should return 6 products
**Actual**: \_\_\_ products returned

#### 2. ✅ Check Product Images Exist

Run this in Supabase SQL Editor:

```sql
SELECT
  p.id,
  p.name,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.is_published = true
GROUP BY p.id, p.name;
```

**Expected**: Each product should have at least 1 image
**Actual**: \_\_\_ products have images

#### 3. ✅ Check Browser Console Logs

Open F12 → Console tab and refresh `/products`

Look for:

```
[getProducts] Starting fetch: { page: 1, pageSize: 20, category: undefined, offset: 0 }
[getProducts] Query result: { dataCount: X, totalCount: X, ... }
```

**What do you see?**

- dataCount: \_\_\_
- totalCount: \_\_\_
- hasError: \_\_\_
- errorMessage: \_\_\_

#### 4. ✅ Check Network Tab

Open F12 → Network tab → Filter by "Fetch/XHR"

Look for requests to your API or Supabase

**Any failed requests?** \_\_\_

#### 5. ✅ Test Direct Query

Run this in Supabase SQL Editor:

```sql
SELECT
  id,
  slug,
  name,
  base_price,
  is_published
FROM products
WHERE is_published = true
ORDER BY created_at DESC
LIMIT 20;
```

**Result**: \_\_\_ rows

---

## Common Issues & Fixes:

### Issue 1: No product_images in database

**Symptom**: Products exist but have no images
**Fix**: Insert sample images:

```sql
INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT
  id,
  'https://via.placeholder.com/400x400.png?text=' || name,
  true,
  1
FROM products
WHERE is_published = true
AND id NOT IN (SELECT DISTINCT product_id FROM product_images WHERE product_id IS NOT NULL);
```

### Issue 2: RLS (Row Level Security) blocking reads

**Symptom**: Query returns 0 results even though data exists
**Fix**: Check RLS policies:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'product_images');

-- If RLS is ON, add policy for anonymous reads
CREATE POLICY "Allow public read published products"
ON products FOR SELECT
USING (is_published = true);

CREATE POLICY "Allow public read product images"
ON product_images FOR SELECT
USING (true);
```

### Issue 3: Invalid category UUID still being passed

**Symptom**: Error `22P02` in console
**Fix**: Already applied UUID validation, but check if still happening

---

## Quick Fix Script

If products exist but no images, run this:

```sql
-- Add placeholder images to all products without images
INSERT INTO product_images (product_id, url, is_primary, sort_order, alt_text)
VALUES
  ('1c601240-6de8-4ccd-a417-174e488a144c', 'https://via.placeholder.com/600x600.png?text=Hawaiian+POG', true, 1, 'Hawaiian POG by Naked 100'),
  ('5ced5998-6b10-48c8-b814-63517ec73263', 'https://via.placeholder.com/600x600.png?text=SMOK+Nord+4', true, 1, 'SMOK Nord 4 Pod System Kit'),
  ('7835dd38-91cb-4ebd-81d2-f22a269c93cd', 'https://via.placeholder.com/600x600.png?text=SMOK+Coils', true, 1, 'SMOK Nord Replacement Coils'),
  ('d0abe6a0-0609-4d5e-a179-6f8d129a5f9a', 'https://via.placeholder.com/600x600.png?text=Brain+Freeze', true, 1, 'Brain Freeze by Naked 100'),
  ('e5c10ae9-0490-430f-ac29-80050a725cff', 'https://via.placeholder.com/600x600.png?text=Strawberry+Kiwi', true, 1, 'Strawberry Kiwi by Juice Head'),
  ('e877917a-c292-4367-b40a-24b1298be0e1', 'https://via.placeholder.com/600x600.png?text=XROS+3', true, 1, 'Vaporesso XROS 3 Pod Kit')
ON CONFLICT DO NOTHING;
```

Then verify:

```sql
SELECT
  p.name,
  pi.url,
  pi.is_primary
FROM products p
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.is_published = true;
```
