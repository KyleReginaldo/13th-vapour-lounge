-- ============================================================================
-- SAMPLE SEED DATA FOR VAPOUR LOUNGE
-- ============================================================================
-- This populates the database with realistic test data for development.
-- Run this AFTER running IMPROVED_SCHEMA.sql
-- ============================================================================

-- ============================================================================
-- 1. SAMPLE USERS (You'll need to create these via Supabase Auth first)
-- ============================================================================
-- NOTE: Replace these UUIDs with actual auth.users IDs after creating users
-- For now, we'll use placeholder UUIDs that you should update

-- Create users in Supabase Auth Dashboard first, then insert profiles here
-- Example users to create:
-- 1. admin@vapourlounge.com (password: Admin123!)
-- 2. staff1@vapourlounge.com (password: Staff123!)
-- 3. customer1@example.com (password: Customer123!)

-- Get admin role ID
DO $$
DECLARE
  admin_role_id UUID;
  staff_role_id UUID;
  customer_role_id UUID;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO staff_role_id FROM roles WHERE name = 'staff';
  SELECT id INTO customer_role_id FROM roles WHERE name = 'customer';

  -- Sample admin user (replace UUID with actual auth.users ID)
  INSERT INTO users (
    id, email, first_name, last_name, contact_number, date_of_birth, role_id, is_verified
  ) VALUES (
    'fab1124d-2dbd-4537-a188-f79dfd8e15b7',
    'admin@vapourlounge.com',
    'Admin',
    'User',
    '+639171234567',
    '1990-01-01',
    admin_role_id,
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

  -- Sample staff user
  INSERT INTO users (
    id, email, first_name, last_name, contact_number, date_of_birth, role_id, is_verified
  ) VALUES (
    'a56a3798-965d-4c56-ab53-926c59fff3a2',
    'staff1@vapourlounge.com',
    'John',
    'Staff',
    '+639177654321',
    '1995-05-15',
    staff_role_id,
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

  -- Sample customer users
  INSERT INTO users (
    id, email, first_name, middle_name, last_name, contact_number, date_of_birth, role_id, is_verified
  ) VALUES 
    (
      '0bf636a7-0d06-46c4-ad99-940c053a88a4',
      'customer1@example.com',
      'Maria',
      'Santos',
      'Cruz',
      '+639181234567',
      '1998-03-20',
      customer_role_id,
      TRUE
    ),
    (
      '92adedf0-bae8-4073-b520-1bf1ec13cdb1',
      'customer2@example.com',
      'Juan',
      'Reyes',
      'Dela Cruz',
      '+639189876543',
      '1992-11-08',
      customer_role_id,
      TRUE
    )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
  ('Vape Juice', 'vape-juice', 'E-liquids in various flavors and nicotine levels', 1, TRUE),
  ('Disposable Vapes', 'disposable-vapes', 'Ready-to-use disposable vape devices', 2, TRUE),
  ('Pod Systems', 'pod-systems', 'Compact refillable pod vape kits', 3, TRUE),
  ('Vape Mods', 'vape-mods', 'Advanced vape mods and box mods', 4, TRUE),
  ('Tanks & Atomizers', 'tanks-atomizers', 'Replacement tanks and atomizers', 5, TRUE),
  ('Coils', 'coils', 'Replacement coils and pods', 6, TRUE),
  ('Batteries', 'batteries', '18650, 21700, and other vape batteries', 7, TRUE),
  ('Accessories', 'accessories', 'Cases, chargers, and other accessories', 8, TRUE);

-- ============================================================================
-- 3. BRANDS
-- ============================================================================

INSERT INTO brands (name, slug, description, is_active) VALUES
  ('SMOK', 'smok', 'Leading manufacturer of vape devices and accessories', TRUE),
  ('Vaporesso', 'vaporesso', 'Premium vape products with innovative technology', TRUE),
  ('Uwell', 'uwell', 'High-quality vape tanks and pod systems', TRUE),
  ('VOOPOO', 'voopoo', 'Performance-focused vape mods and pods', TRUE),
  ('Freemax', 'freemax', 'Mesh coil innovators', TRUE),
  ('Naked 100', 'naked-100', 'Premium e-liquid brand', TRUE),
  ('Juice Head', 'juice-head', 'Fruit-flavored e-liquids', TRUE),
  ('Pachamama', 'pachamama', 'Exotic fruit e-liquid blends', TRUE),
  ('Innokin', 'innokin', 'Reliable and safe vape devices', TRUE),
  ('GeekVape', 'geekvape', 'Durable and waterproof devices', TRUE);

-- ============================================================================
-- 4. PRODUCTS (Vape Juices with Variants)
-- ============================================================================

DO $$
DECLARE
  vape_juice_cat_id UUID;
  disposable_cat_id UUID;
  pod_cat_id UUID;
  coils_cat_id UUID;
  naked100_brand_id UUID;
  juicehead_brand_id UUID;
  smok_brand_id UUID;
  vaporesso_brand_id UUID;
  product_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO vape_juice_cat_id FROM categories WHERE slug = 'vape-juice';
  SELECT id INTO disposable_cat_id FROM categories WHERE slug = 'disposable-vapes';
  SELECT id INTO pod_cat_id FROM categories WHERE slug = 'pod-systems';
  SELECT id INTO coils_cat_id FROM categories WHERE slug = 'coils';
  
  -- Get brand IDs
  SELECT id INTO naked100_brand_id FROM brands WHERE slug = 'naked-100';
  SELECT id INTO juicehead_brand_id FROM brands WHERE slug = 'juice-head';
  SELECT id INTO smok_brand_id FROM brands WHERE slug = 'smok';
  SELECT id INTO vaporesso_brand_id FROM brands WHERE slug = 'vaporesso';

  -- Product 1: Naked 100 - Hawaiian POG (has variants)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, product_type, has_variants, is_featured, is_published
  ) VALUES (
    'NKD-POG',
    'Hawaiian POG by Naked 100',
    'hawaiian-pog-naked-100',
    'A refreshing blend of passion fruit, orange, and guava. Sweet and tropical!',
    vape_juice_cat_id,
    naked100_brand_id,
    450.00,
    'variant',
    TRUE,
    TRUE,
    TRUE
  ) RETURNING id INTO product_id;

  -- Variants: Different nicotine levels and sizes
  INSERT INTO product_variants (product_id, sku, attributes, price, stock_quantity) VALUES
    (product_id, 'NKD-POG-0MG-60ML', '{"nicotine": "0mg", "size": "60ml"}'::jsonb, 450.00, 50),
    (product_id, 'NKD-POG-3MG-60ML', '{"nicotine": "3mg", "size": "60ml"}'::jsonb, 450.00, 50),
    (product_id, 'NKD-POG-6MG-60ML', '{"nicotine": "6mg", "size": "60ml"}'::jsonb, 450.00, 40),
    (product_id, 'NKD-POG-3MG-100ML', '{"nicotine": "3mg", "size": "100ml"}'::jsonb, 650.00, 30);

  -- Product 2: Juice Head - Strawberry Kiwi (has variants)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, product_type, has_variants, is_featured, is_published
  ) VALUES (
    'JH-SBKW',
    'Strawberry Kiwi by Juice Head',
    'strawberry-kiwi-juice-head',
    'Sweet strawberry paired with tangy kiwi. A perfect all-day vape!',
    vape_juice_cat_id,
    juicehead_brand_id,
    420.00,
    'variant',
    TRUE,
    TRUE,
    TRUE
  ) RETURNING id INTO product_id;

  INSERT INTO product_variants (product_id, sku, attributes, price, stock_quantity) VALUES
    (product_id, 'JH-SBKW-0MG-100ML', '{"nicotine": "0mg", "size": "100ml"}'::jsonb, 620.00, 40),
    (product_id, 'JH-SBKW-3MG-100ML', '{"nicotine": "3mg", "size": "100ml"}'::jsonb, 620.00, 35),
    (product_id, 'JH-SBKW-6MG-100ML', '{"nicotine": "6mg", "size": "100ml"}'::jsonb, 620.00, 25);

  -- Product 3: SMOK Nord 4 Pod Kit (simple product, no variants)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, product_type, has_variants, stock_quantity, is_featured, is_published
  ) VALUES (
    'SMOK-NORD4',
    'SMOK Nord 4 Pod System Kit',
    'smok-nord-4-pod-kit',
    'Compact pod system with 2000mAh battery, adjustable wattage, and Type-C charging. Includes 2 pods and coils.',
    pod_cat_id,
    smok_brand_id,
    1850.00,
    'simple',
    FALSE,
    25,
    TRUE,
    TRUE
  );

  -- Product 4: Vaporesso XROS 3 (simple product)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, compare_at_price, product_type, stock_quantity, is_featured, is_published
  ) VALUES (
    'VAPO-XROS3',
    'Vaporesso XROS 3 Pod Kit',
    'vaporesso-xros-3-pod-kit',
    'Ultra-portable pod with 1000mAh battery and adjustable airflow. Perfect for MTL vaping.',
    pod_cat_id,
    vaporesso_brand_id,
    1299.00,
    1499.00,
    'simple',
    30,
    FALSE,
    TRUE
  );

  -- Product 5: Replacement Coils (simple product)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, product_type, stock_quantity, is_published
  ) VALUES (
    'SMOK-NORD-COIL-0.8',
    'SMOK Nord Replacement Coils 0.8Ω (5-pack)',
    'smok-nord-coils-08ohm',
    'Pack of 5 replacement coils for SMOK Nord devices. 0.8Ω resistance, ideal for flavor.',
    coils_cat_id,
    smok_brand_id,
    380.00,
    'simple',
    100,
    TRUE
  );

  -- Product 6: Naked 100 - Brain Freeze (has variants)
  INSERT INTO products (
    sku, name, slug, description, category_id, brand_id,
    base_price, product_type, has_variants, is_published
  ) VALUES (
    'NKD-BRAIN',
    'Brain Freeze by Naked 100',
    'brain-freeze-naked-100',
    'Strawberry, kiwi, and pomegranate with a refreshing menthol kick!',
    vape_juice_cat_id,
    naked100_brand_id,
    450.00,
    'variant',
    TRUE,
    TRUE
  ) RETURNING id INTO product_id;

  INSERT INTO product_variants (product_id, sku, attributes, price, stock_quantity) VALUES
    (product_id, 'NKD-BRAIN-0MG-60ML', '{"nicotine": "0mg", "size": "60ml"}'::jsonb, 450.00, 45),
    (product_id, 'NKD-BRAIN-3MG-60ML', '{"nicotine": "3mg", "size": "60ml"}'::jsonb, 450.00, 50),
    (product_id, 'NKD-BRAIN-6MG-60ML', '{"nicotine": "6mg", "size": "60ml"}'::jsonb, 450.00, 30);

