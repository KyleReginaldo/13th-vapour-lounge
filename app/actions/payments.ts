"use server";

import {
  type ActionResponse,
  applyPagination,
  error,
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
  rejectPaymentSchema,
  verifyPaymentSchema,
} from "@/lib/validations/payment";
import { revalidatePath } from "next/cache";

/**
 * Get payment proofs with pagination
 */
export const getPaymentProofs = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("payment_proofs").select(
      `
        *,
        customer:users!customer_id(first_name, last_name, email),
        order:order_id(id, total_price),
        verifier:users!verified_by(first_name, last_name)
      `,
      { count: "exact" }
    );

    if (status) {
      query = query.eq("status", status);
    }

    query = applyPagination(query, page, pageSize);
    query = query.order("uploaded_at", { ascending: false });

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({
      data: data || [],
      pagination: getPaginationMeta(count || 0, page, pageSize),
    });
  }
);

/**
 * Verify payment proof
 */
export const verifyPayment = withErrorHandling(
  async (proofId: string, orderId: string): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const validated = validateInput(verifyPaymentSchema, {
      proof_id: proofId,
      order_id: orderId,
    });
    const supabase = await createClient();

    // Update payment proof
    const { data: proof, error: proofError } = await supabase
      .from("payment_proofs")
      .update({
        status: "verified",
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", validated.proof_id)
      .select()
      .single();

    if (proofError) return error(proofError.message);

    // Update order payment status
    const { error: orderError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", validated.order_id);

    if (orderError) return error(orderError.message);

    await logAudit({
      action: "update",
      entityType: "payment",
      entityId: validated.proof_id,
      newValue: proof,
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/orders");
    return success(proof, "Payment verified successfully");
  }
);

/**
 * Reject payment proof
 */
export const rejectPayment = withErrorHandling(
  async (proofId: string, reason: string): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const validated = validateInput(rejectPaymentSchema, {
      proof_id: proofId,
      reason,
    });
    const supabase = await createClient();

    const { data: proof, error: updateError } = await supabase
      .from("payment_proofs")
      .update({
        status: "rejected",
        rejection_reason: validated.reason,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", validated.proof_id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "payment",
      entityId: validated.proof_id,
      newValue: proof,
    });

    revalidatePath("/admin/payments");
    return success(proof, "Payment proof rejected");
  }
);
