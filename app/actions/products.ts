"use server";

import {
  error,
  ErrorCode,
  success,
  validateInput,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { revalidatePath } from "next/cache";

// Minimal type for raw product rows returned from Supabase select queries
type ProductImageRow = { url: string; is_primary: boolean | null };
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  compare_at_price: number | null;
  stock_quantity: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  is_featured: boolean | null;
  created_at: string | null;
  has_variants: boolean | null;
  product_images?: ProductImageRow[] | null;
};

export type ProductFormData = {
  name: string;
  sku: string;
  description?: string;
  category: string;
  brand?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  quantity: number;
  images: string[];
  low_stock_threshold?: number;
  critical_stock_threshold?: number;
  barcode?: string;
  qr_code?: string;
  product_type?: string;
  has_variants?: boolean;
  track_inventory?: boolean;
  is_published?: boolean;
  is_featured?: boolean;
};

/**
 * Create a new product
 */
export const createProduct = withErrorHandling(
  async (formData: ProductInput): Promise<ActionResponse> => {
    // Require staff access
    await requireRole(["admin", "staff"]);

    // Validate input
    const validated = validateInput(productSchema, formData);

    const supabase = await createClient();

    // Handle category - find or create
    let categoryId: string | null = null;
    if (validated.category) {
      // First try to find existing category
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", validated.category)
        .single();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category if it doesn't exist
        const { data: newCategory, error: categoryError } = await supabase
          .from("categories")
          .insert({
            name: validated.category,
            slug: validated.category.toLowerCase().replace(/\s+/g, "-"),
          })
          .select("id")
          .single();

        if (categoryError) {
          console.error("Failed to create category:", categoryError);
        } else if (newCategory) {
          categoryId = newCategory.id;
        }
      }
    }

    // Use brand_id directly from the input
    const brandId = validated.brand_id || null;

    // Generate slug from product name
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        name: validated.name,
        sku: validated.sku,
        slug: slug,
        description: validated.description || null,
        base_price: validated.price,
        compare_at_price: validated.compare_at_price || null,
        cost_price: validated.cost_price || null,
        stock_quantity: validated.quantity,
        category_id: categoryId,
        brand_id: brandId,
        low_stock_threshold: validated.low_stock_threshold || 10,
        critical_stock_threshold: validated.critical_stock_threshold || 5,
        barcode: validated.barcode || null,
        qr_code: validated.qr_code || null,
        product_type: validated.product_type || null,
        has_variants: validated.has_variants ?? false,
        track_inventory: validated.track_inventory ?? true,
        is_published: validated.is_published ?? true,
        is_featured: validated.is_featured ?? false,
      })
      .select()
      .single();

    if (insertError) {
      return error(insertError.message);
    }

    // Insert product images if provided
    if (validated.images && validated.images.length > 0) {
      const imageRecords = validated.images.map((url, index) => ({
        product_id: product.id,
        url: url,
        is_primary: index === 0, // First image is primary
        sort_order: index,
      }));

      const { error: imagesError } = await supabase
        .from("product_images")
        .insert(imageRecords);

      if (imagesError) {
        console.error("Failed to insert product images:", imagesError);
        // Don't fail the whole operation if images fail
      }
    }

    // Log audit
    await logAudit({
      action: "create",
      entityType: "product",
      entityId: product.id,
      newValue: product,
    });

    revalidatePath("/admin/products");

    return success(product, "Product created successfully");
  }
);

/**
 * Update an existing product
 */
