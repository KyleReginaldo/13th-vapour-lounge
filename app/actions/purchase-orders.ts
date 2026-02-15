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
  purchaseOrderSchema,
  updatePOStatusSchema,
  type PurchaseOrderInput,
} from "@/lib/validations/purchase-order";
import { revalidatePath } from "next/cache";

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = withErrorHandling(
  async (input: PurchaseOrderInput): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const validated = validateInput(purchaseOrderSchema, input);
    const supabase = await createClient();

    // Calculate subtotal (sum of all items)
    const subtotal = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    // Calculate tax (12%)
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    // Generate PO number (PO-YYYYMMDD-XXXXX format)
    const timestamp = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, "0");
    const po_number = `PO-${timestamp}-${randomNum}`;

    // Create purchase order
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number,
        supplier_id: validated.supplier_id,
        expected_delivery_date: validated.expected_delivery_date,
        subtotal,
        tax,
        total,
        status: validated.status || "pending",
        created_by: user.id,
      })
      .select()
      .single();

    if (poError) return error(poError.message);

    // Create PO items - map to database schema
    const itemsToInsert = validated.items.map((item) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback PO if items fail
      await supabase.from("purchase_orders").delete().eq("id", po.id);
      return error(itemsError.message);
    }

    await logAudit({
      action: "create",
      entityType: "purchase_order",
      entityId: po.id,
      newValue: { ...po, items: itemsToInsert },
    });

    revalidatePath("/admin/purchase-orders");
    return success(po, "Purchase order created successfully");
  }
);

/**
 * Update purchase order status
 */
export const updatePurchaseOrderStatus = withErrorHandling(
  async (id: string, status: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const validated = validateInput(updatePOStatusSchema, { status });
    const supabase = await createClient();

    const { data: oldPO } = await supabase
      .from("purchase_orders")
      .select()
      .eq("id", id)
      .single();

    if (!oldPO) {
      return error("Purchase order not found", ErrorCode.NOT_FOUND);
    }

    const { data: po, error: updateError } = await supabase
      .from("purchase_orders")
      .update({ status: validated.status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "status_change",
      entityType: "purchase_order",
      entityId: id,
      oldValue: { status: oldPO.status },
      newValue: { status: validated.status },
    });

    revalidatePath("/admin/purchase-orders");
    return success(po, "Purchase order status updated");
  }
);

/**
 * Receive purchase order and create inventory
 */
export const receivePurchaseOrder = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get PO with items
    const { data: po } = await supabase
      .from("purchase_orders")
      .select(`*, purchase_order_items(*)`)
      .eq("id", id)
      .single();

    if (!po) {
      return error("Purchase order not found", ErrorCode.NOT_FOUND);
    }

    if (po.status === "received") {
      return error("Purchase order already received", ErrorCode.CONFLICT);
    }

    // Create inventory batches for each item
    const inventoryBatches = po.purchase_order_items?.map((item: any) => ({
      product_id: item.product_id,
      supplier_id: po.supplier_id,
      quantity: item.quantity,
      remaining_quantity: item.quantity,
      received_date: new Date().toISOString(),
      batch_number: `PO-${po.id.slice(0, 8)}-${item.product_id.slice(0, 8)}`,
      cost_per_unit: item.unit_cost,
    }));

    const { error: inventoryError } = await supabase
      .from("inventory_batches")
      .insert(inventoryBatches);

    if (inventoryError) return error(inventoryError.message);

    // Update products quantity
    for (const item of po.purchase_order_items || []) {
      if (item.product_id && item.quantity) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single();

        if (product) {
          await supabase
            .from("products")
            .update({
              stock_quantity: (product.stock_quantity || 0) + item.quantity,
            })
            .eq("id", item.product_id);
        }
      }
    }

    // Update PO status
    const { data: updatedPO, error: statusError } = await supabase
      .from("purchase_orders")
      .update({ status: "received" })
      .eq("id", id)
      .select()
      .single();

    if (statusError) return error(statusError.message);

    await logAudit({
      action: "update",
      entityType: "purchase_order",
      entityId: id,
      oldValue: po,
      newValue: updatedPO,
    });

    revalidatePath("/admin/purchase-orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    return success(updatedPO, "Purchase order received and inventory updated");
  }
);

/**
 * Get purchase orders with pagination and filters
 */
export const getPurchaseOrders = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    filters?: { status?: string; supplier_id?: string }
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("purchase_orders").select(
      `
        *,
        suppliers:supplier_id(id, name),
        users:created_by(first_name, last_name)
      `,
      { count: "exact" }
    );

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.supplier_id) {
      query = query.eq("supplier_id", filters.supplier_id);
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
 * Get purchase order by ID with items
 */
export const getPurchaseOrderById = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: po, error: fetchError } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers:supplier_id(*),
        users:created_by(first_name, last_name),
        purchase_order_items(
          *,
          products:product_id(id, name, images)
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError) return error(fetchError.message);
    if (!po) return error("Purchase order not found", ErrorCode.NOT_FOUND);

    return success(po);
  }
);

/**
 * Delete/Cancel purchase order
 */
export const deletePurchaseOrder = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data: po } = await supabase
      .from("purchase_orders")
      .select()
      .eq("id", id)
      .single();

    if (!po) {
      return error("Purchase order not found", ErrorCode.NOT_FOUND);
    }

    if (po.status === "received") {
      return error("Cannot delete received purchase order", ErrorCode.CONFLICT);
    }

    // Update to cancelled instead of deleting
    const { error: updateError } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "delete",
      entityType: "purchase_order",
      entityId: id,
      oldValue: po,
    });

    revalidatePath("/admin/purchase-orders");
    return success(null, "Purchase order cancelled");
  }
);
