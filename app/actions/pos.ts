"use server";

import {
  error,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Create POS order (in-store)
 */
export const createPOSOrder = withErrorHandling(
  async (
    items: { product_id: string; quantity: number; price: number }[],
    paymentMethod: string
  ): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create a temporary address for POS orders
    const { data: address, error: addressError } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: user.id,
        address_line1: "In-Store Purchase",
        city: "Store",
        state_province: "N/A",
        postal_code: "00000",
        full_name: "POS Customer",
        phone: "0000000000",
        country: "Philippines",
      })
      .select()
      .single();

    if (addressError) return error(addressError.message);

    // Calculate totals
    const subtotal = total;
    const tax = subtotal * 0.12; // 12% tax
    const totalWithTax = subtotal + tax;

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc(
      "generate_order_number"
    );
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create the main order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        order_number: orderNumber,
        shipping_address_id: address.id,
        subtotal,
        tax,
        total: totalWithTax,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cash" ? "paid" : "pending",
        status: "processing",
      })
      .select()
      .single();

    if (orderError) return error(orderError.message);

    // Fetch product details for order items
    const productIds = items.map((item) => item.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, stock_quantity")
      .in("id", productIds);

    if (!products || products.length === 0) {
      await supabase.from("orders").delete().eq("id", order.id);
      return error("Products not found");
    }

    // Create order items with product details
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_name: product?.name || "Unknown Product",
        sku: product?.sku || "N/A",
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);
      return error(itemsError.message);
    }

    // Update product quantities
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({
            stock_quantity: (product.stock_quantity ?? 0) - item.quantity,
          })
          .eq("id", item.product_id);
      }
    }

    await logAudit({
      action: "create",
      entityType: "order",
      entityId: order.id,
      newValue: { order, items: orderItems },
    });

    revalidatePath("/admin/pos");
    revalidatePath("/admin/orders");
    return success(order, "Order created successfully");
  }
);

/**
 * Park order for later completion
 */
export const parkOrder = withErrorHandling(
  async (items: any[], notes?: string): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: parked, error: parkError } = await supabase
      .from("parked_orders")
      .insert({
        staff_id: user.id,
        cart_data: items as any,
        notes: notes,
      })
      .select()
      .single();

    if (parkError) return error(parkError.message);

    revalidatePath("/admin/pos");
    return success(parked, "Order parked");
  }
);

/**
 * Get parked orders
 */
export const getParkedOrders = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("parked_orders")
      .select("*, staff:staff_id(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (fetchError) return error(fetchError.message);

    return success(data);
  }
);

/**
 * Restore parked order
 */
export const restoreParkedOrder = withErrorHandling(
  async (parkedId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("parked_orders")
      .select()
      .eq("id", parkedId)
      .single();

    if (fetchError) return error(fetchError.message);

    // Delete parked order
    await supabase.from("parked_orders").delete().eq("id", parkedId);

    revalidatePath("/admin/pos");
    return success(data, "Order restored");
  }
);