END $$;

-- ============================================================================
-- 5. PRODUCT IMAGES
-- ============================================================================

-- Note: Replace these URLs with actual image URLs from your storage
INSERT INTO product_images (product_id, url, is_primary, sort_order)
SELECT 
  p.id,
  'https://via.placeholder.com/600x600?text=' || REPLACE(p.name, ' ', '+') as url,
  TRUE as is_primary,
  0 as sort_order
FROM products p;

-- ============================================================================
-- 6. SUPPLIERS
-- ============================================================================

INSERT INTO suppliers (name, contact_person, email, phone, address, city, country, payment_terms, is_active) VALUES
  ('VapeHub Distributors Inc.', 'Mark Santos', 'mark@vapehub.ph', '+639171234567', '123 Vape Street', 'Manila', 'Philippines', 'Net 30', TRUE),
  ('Cloud Nine Suppliers', 'Sarah Reyes', 'sarah@cloudnine.ph', '+639189876543', '456 Juice Avenue', 'Quezon City', 'Philippines', 'Net 15', TRUE),
  ('Elite Vape Trading', 'Carlos Cruz', 'carlos@elitevape.ph', '+639177654321', '789 Mod Boulevard', 'Makati', 'Philippines', 'COD', TRUE);

-- ============================================================================
-- 7. CUSTOMER ADDRESSES
-- ============================================================================

