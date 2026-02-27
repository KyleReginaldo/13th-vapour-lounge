"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHTML } from "@/lib/validations/sanitize";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const brandSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  isActive: z.boolean().default(true),
});

// ============ CATEGORIES ============

/**
 * Create category
 */
export const createCategory = withErrorHandling(
  async (input: z.infer<typeof categorySchema>): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = categorySchema.parse(input);

    const sanitized = {
      ...validated,
      name: sanitizeHTML(validated.name),
      description: validated.description
        ? sanitizeHTML(validated.description)
        : null,
    };

    const { data, error: insertError } = await supabase
      .from("categories")
      .insert({
        name: sanitized.name,
        slug: sanitized.slug,
        description: sanitized.description,
        parent_id: sanitized.parentId,
        image_url: sanitized.imageUrl,
        sort_order: sanitized.sortOrder,
        is_active: sanitized.isActive,
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to create category", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return success(data, "Category created successfully");
  }
);

/**
 * Update category
 */
export const updateCategory = withErrorHandling(
  async (
    categoryId: string,
    input: Partial<z.infer<typeof categorySchema>>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const sanitized = {
      ...input,
      name: input.name ? sanitizeHTML(input.name) : undefined,
      description: input.description
        ? sanitizeHTML(input.description)
        : undefined,
    };

    // Map camelCase input to snake_case DB columns (only include defined fields)
    const updateData: Record<string, unknown> = {};
    if (sanitized.name !== undefined) updateData.name = sanitized.name;
    if (sanitized.slug !== undefined) updateData.slug = sanitized.slug;
    if (sanitized.description !== undefined)
      updateData.description = sanitized.description;
    if (sanitized.parentId !== undefined)
      updateData.parent_id = sanitized.parentId;
    if (sanitized.imageUrl !== undefined)
      updateData.image_url = sanitized.imageUrl;
    if (sanitized.sortOrder !== undefined)
      updateData.sort_order = sanitized.sortOrder;
    if (sanitized.isActive !== undefined)
      updateData.is_active = sanitized.isActive;

    const { data, error: updateError } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", categoryId)
      .select()
      .single();

    if (updateError) {
      return error("Failed to update category", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return success(data, "Category updated successfully");
  }
);

/**
 * Delete category
 */
export const deleteCategory = withErrorHandling(
  async (categoryId: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Check if category has products
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (count && count > 0) {
      return error(
        `Cannot delete category with ${count} products. Move or delete products first.`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (deleteError) {
      return error("Failed to delete category", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return success(null, "Category deleted successfully");
  }
);

/**
 * Get all categories with hierarchy
 */
export const getCategories = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (fetchError) {
      return error("Failed to fetch categories", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

// ============ BRANDS ============

/**
 * Create brand
 */
export const createBrand = withErrorHandling(
  async (input: z.infer<typeof brandSchema>): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = brandSchema.parse(input);

    const sanitized = {
      ...validated,
      name: sanitizeHTML(validated.name),
      description: validated.description
        ? sanitizeHTML(validated.description)
        : null,
    };

    const { data, error: insertError } = await supabase
      .from("brands")
      .insert({
        name: sanitized.name,
        slug: sanitized.slug,
        description: sanitized.description,
        logo_url: sanitized.logoUrl,
        website: sanitized.website,
        is_active: sanitized.isActive,
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to create brand", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/brands");
    revalidatePath("/products");

    return success(data, "Brand created successfully");
  }
);

/**
 * Update brand
 */
export const updateBrand = withErrorHandling(
  async (
    brandId: string,
    input: Partial<z.infer<typeof brandSchema>>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const sanitized = {
      ...input,
      name: input.name ? sanitizeHTML(input.name) : undefined,
      description: input.description
        ? sanitizeHTML(input.description)
        : undefined,
    };

    const { data, error: updateError } = await supabase
      .from("brands")
      .update(sanitized)
      .eq("id", brandId)
      .select()
      .single();

    if (updateError) {
      return error("Failed to update brand", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/brands");
    revalidatePath("/products");

    return success(data, "Brand updated successfully");
  }
);

/**
 * Delete brand
 */
export const deleteBrand = withErrorHandling(
  async (brandId: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Check if brand has products
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId);

    if (count && count > 0) {
      return error(
        `Cannot delete brand with ${count} products. Reassign or delete products first.`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { error: deleteError } = await supabase
      .from("brands")
      .delete()
      .eq("id", brandId);

    if (deleteError) {
      return error("Failed to delete brand", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/brands");
    revalidatePath("/products");

    return success(null, "Brand deleted successfully");
  }
);

/**
 * Get all brands
 */
export const getBrands = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      return error("Failed to fetch brands", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);
