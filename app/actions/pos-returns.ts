"use server";

import {
  error,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireClockedIn, requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type POSRefundItem = {
  productId: string;
  quantity: number;
  reason: string;
  condition: "unopened" | "opened" | "defective" | "damaged";
};

export type POSTransactionLookup = {
  id: string;
  receipt_number: string;
  transaction_number: string;
  order_id: string | null;
  total: number;
  subtotal: number;
  created_at: string;
  status: string;
  payment_method: string;
  pos_transaction_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    products: { id: string; name: string; sku: string } | null;
  }[];
};

/**
 * Look up a POS transaction by receipt number so staff can preview it
 * before initiating a refund.
 */
export const lookupPOSTransaction = withErrorHandling(
  async (
    receiptNumber: string
  ): Promise<ActionResponse<POSTransactionLookup>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const selectQuery = `
        id,
        receipt_number,
        transaction_number,
        total,
        subtotal,
        created_at,
        status,
        payment_method,
        pos_transaction_items(
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          products(id, name, sku)
        )
      `;

    // Try receipt_number first, fall back to transaction_number
    let { data, error: fetchError } = await supabase
      .from("pos_transactions")
      .select(selectQuery)
      .eq("receipt_number", receiptNumber)
      .maybeSingle();

    if (!data && !fetchError) {
      ({ data, error: fetchError } = await supabase
        .from("pos_transactions")
        .select(selectQuery)
        .eq("transaction_number", receiptNumber)
        .maybeSingle());
    }

    if (fetchError) {
      return error(`Lookup failed: ${fetchError.message}`);
    }
    if (!data) {
      return error(
        "Transaction not found. Check the receipt number and try again."
      );
    }

    if (data.status === "refunded") {
      return error("This transaction has already been fully refunded.");
    }

    return success(data as unknown as POSTransactionLookup);
  }
);

type PosTransactionRow = {
  id: string;
  total: number;
  receipt_number: string;
  transaction_number: string;
  status: string | null;
  pos_transaction_items: {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }[];
};

/**
 * Process a POS refund:
 * - Restores stock quantities for each refunded item
 * - Marks the pos_transaction as "refunded"
 * - Writes a full audit log entry (source of truth for POS refunds)
 *
 * Note: `returns` / `return_items` tables require a non-null order_id FK
 * and are designed for online-order returns only. POS refunds are tracked
 * via audit_logs + pos_transactions.status instead.
 */
export const processPOSRefund = withErrorHandling(
  async (
    transactionId: string,
    refundItems: POSRefundItem[],
    notes?: string
  ): Promise<ActionResponse> => {
    const user = await requireClockedIn();
    const supabase = await createClient();

    // ── 1. Fetch the POS transaction by primary key ───────────────────────
    const { data: posTxn, error: txnError } = (await supabase
      .from("pos_transactions")
      .select(
        `id, total, receipt_number, transaction_number, status,
        pos_transaction_items(id, product_id, quantity, unit_price, subtotal)`
      )
      .eq("id", transactionId)
      .maybeSingle()) as {
      data: PosTransactionRow | null;
      error: { message: string } | null;
    };

    if (txnError || !posTxn) {
      return error(
        txnError
          ? `Lookup error: ${txnError.message}`
          : "Transaction not found."
      );
    }
    if (posTxn.status === "refunded") {
      return error("This transaction has already been refunded.");
    }

    // ── 2. Validate refund quantities ────────────────────────────────────
    for (const item of refundItems) {
      const txnItem = posTxn.pos_transaction_items.find(
        (i: { product_id: string }) => i.product_id === item.productId
      );
      if (!txnItem) {
        return error(`Product not found in this transaction.`);
      }
      const txnRow = txnItem as { quantity: number };
      if (item.quantity > txnRow.quantity) {
        return error(
          `Refund quantity (${item.quantity}) exceeds sold quantity (${txnRow.quantity}).`
        );
      }
    }

    // ── 3. Calculate refund amount ───────────────────────────────────────
    const refundAmount = refundItems.reduce((sum, item) => {
      const txnItem = posTxn.pos_transaction_items.find(
        (i: { product_id: string }) => i.product_id === item.productId
      ) as { unit_price: number } | undefined;
      return sum + (txnItem ? txnItem.unit_price * item.quantity : 0);
    }, 0);

    const returnNumber = `RET-POS-${Date.now()}`;
    const receiptRef =
      posTxn.receipt_number ?? posTxn.transaction_number ?? transactionId;

    // ── 4. Restore stock ─────────────────────────────────────────────────
    for (const item of refundItems) {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({
            stock_quantity: (product.stock_quantity ?? 0) + item.quantity,
          })
          .eq("id", item.productId);
      }
    }

    // ── 5. Mark POS transaction as refunded ──────────────────────────────
    await supabase
      .from("pos_transactions")
      .update({
        status: "refunded",
        notes: `Refunded via ${returnNumber}${notes ? ` — ${notes}` : ""}`,
      })
      .eq("id", transactionId);

    // ── 6. Audit log (source of truth for POS refunds) ────────────────────
    await logAudit({
      action: "process_refund",
      entityType: "return",
      entityId: transactionId,
      newValue: {
        returnNumber,
        receiptNumber: receiptRef,
        refundAmount,
        refundItems,
        notes: notes ?? null,
        processedBy: user.id,
      },
    });

    revalidatePath("/admin/pos");

    return success(
      { returnNumber, refundAmount },
      `Refund processed successfully — ${returnNumber}`
    );
  }
);
