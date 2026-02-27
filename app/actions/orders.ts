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
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  cancelOrderSchema,
  trackingNumberSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "@/lib/validations/order";
import { revalidatePath } from "next/cache";

/**
 * Get orders with pagination and filters
 */
export const getOrders = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    filters?: { status?: string; payment_status?: string }
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("orders").select(
      `
        *,
        users:user_id(first_name, last_name, email),
        products:product_id(name, images),
        address:address_id(street, city, state, zip_code)
      `,
      { count: "exact" }
    );

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.payment_status) {
      query = query.eq("payment_status", filters.payment_status);
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
 * Update order status
 */
export const updateOrderStatus = withErrorHandling(
  async (id: string, statusInput: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(updateOrderStatusSchema, {
      status: statusInput,
    });
    const supabase = await createClient();

    const { data: oldOrder } = await supabase
      .from("orders")
      .select()
      .eq("id", id)
      .single();

    if (!oldOrder) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const updateData: any = { status: validated.status };

    if (validated.status === "delivered") {
      updateData.completed_at = new Date().toISOString();
    } else if (validated.status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "status_change",
      entityType: "order",
      entityId: id,
      oldValue: { status: oldOrder.status },
      newValue: { status: validated.status },
    });

    revalidatePath("/admin/orders");
    return success(order, `Order status updated to ${validated.status}`);
  }
);

/**
 * Update payment status
 */
export const updatePaymentStatus = withErrorHandling(
  async (id: string, paymentStatusInput: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(updatePaymentStatusSchema, {
      payment_status: paymentStatusInput,
    });
    const supabase = await createClient();

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: validated.payment_status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "order",
      entityId: id,
      newValue: { payment_status: validated.payment_status },
    });

    revalidatePath("/admin/orders");
    return success(order, "Payment status updated");
  }
);

/**
 * Cancel order
 */
export const cancelOrder = withErrorHandling(
  async (id: string, reason: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(cancelOrderSchema, { reason });
    const supabase = await createClient();

    const { data: order } = await supabase
      .from("orders")
      .select()
      .eq("id", id)
      .single();

    if (!order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    if (order.status === "delivered") {
      return error("Cannot cancel delivered order", ErrorCode.CONFLICT);
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "order",
      entityId: id,
      oldValue: order,
      newValue: { ...updatedOrder, cancellation_reason: validated.reason },
    });

    revalidatePath("/admin/orders");
    return success(updatedOrder, "Order cancelled successfully");
  }
);

/**
 * Cancel order — customer-facing (pending orders only)
 */
export const cancelOrderByCustomer = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return error("Not authenticated", ErrorCode.UNAUTHORIZED);

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, order_number, customer_id")
      .eq("id", id)
      .eq("customer_id", authUser.id)
      .maybeSingle();

    if (!order) return error("Order not found", ErrorCode.NOT_FOUND);

    if (order.status !== "pending") {
      return error(
        "This order can no longer be cancelled. Only pending orders can be cancelled.",
        ErrorCode.CONFLICT
      );
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        customer_notes: "Cancelled by customer",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "order",
      entityId: id,
      oldValue: { status: "pending" },
      newValue: { status: "cancelled", cancelled_by: "customer" },
    });

    revalidatePath("/profile");
    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    return success(updatedOrder, "Order cancelled successfully");
  }
);

/**
 * Generate and assign tracking number
 */
export const assignTrackingNumber = withErrorHandling(
  async (id: string, trackingNumber: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(trackingNumberSchema, {
      tracking_number: trackingNumber,
    });
    const supabase = await createClient();

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        tracking_number: validated.tracking_number,
        status: "shipped",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/orders");
    return success(order, "Tracking number assigned");
  }
);
