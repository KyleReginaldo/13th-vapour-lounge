"use server";

import {
  error,
  ErrorCode,
  formatCurrency,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clockInSchema = z.object({
  registerId: z.string().uuid(),
  openingCash: z.number().positive(),
});

const transactionSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      variantId: z.string().uuid().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).default(0),
    })
  ),
  paymentMethod: z.enum(["cash", "card", "gcash", "ewallet"]),
  cashReceived: z.number().optional(),
  customerEmail: z.string().email().optional(),
  customerId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ============ STAFF SHIFTS ============

/**
 * Clock in - Start shift
 */
export const clockIn = withErrorHandling(
  async (input: z.infer<typeof clockInSchema>): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const validated = clockInSchema.parse(input);

    // Check if staff has an active shift
    const { data: activeShift } = await supabase
      .from("staff_shifts")
      .select("id")
      .eq("staff_id", staff.id)
      .eq("status", "open")
      .maybeSingle();

    if (activeShift) {
      return error(
        "You already have an active shift",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Create shift
    const { data: shift, error: insertError } = await supabase
      .from("staff_shifts")
      .insert({
        staff_id: staff.id,
        register_id: validated.registerId,
        opening_cash: validated.openingCash,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to clock in", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/pos");

    return success(shift, "Clocked in successfully");
  }
);

/**
 * Clock out - End shift
 */
export const clockOut = withErrorHandling(
  async (shiftId: string, closingCash: number): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    // Get shift
    const { data: shift } = await supabase
      .from("staff_shifts")
      .select("*")
      .eq("id", shiftId)
      .eq("staff_id", staff.id)
      .eq("status", "open")
      .single();

    if (!shift) {
      return error("Shift not found or already closed", ErrorCode.NOT_FOUND);
    }

    // Calculate expected cash
    const expectedCash =
      shift.opening_cash +
      (shift.total_sales ?? 0) -
      (shift.total_refunds ?? 0);
    const cashDifference = closingCash - expectedCash;

    // Update shift
    const { error: updateError } = await supabase
      .from("staff_shifts")
      .update({
        clock_out: new Date().toISOString(),
        closing_cash: closingCash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        status: "closed",
      })
      .eq("id", shiftId);

    if (updateError) {
      return error("Failed to clock out", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/pos");

    return success(
      { cashDifference },
      `Shift closed. Cash difference: ${formatCurrency(cashDifference)}`
    );
  }
);

/**
 * Get active shift for current staff
 */
export const getActiveShift = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const { data: shift } = await supabase
      .from("staff_shifts")
      .select(
        `
        *,
        cash_registers!inner (name, location)
      `
      )
      .eq("staff_id", staff.id)
      .eq("status", "open")
      .maybeSingle();

    return success(shift);
  }
);

// ============ POS TRANSACTIONS ============

/**
 * Create POS transaction
 */
export const createPOSTransaction = withErrorHandling(
  async (input: z.infer<typeof transactionSchema>): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const validated = transactionSchema.parse(input);

    // Get active shift
    const { data: shift } = await supabase
      .from("staff_shifts")
      .select("id")
      .eq("staff_id", staff.id)
      .eq("status", "open")
      .single();

    if (!shift) {
      return error(
        "No active shift. Please clock in first.",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Calculate totals
    const subtotal = validated.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - item.discount,
      0
    );
    const taxRate = 0.12;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Validate cash payment
    if (validated.paymentMethod === "cash") {
      if (!validated.cashReceived || validated.cashReceived < total) {
        return error("Insufficient cash received", ErrorCode.VALIDATION_ERROR);
      }
    }

    const changeGiven =
      validated.paymentMethod === "cash" && validated.cashReceived
        ? validated.cashReceived - total
        : 0;

    // Generate transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create transaction
    const { data: transaction, error: txnError } = await supabase
      .from("pos_transactions")
      .insert({
        transaction_number: transactionNumber,
        shift_id: shift.id,
        staff_id: staff.id,
        customer_id: validated.customerId,
        subtotal,
        tax,
        total,
        payment_method: validated.paymentMethod,
        cash_received: validated.cashReceived,
        change_given: changeGiven,
        customer_email: validated.customerEmail,
        notes: validated.notes,
        status: "completed",
      })
      .select()
      .single();

    if (txnError) {
      return error("Failed to create transaction", ErrorCode.SERVER_ERROR);
    }

    // Create transaction items
    const transactionItems = validated.items.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount,
      subtotal: item.unitPrice * item.quantity - item.discount,
    }));

    const { error: itemsError } = await supabase
      .from("pos_transaction_items")
      .insert(transactionItems);

    if (itemsError) {
      // Rollback transaction
      await supabase.from("pos_transactions").delete().eq("id", transaction.id);
      return error(
        "Failed to create transaction items",
        ErrorCode.SERVER_ERROR
      );
    }

    // Decrease stock for each item
    for (const item of validated.items) {
      if (item.variantId) {
        await supabase.rpc("decrease_variant_stock", {
          p_variant_id: item.variantId,
          p_quantity: item.quantity,
          p_user_id: staff.id,
        });
      } else {
        // await supabase.rpc("decrease_product_stock", {
        //   p_product_id: item.productId,
        //   p_quantity: item.quantity,
        //   p_user_id: staff.id,
        // });
      }
    }

    // Update shift totals (Note: Schema may not support these fields)
    await supabase
      .from("staff_shifts")
      .update({
        total_sales: (shift as any).total_sales + total,
        transaction_count: (shift as any).transaction_count + 1,
      } as any)
      .eq("id", shift.id);

    revalidatePath("/admin/pos");

    return success(
      { transactionId: transaction.id, transactionNumber, changeGiven },
      "Transaction completed successfully"
    );
  }
);

/**
 * Park order (save for later)
 */
export const parkOrder = withErrorHandling(
  async (
    customerName: string,
    customerPhone: string,
    cartData: any[]
  ): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Expire in 24 hours

    const { data, error: insertError } = await supabase
      .from("parked_orders")
      .insert({
        staff_id: staff.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        cart_data: cartData,
        expires_at: expires.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to park order", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/pos");

    return success(data, "Order parked successfully");
  }
);

/**
 * Get parked orders
 */
export const getParkedOrders = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const { data } = await supabase
      .from("parked_orders")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    return success(data || []);
  }
);

/**
 * Retrieve parked order
 */
export const retrieveParkedOrder = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("parked_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !data) {
      return error("Parked order not found", ErrorCode.NOT_FOUND);
    }

    return success(data);
  }
);

/**
 * Delete parked order
 */
export const deleteParkedOrder = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("parked_orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) {
      return error("Failed to delete parked order", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/admin/pos");

    return success(null, "Parked order deleted");
  }
);
