"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Validation schemas for product variants
 */
const productVariantAttributesSchema = z.object({
  nicotineLevel: z.string().optional(), // e.g., "0mg", "3mg", "6mg", "12mg", "18mg"
  flavor: z.string().optional(), // e.g., "Strawberry", "Mint"
  size: z.string().optional(), // e.g., "30ml", "60ml", "100ml"
  color: z.string().optional(), // For devices
  resistance: z.string().optional(), // For coils, e.g., "0.15Ω", "0.4Ω"
  wattageRange: z.string().optional(), // e.g., "60-80W"
});

const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(3).max(100),
  attributes: productVariantAttributesSchema,
  price: z.number().positive(),
  stock_quantity: z.number().int().min(0),
  barcode: z.string().optional(),
  weight: z.number().positive().optional(),
  is_active: z.boolean().default(true),
});

const updateVariantSchema = z.object({
  variantId: z.string().uuid(),
  sku: z.string().min(3).max(100).optional(),
  attributes: productVariantAttributesSchema.optional(),
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
  weight: z.number().positive().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Create a product variant
 */
export const createProductVariant = withErrorHandling(
  async (
    input: z.infer<typeof createVariantSchema>
  ): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = createVariantSchema.parse(input);

    // Verify product exists and has variants enabled
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, has_variants")
      .eq("id", validated.productId)
      .single();

    if (productError || !product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    if (!product.has_variants) {
      return error(
        "This product does not support variants. Enable variants on the product first.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check SKU uniqueness
    const { data: existingSku } = await supabase
      .from("product_variants")
      .select("id")
      .eq("sku", validated.sku)
      .maybeSingle();

    if (existingSku) {
      return error("SKU already exists", ErrorCode.CONFLICT);
    }

    // Create variant
    const { data: variant, error: insertError } = await supabase
      .from("product_variants")
      .insert({
        product_id: validated.productId,
        sku: validated.sku,
        attributes: validated.attributes,
        price: validated.price,
        stock_quantity: validated.stock_quantity,
        barcode: validated.barcode,
        weight: validated.weight,
        is_active: validated.is_active,
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to create variant", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "create_product_variant",
      entityType: "product_variant",
      entityId: variant.id,
      userId: admin.id,
      newValue: validated,
    });

    revalidatePath(`/admin/products/${validated.productId}`);
    revalidatePath("/admin/products");

    return success(variant, "Variant created successfully");
  }
);

/**
 * Update a product variant
 */
export const updateProductVariant = withErrorHandling(
  async (
    input: z.infer<typeof updateVariantSchema>
  ): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = updateVariantSchema.parse(input);

    // Get existing variant
    const { data: existing, error: fetchError } = await supabase
      .from("product_variants")
      .select("product_id, sku")
      .eq("id", validated.variantId)
      .single();

    if (fetchError || !existing) {
      return error("Variant not found", ErrorCode.NOT_FOUND);
    }

    // Check SKU uniqueness if changed
    if (validated.sku && validated.sku !== existing.sku) {
      const { data: existingSku } = await supabase
        .from("product_variants")
        .select("id")
        .eq("sku", validated.sku)
        .maybeSingle();

      if (existingSku) {
        return error("SKU already exists", ErrorCode.CONFLICT);
      }
    }

    // Update variant
    const { data: variant, error: updateError } = await supabase
      .from("product_variants")
      .update({
        sku: validated.sku,
        attributes: validated.attributes,
        price: validated.price,
        stock_quantity: validated.stock_quantity,
        barcode: validated.barcode,
        weight: validated.weight,
        is_active: validated.is_active,
      })
      .eq("id", validated.variantId)
      .select()
      .single();

    if (updateError) {
      return error("Failed to update variant", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "update_product_variant",
      entityType: "product_variant",
      entityId: validated.variantId,
      userId: admin.id,
      oldValue: existing,
      newValue: validated,
    });

    revalidatePath(`/admin/products/${existing.product_id}`);
    revalidatePath("/admin/products");

    return success(variant, "Variant updated successfully");
  }
);

/**
 * Delete a product variant
 */
export const deleteProductVariant = withErrorHandling(
  async (variantId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get variant
    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select("product_id, sku")
      .eq("id", variantId)
      .single();

    if (fetchError || !variant) {
      return error("Variant not found", ErrorCode.NOT_FOUND);
    }

    // Check if variant is used in orders
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("variant_id", variantId);

    if (count && count > 0) {
      return error(
        "Cannot delete variant that has been ordered. Deactivate it instead.",
        ErrorCode.CONFLICT
      );
    }

    // Delete variant
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId);

    if (deleteError) {
      return error("Failed to delete variant", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "delete_product_variant",
      entityType: "product_variant",
      entityId: variantId,
      userId: admin.id,
      oldValue: variant,
    });

    revalidatePath(`/admin/products/${variant.product_id}`);
    revalidatePath("/admin/products");

    return success(null, "Variant deleted successfully");
  }
);

/**
 * Get all variants for a product
 */
export const getProductVariants = withErrorHandling(
  async (
    productId: string,
    includeInactive = false
  ): Promise<ActionResponse> => {
    const supabase = await createClient();

    let query = supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error: fetchError } = await query.order("created_at", {
      ascending: false,
    });

    if (fetchError) {
      return error("Failed to fetch variants", ErrorCode.SERVER_ERROR);
    }

    return success(data || []);
  }
);

/**
 * Get a single variant
 */
export const getVariant = withErrorHandling(
  async (variantId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("product_variants")
      .select(
        `
        *,
        products (
          id,
          name,
          slug,
          has_variants
        )
      `
      )
      .eq("id", variantId)
      .single();

    if (fetchError) {
      return error("Variant not found", ErrorCode.NOT_FOUND);
    }

    return success(data);
  }
);

/**
 * Bulk update variant stock (for inventory management)
 */
export const bulkUpdateVariantStock = withErrorHandling(
  async (
    updates: Array<{
      variantId: string;
      quantity: number;
      operation: "set" | "add" | "subtract";
    }>
  ): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const results = [];

    for (const update of updates) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", update.variantId)
        .single();

      if (!variant) {
        results.push({
          variantId: update.variantId,
          success: false,
          error: "Not found",
        });
        continue;
      }

      let newQuantity = update.quantity;
      if (update.operation === "add") {
        newQuantity = (variant.stock_quantity ?? 0) + update.quantity;
      } else if (update.operation === "subtract") {
        newQuantity = Math.max(
          0,
          (variant.stock_quantity ?? 0) - update.quantity
        );
      }

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ stock_quantity: newQuantity })
        .eq("id", update.variantId);

      if (updateError) {
        results.push({
          variantId: update.variantId,
          success: false,
          error: updateError.message,
        });
      } else {
        results.push({
          variantId: update.variantId,
          success: true,
          newQuantity,
        });
      }
    }

    // Log audit
    await logAudit({
      action: "bulk_update_variant_stock",
      entityType: "product_variant",
      entityId: "bulk",
      userId: admin.id,
      newValue: { updates, results },
    });

    revalidatePath("/admin/inventory");

    return success(results, "Stock updated");
  }
);

/**
 * Enable variants on a product
 */
export const enableProductVariants = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from("products")
      .update({ has_variants: true })
      .eq("id", productId);

    if (updateError) {
      return error("Failed to enable variants", ErrorCode.SERVER_ERROR);
    }

    await logAudit({
      action: "enable_product_variants",
      entityType: "product",
      entityId: productId,
      userId: admin.id,
    });

    revalidatePath(`/admin/products/${productId}`);

    return success(null, "Variants enabled on product");
  }
);

/**
 * Disable variants on a product (only if no variants exist)
 */
export const disableProductVariants = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Check if variants exist
    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (count && count > 0) {
      return error(
        "Cannot disable variants when variants exist. Delete all variants first.",
        ErrorCode.CONFLICT
      );
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ has_variants: false })
      .eq("id", productId);

    if (updateError) {
      return error("Failed to disable variants", ErrorCode.SERVER_ERROR);
    }

    await logAudit({
      action: "disable_product_variants",
      entityType: "product",
      entityId: productId,
      userId: admin.id,
    });

    revalidatePath(`/admin/products/${productId}`);

    return success(null, "Variants disabled on product");
  }
);
