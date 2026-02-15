"use server";

import {
  applyPagination,
  error,
  ErrorCode,
  getPaginationMeta,
  success,
  validateInput,
  withErrorHandling,
  type ActionResponse,
  type PaginatedResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  inventoryBatchSchema,
  stockAdjustmentSchema,
  stockAlertSchema,
  type InventoryBatchInput,
  type StockAdjustmentInput,
} from "@/lib/validations/inventory";
import { revalidatePath } from "next/cache";

/**
 * Create a new inventory batch
 */
export const createInventoryBatch = withErrorHandling(
  async (input: InventoryBatchInput): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(inventoryBatchSchema, input);
    const supabase = await createClient();

    // Map validation schema to database schema
    const batchData = {
      product_id: validated.product_id,
      supplier_id: validated.supplier_id,
      batch_number: validated.batch_number || `BATCH-${Date.now()}`,
      quantity: validated.quantity_received,
      remaining_quantity:
        validated.quantity_remaining ?? validated.quantity_received,
      expiry_date: validated.expiry_date,
      received_date: validated.received_at ?? new Date().toISOString(),
    };

    const { data: batch, error: batchError } = await supabase
      .from("inventory_batches")
      .insert(batchData)
      .select()
      .single();

    if (batchError) return error(batchError.message);

    await logAudit({
      action: "create",
      entityType: "inventory",
      entityId: batch.id,
      newValue: batch,
    });

    revalidatePath("/admin/inventory");
    return success(batch, "Inventory batch created successfully");
  }
);

/**
 * Update an inventory batch
 */
export const updateInventoryBatch = withErrorHandling(
  async (
    id: string,
    input: Partial<InventoryBatchInput>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get old value for audit
    const { data: oldBatch } = await supabase
      .from("inventory_batches")
      .select()
      .eq("id", id)
      .single();

    if (!oldBatch) {
      return error("Inventory batch not found", ErrorCode.NOT_FOUND);
    }

    const { data: batch, error: updateError } = await supabase
      .from("inventory_batches")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "inventory",
      entityId: id,
      oldValue: oldBatch,
      newValue: batch,
    });

    revalidatePath("/admin/inventory");
    return success(batch, "Inventory batch updated successfully");
  }
);

/**
 * Delete an inventory batch
 */
export const deleteInventoryBatch = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data: batch } = await supabase
      .from("inventory_batches")
      .select()
      .eq("id", id)
      .single();

    if (!batch) {
      return error("Inventory batch not found", ErrorCode.NOT_FOUND);
    }

    const { error: deleteError } = await supabase
      .from("inventory_batches")
      .delete()
      .eq("id", id);

    if (deleteError) return error(deleteError.message);

    await logAudit({
      action: "delete",
      entityType: "inventory",
      entityId: id,
      oldValue: batch,
    });

    revalidatePath("/admin/inventory");
    return success(null, "Inventory batch deleted successfully");
  }
);

/**
 * Get inventory with pagination and filters
 */
export const getInventory = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    filters?: { product_id?: string; supplier_id?: string }
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("inventory_batches").select(
      `
        *,
        products:product_id(id, name, category),
        suppliers:supplier_id(id, name)
      `,
      { count: "exact" }
    );

    // Apply filters
    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id);
    }
    if (filters?.supplier_id) {
      query = query.eq("supplier_id", filters.supplier_id);
    }

    // Apply pagination
    query = applyPagination(query, page, pageSize);
    query = query.order("received_at", { ascending: false });

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({
      data: data || [],
      pagination: getPaginationMeta(count || 0, page, pageSize),
    });
  }
);

/**
 * Adjust inventory quantity
 */
export const adjustInventoryQuantity = withErrorHandling(
  async (input: StockAdjustmentInput): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(stockAdjustmentSchema, input);
    const supabase = await createClient();

    // Get current batch
    const { data: batch } = await supabase
      .from("inventory_batches")
      .select()
      .eq("id", validated.batch_id)
      .single();

    if (!batch) {
      return error("Inventory batch not found", ErrorCode.NOT_FOUND);
    }

    const newQuantity = (batch.remaining_quantity || 0) + validated.adjustment;

    if (newQuantity < 0) {
      return error(
        "Adjustment would result in negative quantity",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Update inventory
    const { data: updatedBatch, error: updateError } = await supabase
      .from("inventory_batches")
      .update({ remaining_quantity: newQuantity })
      .eq("id", validated.batch_id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    // Get current user for performed_by
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return error("User not authenticated", ErrorCode.UNAUTHORIZED);

    // Record stock movement
    await supabase.from("stock_movements").insert({
      product_id: batch.product_id,
      movement_type:
        validated.adjustment > 0 ? "adjustment_in" : "adjustment_out",
      quantity_change: validated.adjustment,
      reason: validated.reason,
      reference_id: validated.batch_id,
      performed_by: user.id,
    } as any);

    await logAudit({
      action: "stock_adjustment",
      entityType: "inventory",
      entityId: validated.batch_id,
      oldValue: { remaining_quantity: batch.remaining_quantity },
      newValue: { remaining_quantity: newQuantity, reason: validated.reason },
    });

    revalidatePath("/admin/inventory");
    return success(updatedBatch, "Inventory adjusted successfully");
  }
);

/**
 * Get stock alerts
 */
export const getStockAlerts = withErrorHandling(
  async (onlyUnresolved: boolean = true): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase
      .from("stock_alerts")
      .select(
        `
        *,
        products:product_id(id, name, category, quantity)
      `
      )
      .order("created_at", { ascending: false });

    if (onlyUnresolved) {
      query = query.eq("is_resolved", false);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) return error(fetchError.message);

    return success(data);
  }
);

/**
 * Resolve a stock alert
 */
export const resolveStockAlert = withErrorHandling(
  async (alertId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: updateError } = await supabase
      .from("stock_alerts")
      .update({ is_resolved: true })
      .eq("id", alertId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/inventory");
    return success(data, "Alert resolved successfully");
  }
);

/**
 * Create a manual stock alert
 */
export const createStockAlert = withErrorHandling(
  async (
    input: Omit<StockAdjustmentInput, "batch_id">
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(stockAlertSchema, input);
    const supabase = await createClient();

    const { data, error: insertError } = await supabase
      .from("stock_alerts")
      .insert(validated)
      .select()
      .single();

    if (insertError) return error(insertError.message);

    revalidatePath("/admin/inventory");
    return success(data, "Stock alert created successfully");
  }
);

/**
 * Get inventory by product
 */
export const getInventoryByProduct = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("inventory_batches")
      .select(
        `
        *,
        suppliers:supplier_id(id, name)
      `
      )
      .eq("product_id", productId)
      .order("received_at", { ascending: false });

    if (fetchError) return error(fetchError.message);

    return success(data);
  }
);