export const updateProduct = withErrorHandling(
  async (
    productId: string,
    formData: Partial<ProductFormData>
  ): Promise<ActionResponse> => {
    // Require staff access
    await requireRole(["admin", "staff"]);

    const supabase = await createClient();

    // Get old product data for audit
    const { data: oldProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    // Update product
    const { data: product, error: updateError } = await supabase
      .from("products")
      .update(formData)
      .eq("id", productId)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message);
    }

    // Log audit
    await logAudit({
      action: "update",
      entityType: "product",
      entityId: productId,
      oldValue: oldProduct || undefined,
      newValue: product,
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return success(product, "Product updated successfully");
  }
);

/**
 * Delete a product
 */
export const deleteProduct = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    // Require admin access only — staff cannot delete products
    await requireRole(["admin"]);

    const supabase = await createClient();

    // Get product data for audit
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (!product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    // Check for references that would prevent deletion
    const { data: cartItems } = await supabase
      .from("carts")
      .select("id")
      .eq("product_id", productId)
      .limit(1);

    if (cartItems && cartItems.length > 0) {
      return error(
        "Cannot delete product: It is currently in customer carts. Remove it from all carts first.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { data: orderItems } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", productId)
      .limit(1);

    if (orderItems && orderItems.length > 0) {
      return error(
        "Cannot delete product: It has been ordered. Products with order history cannot be deleted.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { data: inventoryBatches } = await supabase
      .from("inventory_batches")
      .select("id")
      .eq("product_id", productId)
      .limit(1);

    if (inventoryBatches && inventoryBatches.length > 0) {
      return error(
        "Cannot delete product: It has inventory batch records. Clear inventory batches first.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { data: stockMovements } = await supabase
      .from("stock_movements")
      .select("id")
      .eq("product_id", productId)
      .limit(1);

    if (stockMovements && stockMovements.length > 0) {
      return error(
        "Cannot delete product: It has stock movement history. Clear stock movements first.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Delete product (product_images and product_reviews will cascade automatically)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      return error(deleteError.message);
    }

    // Log audit
    await logAudit({
      action: "delete",
      entityType: "product",
      entityId: productId,
      oldValue: product || undefined,
    });

    revalidatePath("/admin/products");

    return success(null, "Product deleted successfully");
  }
);

/**
 * Get all products with pagination
 */
export async function getProducts(page = 1, pageSize = 20, category?: string) {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * pageSize;

    console.log("[getProducts] Starting fetch:", {
      page,
      pageSize,
      category,
      offset,
    });

    let query = supabase
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        base_price,
        compare_at_price,
        stock_quantity,
        average_rating,
        total_reviews,
        is_featured,
        created_at,
        has_variants,
        product_images(url, is_primary)
      `,
        { count: "exact" }
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Only apply category filter if it's a valid UUID format
    if (
      category &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        category
      )
    ) {
      query = query.eq("category_id", category);
    }

    const { data, count, error } = await query;

    console.log("[getProducts] Query result:", {
      dataCount: data?.length,
      totalCount: count,
      hasError: !!error,
      errorMessage: error?.message,
      errorDetails: error,
    });

    if (error) {
      console.error("[getProducts] Error fetching products:", error);
      throw error;
    }

    // Transform data to include primary_image
    const products = (data || []).map((product: ProductRow) => {
      const primaryImage = product.product_images?.find(
        (img: ProductImageRow) => img.is_primary
      );
      const firstImage = product.product_images?.[0];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        base_price: product.base_price,
        compare_at_price: product.compare_at_price,
        stock_quantity: product.stock_quantity,
        average_rating: product.average_rating,
        total_reviews: product.total_reviews,
        is_featured: product.is_featured,
        created_at: product.created_at,
        has_variants: product.has_variants,
        primary_image: primaryImage?.url || firstImage?.url || null,
      };
    });

    console.log("[getProducts] Transformed products:", products.length);

    return {
      products,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (err) {
    console.error("[getProducts] Caught error:", err);
    return {
      products: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string) {
  const supabase = await createClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select(
      `
      *,
      product_details(*)
    `
    )
    .eq("id", productId)
    .single();

  if (fetchError) throw fetchError;

  return product;
}

/**
 * Get product by slug with all related data (variants, images, brand, category)
 */
export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands(id, name, slug),
      category:categories(id, name, slug),
      product_images(id, url, alt_text, is_primary, sort_order),
      product_variants(
        id,
        sku,
        price,
        compare_at_price,
        stock_quantity,
        is_active,
        attributes,
        image_url
      )
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (fetchError) {
    throw new Error("Product not found");
  }

  return product;
}

/**
 * Get related products based on category
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      base_price,
      compare_at_price,
      average_rating,
      total_reviews,
      stock_quantity,
      is_featured,
      created_at,
      has_variants,
      product_images(url, is_primary)
    `
    )
    .eq("is_published", true)
    .neq("id", productId)
    .limit(limit);

  // Only apply category filter if it's a valid UUID format
  if (
    categoryId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      categoryId
    )
  ) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching related products:", error);
    return [];
  }

  // Transform data to include primary_image
  const products = (data || []).map((product: ProductRow) => {
    const primaryImage = product.product_images?.find(
      (img: ProductImageRow) => img.is_primary
    );
    const firstImage = product.product_images?.[0];

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      base_price: product.base_price,
      compare_at_price: product.compare_at_price,
      stock_quantity: product.stock_quantity,
      average_rating: product.average_rating,
      total_reviews: product.total_reviews,
      is_featured: product.is_featured,
      created_at: product.created_at,
      has_variants: product.has_variants,
      primary_image: primaryImage?.url || firstImage?.url || null,
    };
  });

  return products;
}

/**
 * Advanced product search with filters
 */
export const searchProducts = withErrorHandling(
  async (params: {
    query?: string;
    categoryId?: string;
    brandId?: string;
    priceMin?: number;
    priceMax?: number;
    inStockOnly?: boolean;
    sortBy?: string;
    limit?: number;
    page?: number;
  }): Promise<ActionResponse> => {
    const supabase = await createClient();
    const limit = params.limit || 20;
    const page = params.page || 1;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        base_price,
        compare_at_price,
        stock_quantity,
        average_rating,
        total_reviews,
        is_featured,
        created_at,
        has_variants,
        is_published,
        category_id,
        brand_id,
        product_images(url, is_primary),
        categories(name),
        brands(name)
      `,
        { count: "exact" }
      )
      .eq("is_published", true);

    // Text search
    if (params.query && params.query.length >= 2) {
      query = query.or(
        `name.ilike.%${params.query}%,description.ilike.%${params.query}%`
      );
    }

    // Category filter (only if valid UUID)
    if (
      params.categoryId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.categoryId
      )
    ) {
      query = query.eq("category_id", params.categoryId);
    }

    // Brand filter (only if valid UUID)
    if (
      params.brandId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.brandId
      )
    ) {
      query = query.eq("brand_id", params.brandId);
    }

    // Price range
    if (params.priceMin) {
      query = query.gte("base_price", params.priceMin);
    }
    if (params.priceMax) {
      query = query.lte("base_price", params.priceMax);
    }

    // In stock only
    if (params.inStockOnly) {
      query = query.gt("stock_quantity", 0);
    }

    // Sorting
    switch (params.sortBy) {
      case "price-asc":
        query = query.order("base_price", { ascending: true });
        break;
      case "price-desc":
        query = query.order("base_price", { ascending: false });
        break;
      case "name-asc":
        query = query.order("name", { ascending: true });
        break;
      case "name-desc":
        query = query.order("name", { ascending: false });
        break;
      case "rating":
        query = query.order("average_rating", { ascending: false });
        break;
      case "popular":
        query = query.order("total_reviews", { ascending: false });
        break;
      default: // "newest"
        query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error: fetchError } = await query;

    if (fetchError) {
      return error("Failed to search products");
    }

    // Transform data to include primary_image
    const products = (data || []).map((product: ProductRow) => {
      const primaryImage = product.product_images?.find(
        (img: ProductImageRow) => img.is_primary
      );
      const firstImage = product.product_images?.[0];

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        base_price: product.base_price,
        compare_at_price: product.compare_at_price,
        stock_quantity: product.stock_quantity,
        average_rating: product.average_rating,
        total_reviews: product.total_reviews,
        is_featured: product.is_featured,
        created_at: product.created_at,
        has_variants: product.has_variants,
        primary_image: primaryImage?.url || firstImage?.url || null,
      };
    });

    return success({
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  }
);

/**
 * Autocomplete product search
 */
export const autocompleteProducts = withErrorHandling(
  async (query: string): Promise<ActionResponse> => {
    if (query.length < 2) {
      return success([]);
    }

    const supabase = await createClient();

    const { data } = await supabase
      .from("products")
      .select("id, name, slug, product_images!inner (url)")
      .ilike("name", `%${query}%`)
      .eq("is_published", true)
      .limit(10);

    return success(data || []);
  }
);