INSERT INTO customer_addresses (
  customer_id, label, is_default, full_name, phone,
  address_line1, address_line2, city, state_province, postal_code, country
) VALUES
  (
    '0bf636a7-0d06-46c4-ad99-940c053a88a4',
    'Home',
    TRUE,
    'Maria Santos Cruz',
    '+639181234567',
    '123 Sampaguita Street',
    'Barangay San Jose',
    'Manila',
    'Metro Manila',
    '1000',
    'Philippines'
  ),
  (
    '92adedf0-bae8-4073-b520-1bf1ec13cdb1',
    'Home',
    TRUE,
    'Juan Reyes Dela Cruz',
    '+639189876543',
    '456 Mabini Avenue',
    'Unit 5B',
    'Quezon City',
    'Metro Manila',
    '1100',
    'Philippines'
  );

-- ============================================================================
-- 8. CASH REGISTERS
-- ============================================================================

INSERT INTO cash_registers (name, location, is_active) VALUES
  ('Register 1', 'Main Counter', TRUE),
  ('Register 2', 'Express Counter', TRUE);

-- ============================================================================
-- 9. SHOP SETTINGS (Already inserted in schema, this adds more)
-- ============================================================================

INSERT INTO shop_settings (key, value, description) VALUES
  ('shop_address', '"123 Vape Street, Manila, Philippines"', 'Physical store address'),
  ('shop_phone', '"+639171234567"', 'Contact phone number'),
  ('shop_email', '"info@vapourlounge.ph"', 'Contact email'),
  ('shipping_flat_rate', '100', 'Flat shipping rate (PHP)'),
  ('free_shipping_threshold', '2000', 'Free shipping for orders above this amount'),
  ('age_requirement', '18', 'Minimum age requirement'),
  ('enable_pos', 'true', 'Enable POS system'),
  ('enable_online_orders', 'true', 'Enable online ordering')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 10. SAMPLE INVENTORY BATCHES
