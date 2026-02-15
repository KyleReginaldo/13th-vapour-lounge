"use server";

import {
  error,
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

export type ProductFormData = {
  name: string;
  category: string;
  price: number;
  quantity: number;
  images: string[];
  low_stock_threshold?: number;
  critical_stock_threshold?: number;
  qr_code?: string;
};

/**
 * Create a new product
 */
export const createProduct = withErrorHandling(
  async (formData: ProductInput): Promise<ActionResponse> => {
    // Require staff access
    const user = await requireRole(["admin", "staff"]);

    // Validate input
    const validated = validateInput(productSchema, formData);

    const supabase = await createClient();

    // Insert product (Note: Schema mismatch - validation expects different fields than database)
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        name: validated.name,
        sku: `SKU-${Date.now()}`, // Generate temporary SKU
        slug: validated.name.toLowerCase().replace(/\s+/g, "-"),
        base_price: validated.price,
        stock_quantity: validated.quantity,
        low_stock_threshold: validated.low_stock_threshold || 10,
        critical_stock_threshold: validated.critical_stock_threshold || 5,
        qr_code: validated.qr_code || null,
      } as any)
      .select()
      .single();

    if (insertError) {
      return error(insertError.message);
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
    const user = await requireRole(["admin", "staff"]);

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
    // Require staff access
    const user = await requireRole(["admin", "staff"]);

    const supabase = await createClient();

    // Get product data for audit
    const { data: product } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    // Delete product
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
    const products = (data || []).map((product: any) => {
      const primaryImage = product.product_images?.find(
        (img: any) => img.is_primary
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
    throw err;
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
  const products = (data || []).map((product: any) => {
    const primaryImage = product.product_images?.find(
      (img: any) => img.is_primary
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

    query = query.range(offset, offset + limit - 1);

    const { data, count, error: fetchError } = await query;

    if (fetchError) {
      return error("Failed to search products");
    }

    return success({
      products: data,
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
