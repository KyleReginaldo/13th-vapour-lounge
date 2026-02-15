"use server";

import {
  applyPagination,
  buildSearchFilter,
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
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier";
import { revalidatePath } from "next/cache";

/**
 * Create a new supplier
 */
export const createSupplier = withErrorHandling(
  async (input: SupplierInput): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(supplierSchema, input);
    const supabase = await createClient();

    const { data: supplier, error: insertError } = await supabase
      .from("suppliers")
      .insert(validated)
      .select()
      .single();

    if (insertError) return error(insertError.message);

    await logAudit({
      action: "create",
      entityType: "supplier",
      entityId: supplier.id,
      newValue: supplier,
    });

    revalidatePath("/admin/suppliers");
    return success(supplier, "Supplier created successfully");
  }
);

/**
 * Update a supplier
 */
export const updateSupplier = withErrorHandling(
  async (
    id: string,
    input: Partial<SupplierInput>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: oldSupplier } = await supabase
      .from("suppliers")
      .select()
      .eq("id", id)
      .single();

    if (!oldSupplier) {
      return error("Supplier not found", ErrorCode.NOT_FOUND);
    }

    const { data: supplier, error: updateError } = await supabase
      .from("suppliers")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "supplier",
      entityId: id,
      oldValue: oldSupplier,
      newValue: supplier,
    });

    revalidatePath("/admin/suppliers");
    return success(supplier, "Supplier updated successfully");
  }
);

/**
 * Delete a supplier
 */
export const deleteSupplier = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Check if supplier has purchase orders
    const { count } = await supabase
      .from("purchase_orders")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", id);

    if (count && count > 0) {
      return error(
        "Cannot delete supplier with existing purchase orders",
        ErrorCode.CONFLICT
      );
    }

    const { data: supplier } = await supabase
      .from("suppliers")
      .select()
      .eq("id", id)
      .single();

    if (!supplier) {
      return error("Supplier not found", ErrorCode.NOT_FOUND);
    }

    const { error: deleteError } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (deleteError) return error(deleteError.message);

    await logAudit({
      action: "delete",
      entityType: "supplier",
      entityId: id,
      oldValue: supplier,
    });

    revalidatePath("/admin/suppliers");
    return success(null, "Supplier deleted successfully");
  }
);

/**
 * Get suppliers with pagination and search
 */
export const getSuppliers = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    searchTerm?: string
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("suppliers").select("*", { count: "exact" });

    // Apply search
    if (searchTerm) {
      query = buildSearchFilter(query, searchTerm, [
        "name",
        "contact_person",
        "email",
      ]);
    }

    // Apply pagination
    query = applyPagination(query, page, pageSize);
    query = query.order("name", { ascending: true });

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({
      data: data || [],
      pagination: getPaginationMeta(count || 0, page, pageSize),
    });
  }
);

/**
 * Get supplier by ID with purchase order history
 */
export const getSupplierById = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: supplier, error: fetchError } = await supabase
      .from("suppliers")
      .select(
        `
        *,
        purchase_orders(
          id,
          status,
          total_amount,
          created_at,
          expected_delivery_date
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError) return error(fetchError.message);
    if (!supplier) return error("Supplier not found", ErrorCode.NOT_FOUND);

    return success(supplier);
  }
);

/**
 * Get supplier statistics
 */
export const getSupplierStats = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get purchase orders count and total value
    const { data: purchaseOrders } = await supabase
      .from("purchase_orders")
      .select("total, status")
      .eq("supplier_id", id);

    const stats = {
      totalPurchaseOrders: purchaseOrders?.length || 0,
      totalValue:
        purchaseOrders?.reduce((sum, po) => sum + (po.total || 0), 0) || 0,
      pendingOrders:
        purchaseOrders?.filter((po) => po.status === "pending").length || 0,
      receivedOrders:
        purchaseOrders?.filter((po) => po.status === "received").length || 0,
    };

    return success(stats);
  }
);