-- ============================================================================

DO $$
DECLARE
  variant_record RECORD;
  supplier_id UUID;
BEGIN
  SELECT id INTO supplier_id FROM suppliers LIMIT 1;

  FOR variant_record IN 
    SELECT id, product_id, stock_quantity FROM product_variants
  LOOP
    INSERT INTO inventory_batches (
      variant_id,
      product_id,
      batch_number,
      supplier_id,
      quantity,
      remaining_quantity,
      cost_per_unit,
      expiry_date,
      received_date,
      status
    ) VALUES (
      variant_record.id,
      variant_record.product_id,
      'BATCH-' || SUBSTRING(variant_record.id::TEXT, 1, 8),
      supplier_id,
      variant_record.stock_quantity,
      variant_record.stock_quantity,
      250.00,
      CURRENT_DATE + INTERVAL '2 years',
      CURRENT_DATE - INTERVAL '7 days',
      'active'
    );
  END LOOP;

  -- Also create batches for simple products
  FOR variant_record IN 
    SELECT id, stock_quantity FROM products WHERE has_variants = FALSE AND stock_quantity > 0
  LOOP
    INSERT INTO inventory_batches (
      product_id,
      batch_number,
      supplier_id,
      quantity,
      remaining_quantity,
      cost_per_unit,
      expiry_date,
      received_date,
      status
    ) VALUES (
      variant_record.id,
      'BATCH-' || SUBSTRING(variant_record.id::TEXT, 1, 8),
      supplier_id,
      variant_record.stock_quantity,
      variant_record.stock_quantity,
      800.00,
      CURRENT_DATE + INTERVAL '1 year',
      CURRENT_DATE - INTERVAL '14 days',
      'active'
    );
  END LOOP;
END $$;

-- ============================================================================
-- 11. SAMPLE PRODUCT REVIEWS
-- ============================================================================

DO $$
DECLARE
  product_record RECORD;
  customer_id UUID;
BEGIN
  SELECT id INTO customer_id FROM users WHERE email = 'customer1@example.com';

  -- Add reviews for first 3 products
  FOR product_record IN 
    SELECT id FROM products LIMIT 3
  LOOP
    INSERT INTO product_reviews (
      product_id,
      user_id,
      rating,
      title,
      review_text,
      verified_purchase,
      is_approved
    ) VALUES (
      product_record.id,
      customer_id,
      5,
      'Excellent product!',
      'Very satisfied with this purchase. Great flavor and smooth vape. Highly recommended!',
      TRUE,
      TRUE
    );
  END LOOP;
END $$;

-- ============================================================================
-- 12. NOTIFICATIONS (Sample)
-- ============================================================================

INSERT INTO notifications (user_id, type, title, message) VALUES
  (
    '0bf636a7-0d06-46c4-ad99-940c053a88a4',
    'low_stock',
    'Low Stock Alert',
    'Some products are running low on stock. Please review inventory.',
  ),
  (
    '92adedf0-bae8-4073-b520-1bf1ec13cdb1',
    'welcome',
    'Welcome to Vapour Lounge!',
    'Thank you for joining us. Enjoy 10% off your first order with code WELCOME10.',
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify data was inserted correctly:

-- SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
-- UNION ALL
-- SELECT 'Brands', COUNT(*) FROM brands
-- UNION ALL
-- SELECT 'Products', COUNT(*) FROM products
-- UNION ALL
-- SELECT 'Product Variants', COUNT(*) FROM product_variants
-- UNION ALL
-- SELECT 'Product Images', COUNT(*) FROM product_images
-- UNION ALL
-- SELECT 'Suppliers', COUNT(*) FROM suppliers
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Customer Addresses', COUNT(*) FROM customer_addresses
-- UNION ALL
-- SELECT 'Inventory Batches', COUNT(*) FROM inventory_batches
-- UNION ALL
-- SELECT 'Product Reviews', COUNT(*) FROM product_reviews;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Update user UUIDs with actual auth.users IDs after creating accounts
-- 2. Replace placeholder image URLs with actual product images
-- 3. Adjust prices to match your actual pricing
-- 4. Add more products as needed
-- 5. This is just sample data for development/testing
-- 6. For production, use proper migration scripts

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
