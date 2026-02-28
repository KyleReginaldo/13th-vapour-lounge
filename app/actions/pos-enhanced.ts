"use server";

import type { Database, Json } from "@/database.types";
import { withErrorHandling, type ActionResponse } from "@/lib/actions/utils";
import { requireClockedIn } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/supabase-auth";
import { NOTIF_TYPES } from "@/lib/constants/notifications";
import { createClient } from "@/lib/supabase/server";
import { notifyAdminAndActiveStaff } from "./notifications";

type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export type SplitPayment = {
  method: "cash" | "card" | "gcash" | "maya";
  amount: number;
};

export type ReceiptData = {
  receiptNumber: string;
  orderNumber?: string;
  items: {
    name: string;
    variantLabel?: string;
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
    items: {
      product_id: string;
      variant_id?: string;
      quantity: number;
      price: number;
    }[],
    payments: SplitPayment[],
    cashReceived?: number,
    customerId?: string
  ): Promise<ActionResponse> => {
    const user = await requireClockedIn();
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

    // Fetch variant details for items that have a variant_id
    const variantIds = items
      .map((item) => item.variant_id)
      .filter((id): id is string => !!id);
    const { data: variants } =
      variantIds.length > 0
        ? await supabase
            .from("product_variants")
            .select("id, sku, price, stock_quantity, attributes")
            .in("id", variantIds)
        : {
            data: [] as {
              id: string;
              sku: string;
              price: number | null;
              stock_quantity: number | null;
              attributes: unknown;
            }[],
          };

    // Create order items
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const variant = variants?.find((v) => v.id === item.variant_id);
      const variantLabel = variant?.attributes
        ? Object.values(variant.attributes as Record<string, string>).join(
            " / "
          )
        : undefined;
      return {
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: product?.name || "Unknown Product",
        sku: variant?.sku || product?.sku || "N/A",
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
        _variantLabel: variantLabel,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .insert(orderItems.map(({ _variantLabel, ...rest }) => rest));

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    // Update stock — deduct from variant if applicable, else from product
    for (const item of items) {
      if (item.variant_id) {
        const variant = variants?.find((v) => v.id === item.variant_id);
        if (variant) {
          await supabase
            .from("product_variants")
            .update({
              stock_quantity: (variant.stock_quantity ?? 0) - item.quantity,
            })
            .eq("id", item.variant_id);
        }
      } else {
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
    }

    // Generate receipt
    const receiptNumber = `RCP-${Date.now()}`;

    // --- Save to pos_transactions & pos_transaction_items ---
    const transactionNumber = `TXN-${Date.now()}`;
    const primaryPaymentMethod = primaryPayment.method;
    const hasCash = payments.some((p) => p.method === "cash");
    const actualCashReceived = hasCash ? (cashReceived ?? null) : null;
    const changeGiven =
      actualCashReceived !== null
        ? Math.max(0, actualCashReceived - totalWithTax)
        : null;

    const { data: posTransaction, error: posTransactionError } = await supabase
      .from("pos_transactions")
      .insert({
        staff_id: user.id,
        customer_id: customerId || null,
        transaction_number: transactionNumber,
        receipt_number: receiptNumber,
        payment_method: primaryPaymentMethod,
        payment_details: payments as unknown as Json,
        cash_received: actualCashReceived,
        change_given: changeGiven,
        subtotal,
        tax,
        total: totalWithTax,
        status: "completed",
      })
      .select()
      .single();

    if (!posTransactionError && posTransaction) {
      const posItems = items.map((item) => ({
        transaction_id: posTransaction.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));
      await supabase.from("pos_transaction_items").insert(posItems);
    }
    // ---------------------------------------------------------
    const receiptData: ReceiptData = {
      receiptNumber,
      orderNumber,
      items: orderItems.map((item) => ({
        name: item.product_name,
        variantLabel: item._variantLabel,
        quantity: item.quantity,
        price: item.unit_price,
        subtotal: item.subtotal,
      })),
      subtotal,
      tax,
      total: totalWithTax,
      payments,
      cashReceived: actualCashReceived ?? undefined,
      change: changeGiven ?? undefined,
      timestamp: new Date().toISOString(),
      servedBy: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    };

    await supabase.from("receipts").insert({
      order_id: order.id,
      receipt_number: receiptNumber,
      receipt_data: receiptData,
    });

    // Notify admin (in-app only — POS sales can be frequent)
    await notifyAdminAndActiveStaff({
      title: `POS Sale — ₱${totalWithTax.toFixed(2)}`,
      message: `${items.length} item${items.length !== 1 ? "s" : ""} sold via POS for ₱${totalWithTax.toFixed(2)} (${orderNumber}).`,
      type: NOTIF_TYPES.POS_SALE,
      link: `/admin/orders?order=${orderNumber}`,
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
      items: (order.order_items || []).map((item: OrderItemRow) => ({
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
          method: (order.payment_method as SplitPayment["method"]) || "cash",
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
