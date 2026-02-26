"use server";

import { withErrorHandling, type ActionResponse } from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";

export type SplitPayment = {
  method: "cash" | "card" | "gcash" | "maya";
  amount: number;
};

export type ReceiptData = {
  receiptNumber: string;
  orderNumber?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  payments: SplitPayment[];
  cashReceived?: number;
  change?: number;
  timestamp: string;
  servedBy: string;
};

/**
 * Create POS order with split payments
 */
export const createPOSOrderWithSplitPayment = withErrorHandling(
  async (
    items: { product_id: string; quantity: number; price: number }[],
    payments: SplitPayment[],
    customerId?: string
  ): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Validate split payments total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const subtotal = total;
    const tax = 0;
    const totalWithTax = subtotal;

    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    if (Math.abs(paymentsTotal - totalWithTax) > 0.01) {
      throw new Error(
        `Payment total (${paymentsTotal}) does not match order total (${totalWithTax})`
      );
    }

    // Create a temporary address for POS orders
    const { data: address, error: addressError } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customerId || user.id,
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

    if (addressError) throw addressError;

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc(
      "generate_order_number"
    );
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Primary payment method
    const primaryPayment = payments[0];

    // Create the main order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId || user.id,
        order_number: orderNumber,
        shipping_address_id: address.id,
        subtotal,
        tax,
        total: totalWithTax,
        shipping_cost: 0,
        payment_method: primaryPayment.method,
        payment_status: "paid",
        status: "processing",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Fetch product details for order items
    const productIds = items.map((item) => item.product_id);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, stock_quantity")
      .in("id", productIds);

    if (!products || products.length === 0) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error("Products not found");
    }

    // Create order items
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
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
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

    // Generate receipt
    const receiptNumber = `RCP-${Date.now()}`;
    const receiptData: ReceiptData = {
      receiptNumber,
      orderNumber,
      items: orderItems.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        subtotal: item.subtotal,
      })),
      subtotal,
      tax,
      total: totalWithTax,
      payments,
      timestamp: new Date().toISOString(),
      servedBy: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    };

    await supabase.from("receipts").insert({
      order_id: order.id,
      receipt_number: receiptNumber,
      receipt_data: receiptData,
    });

    return {
      success: true,
      data: {
        order,
        receipt: receiptData,
      },
      message: "Order created successfully",
    };
  }
);

/**
 * Generate receipt for existing order
 */
export const generateReceipt = withErrorHandling(
  async (orderId: string): Promise<ActionResponse<ReceiptData>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items(*)
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    // Check if receipt already exists
    const { data: existingReceipt } = await supabase
      .from("receipts")
      .select("receipt_data")
      .eq("order_id", orderId)
      .single();

    if (existingReceipt) {
      return {
        success: true,
        data: existingReceipt.receipt_data as ReceiptData,
      };
    }

    // Create new receipt
    const receiptNumber = `RCP-${Date.now()}`;
    const receiptData: ReceiptData = {
      receiptNumber,
      orderNumber: order.order_number || undefined,
      items: (order.order_items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        subtotal: item.subtotal,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      payments: [
        {
          method: (order.payment_method as any) || "cash",
          amount: order.total,
        },
      ],
      timestamp: order.created_at || new Date().toISOString(),
      servedBy: "Staff",
    };

    await supabase.from("receipts").insert({
      order_id: orderId,
      receipt_number: receiptNumber,
      receipt_data: receiptData,
    });

    return {
      success: true,
      data: receiptData,
    };
  }
);
