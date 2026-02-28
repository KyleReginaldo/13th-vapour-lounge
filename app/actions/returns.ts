"use server";

import {
  type ActionResponse,
  applyPagination,
  error,
  ErrorCode,
  getPaginationMeta,
  type PaginatedResponse,
  success,
  validateInput,
  withErrorHandling,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireClockedIn, requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  approveReturnSchema,
  rejectReturnSchema,
  restockReturnSchema,
} from "@/lib/validations/return";
import { revalidatePath } from "next/cache";

/**
 * Get returns with pagination and filters
 */
export const getReturns = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("returns").select(
      `
        *,
        customer:users!customer_id(first_name, last_name, email),
        order:order_id(id, total_price, products:product_id(name)),
        processor:users!processed_by(first_name, last_name)
      `,
      { count: "exact" }
    );

    if (status) {
      query = query.eq("status", status);
    }

    query = applyPagination(query, page, pageSize);
    query = query.order("created_at", { ascending: false });

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({
      data: data || [],
      pagination: getPaginationMeta(count || 0, page, pageSize),
    });
  }
);

/**
 * Approve return request
 */
export const approveReturn = withErrorHandling(
  async (returnId: string, refundAmount: number): Promise<ActionResponse> => {
    const user = await requireClockedIn();
    const validated = validateInput(approveReturnSchema, {
      return_id: returnId,
      refund_amount: refundAmount,
    });
    const supabase = await createClient();

    const { data: returnData, error: updateError } = await supabase
      .from("returns")
      .update({
        status: "approved",
        refund_amount: validated.refund_amount,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", validated.return_id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "return",
      entityId: validated.return_id,
      newValue: returnData,
    });

    revalidatePath("/admin/returns");
    return success(returnData, "Return approved successfully");
  }
);

/**
 * Reject return request
 */
export const rejectReturn = withErrorHandling(
  async (returnId: string, reason: string): Promise<ActionResponse> => {
    const user = await requireClockedIn();
    const validated = validateInput(rejectReturnSchema, {
      return_id: returnId,
      reason,
    });
    const supabase = await createClient();

    const { data: returnData, error: updateError } = await supabase
      .from("returns")
      .update({
        status: "rejected",
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq("id", validated.return_id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "return",
      entityId: validated.return_id,
      newValue: { ...returnData, rejection_reason: validated.reason },
    });

    revalidatePath("/admin/returns");
    return success(returnData, "Return rejected");
  }
);

/**
 * Complete return and mark as refunded
 */
export const completeReturn = withErrorHandling(
  async (returnId: string): Promise<ActionResponse> => {
    await requireClockedIn();
    const supabase = await createClient();

    const { data: returnData, error: updateError } = await supabase
      .from("returns")
      .update({ status: "completed" })
      .eq("id", returnId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    // Update order status to refunded
    if (returnData.order_id) {
      await supabase
        .from("orders")
        .update({
          payment_status: "refunded",
          refunded_at: new Date().toISOString(),
        })
        .eq("id", returnData.order_id);
    }

    revalidatePath("/admin/returns");
    revalidatePath("/admin/orders");
    return success(returnData, "Return completed and refunded");
  }
);

/**
 * Restock returned item
 */
export const restockReturnedItem = withErrorHandling(
  async (returnId: string, quantity: number): Promise<ActionResponse> => {
    const user = await requireClockedIn();
    const validated = validateInput(restockReturnSchema, {
      return_id: returnId,
      quantity,
    });
    const supabase = await createClient();

    // Get return details with return items
    const { data: returnData } = await supabase
      .from("returns")
      .select("*, return_items(*, order_items(product_id))")
      .eq("id", validated.return_id)
      .single();

    if (
      !returnData ||
      !returnData.return_items ||
      returnData.return_items.length === 0
    ) {
      return error("Return or return items not found", ErrorCode.NOT_FOUND);
    }

    // Restock each return item
    for (const returnItem of returnData.return_items) {
      const product_id = returnItem.order_items?.product_id;
      if (!product_id) continue;

      // Update product stock quantity
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({
            stock_quantity: (product.stock_quantity || 0) + returnItem.quantity,
          })
          .eq("id", product_id);
      }

      // Record stock movement
      await supabase.from("stock_movements").insert({
        product_id: product_id,
        movement_type: "return",
        quantity_change: returnItem.quantity,
        reason: `Restocked from return ${validated.return_id}`,
        reference_id: validated.return_id,
        performed_by: user.id,
      });
    }

    revalidatePath("/admin/returns");
    revalidatePath("/admin/products");
    return success(null, "Item restocked successfully");
  }
);
