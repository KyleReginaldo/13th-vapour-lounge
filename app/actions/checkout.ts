"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { createClient } from "@/lib/supabase/server";
import { sanitizeOrderInput } from "@/lib/validations/sanitize";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  paymentMethod: z.enum(["gcash", "cash_on_delivery"]),
  customerNotes: z.string().optional(),
});

/**
 * Create order from cart
 */
export const createOrderFromCart = withErrorHandling(
  async (
    input: z.infer<typeof checkoutSchema>
  ): Promise<ActionResponse<{ orderId: string; orderNumber: string }>> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const validated = sanitizeOrderInput(checkoutSchema.parse(input));

    // Get cart items
    const { data: cartItems } = await supabase
      .from("carts")
      .select(
        `
        id,
        quantity,
        product_id,
        variant_id,
        products!inner (
          id,
          name,
          sku,
          base_price,
          has_variants,
          stock_quantity
        ),
        product_variants (
          id,
          sku,
          price,
          stock_quantity,
          attributes
        )
      `
      )
      .eq("user_id", user.id);

    if (!cartItems || cartItems.length === 0) {
      return error("Your cart is empty", ErrorCode.VALIDATION_ERROR);
    }

    // Validate stock availability
    for (const item of cartItems) {
      const availableStock = item.product_variants
        ? item.product_variants.stock_quantity
        : item.products.stock_quantity;

      if (item.quantity > (availableStock ?? 0)) {
        return error(
          `Product "${item.products.name}" only has ${availableStock} items in stock`,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    // Get shipping address
    const { data: address } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("id", validated.shippingAddressId)
      .eq("customer_id", user.id)
      .single();

    if (!address) {
      return error("Shipping address not found", ErrorCode.NOT_FOUND);
    }

    // Calculate totals
    const taxRate = 0.12; // 12% VAT
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.product_variants?.price || item.products.base_price;
      return sum + price * item.quantity;
    }, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generate order number using database function
    const { data: orderNumberData } = await supabase.rpc(
      "generate_order_number"
    );
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        status: "pending",
        payment_status: "unpaid",
        payment_method: validated.paymentMethod,
        subtotal,
        tax,
        total,
        shipping_cost: 0,
        discount: 0,
        shipping_address_id: address.id,
        shipping_full_name: address.full_name,
        shipping_phone: address.phone,
        shipping_address_line1: address.address_line1,
        shipping_address_line2: address.address_line2,
        shipping_city: address.city,
        shipping_postal_code: address.postal_code,
        shipping_country: address.country,
        customer_notes: validated.customerNotes,
      })
      .select()
      .single();

    if (orderError) {
      return error("Failed to create order", ErrorCode.SERVER_ERROR);
    }

    // Create order items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.products.name,
      variant_attributes: item.product_variants?.attributes,
      sku: item.product_variants?.sku || item.products.sku,
      quantity: item.quantity,
      unit_price: item.product_variants?.price || item.products.base_price,
      subtotal:
        (item.product_variants?.price || item.products.base_price) *
        item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return error("Failed to create order items", ErrorCode.SERVER_ERROR);
    }

    // Decrease stock for each item
    for (const item of cartItems) {
      if (item.variant_id) {
        // Decrease variant stock
        await supabase.rpc("decrease_variant_stock", {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
          p_user_id: user.id,
        });
      } else {
        // Decrease product stock
        await supabase
          .from("products")
          .update({
            stock_quantity: (item.products.stock_quantity ?? 0) - item.quantity,
          })
          .eq("id", item.product_id);

        // Log stock movement
        await supabase.from("stock_movements").insert({
          product_id: item.product_id,
          movement_type: "stock_out",
          quantity_change: -item.quantity,
          performed_by: user.id,
          reference_id: order.id,
          reason: `Order ${orderNumber}`,
        });
      }
    }

    // Clear cart
    await supabase.from("carts").delete().eq("user_id", user.id);

    // Create order status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      to_status: "pending",
      notes: "Order created",
    });

    revalidatePath("/cart");
    revalidatePath("/orders");

    return success(
      { orderId: order.id, orderNumber: order.order_number },
      "Order created successfully"
    );
  }
);

/**
 * Get user's orders
 */
export const getMyOrders = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        total,
        created_at,
        order_items!inner (
          quantity,
          products!inner (name)
        )
      `
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return error("Failed to fetch orders", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

/**
 * Get order details
 */
export const getOrderDetails = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items!inner (
          id,
          quantity,
          unit_price,
          subtotal,
          product_name,
          variant_attributes,
          products (name, slug),
          product_variants (attributes)
        ),
        payment_proofs (
          id,
          status,
          reference_number,
          uploaded_at,
          verified_at
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    // Check if user owns this order or is admin/staff
    const { data: userRecord } = await supabase
      .from("users")
      .select("role_id, roles!inner (name)")
      .eq("id", user.id)
      .single();

    const isAdmin =
      userRecord?.roles.name === "admin" || userRecord?.roles.name === "staff";

    if (order.customer_id !== user.id && !isAdmin) {
      return error("Access denied", ErrorCode.FORBIDDEN);
    }

    return success(order);
  }
);

/**
 * Cancel order (customer)
 */
export const cancelOrder = withErrorHandling(
  async (orderId: string, reason: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Get order
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id, status")
      .eq("id", orderId)
      .single();

    if (!order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    if (order.customer_id !== user.id) {
      return error("Access denied", ErrorCode.FORBIDDEN);
    }

    // Can only cancel pending or unpaid orders
    if (!["pending", "paid"].includes(order.status ?? "")) {
      return error(
        "Cannot cancel order in current status",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        customer_notes: reason,
      })
      .eq("id", orderId);

    if (updateError) {
      return error("Failed to cancel order", ErrorCode.SERVER_ERROR);
    }

    // Add to status history
    await supabase.from("order_status_history").insert({
      order_id: orderId,
      from_status: order.status,
      to_status: "cancelled",
      notes: `Cancelled by customer: ${reason}`,
    });

    // TODO: Restore stock

    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");

    return success(null, "Order cancelled successfully");
  }
);
