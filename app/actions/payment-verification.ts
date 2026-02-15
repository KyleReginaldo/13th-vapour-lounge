"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const extractPaymentSchema = z.object({
  proofId: z.string().uuid(),
  referenceNumber: z.string().min(5).max(100),
  amount: z.number().positive(),
  paymentMethod: z.string().min(2).max(50),
});

/**
 * Get pending payment proofs (Admin/Staff)
 */
export const getPendingPaymentProofs = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("payment_proofs")
      .select(
        `
        *,
        orders!inner (
          order_number,
          total,
          customer_id
        ),
        users!customer_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("status", "pending")
      .order("uploaded_at", { ascending: false });

    if (fetchError) {
      return error("Failed to fetch payment proofs", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

/**
 * Extract payment proof data (Admin only)
 */
export const extractPaymentData = withErrorHandling(
  async (
    input: z.infer<typeof extractPaymentSchema>
  ): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    const validated = extractPaymentSchema.parse(input);

    // Update payment proof
    const { error: updateError } = await supabase
      .from("payment_proofs")
      .update({
        reference_number: validated.referenceNumber,
        amount: validated.amount,
        payment_method: validated.paymentMethod,
        extracted_at: new Date().toISOString(),
        extracted_by: admin.id,
        status: "extracted",
      })
      .eq("id", validated.proofId);

    if (updateError) {
      return error("Failed to extract payment data", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "extract_payment_data",
      entityType: "payment_proof",
      entityId: validated.proofId,
      userId: admin.id,
      newValue: validated,
    });

    revalidatePath("/admin/payments");

    return success(null, "Payment data extracted successfully");
  }
);

/**
 * Verify payment (Staff/Admin - in-store scanning)
 */
export const verifyPayment = withErrorHandling(
  async (referenceNumber: string): Promise<ActionResponse> => {
    const staff = await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    // Search for payment proof by reference number
    const { data: paymentProof, error: fetchError } = await supabase
      .from("payment_proofs")
      .select(
        `
        *,
        orders!inner (
          id,
          order_number,
          total,
          customer_id
        )
      `
      )
      .eq("reference_number", referenceNumber)
      .eq("status", "extracted")
      .maybeSingle();

    if (fetchError) {
      return error("Failed to search payment proof", ErrorCode.SERVER_ERROR);
    }

    if (!paymentProof) {
      // Log failed verification attempt
      await supabase.from("payment_verification_log").insert({
        reference_number: referenceNumber,
        action: "verify_attempt",
        staff_id: staff.id,
        result: "not_found",
      });

      return error(
        "Payment proof not found or not ready for verification",
        ErrorCode.NOT_FOUND
      );
    }

    // Check for duplicate (already verified)
    if (paymentProof.verified_at) {
      await supabase.from("payment_verification_log").insert({
        payment_proof_id: paymentProof.id,
        reference_number: referenceNumber,
        action: "verify_attempt",
        staff_id: staff.id,
        result: "duplicate",
      });

      return error(
        "This payment has already been verified",
        ErrorCode.CONFLICT
      );
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from("payment_proofs")
      .update({
        verified_at: new Date().toISOString(),
        verified_by: staff.id,
        status: "verified",
      })
      .eq("id", paymentProof.id);

    if (updateError) {
      return error("Failed to verify payment", ErrorCode.SERVER_ERROR);
    }

    // Update order status
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        status: "processing",
      })
      .eq("id", paymentProof.orders.id);

    // Add to order status history
    await supabase.from("order_status_history").insert({
      order_id: paymentProof.orders.id,
      from_status: "pending",
      to_status: "processing",
      notes: "Payment verified by staff",
      changed_by: staff.id,
    });

    // Log successful verification
    await supabase.from("payment_verification_log").insert({
      payment_proof_id: paymentProof.id,
      reference_number: referenceNumber,
      action: "verified",
      staff_id: staff.id,
      result: "success",
    });

    // Log audit
    await logAudit({
      action: "verify_payment",
      entityType: "payment_proof",
      entityId: paymentProof.id,
      userId: staff.id,
    });

    revalidatePath("/admin/payments");
    revalidatePath(`/orders/${paymentProof.orders.id}`);

    return success(
      {
        orderNumber: paymentProof.orders.order_number,
        amount: paymentProof.amount,
        customerId: paymentProof.orders.customer_id,
      },
      "Payment verified successfully"
    );
  }
);

/**
 * Reject payment proof
 */
export const rejectPaymentProof = withErrorHandling(
  async (proofId: string, reason: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    if (!reason || reason.trim().length < 10) {
      return error(
        "Please provide a detailed rejection reason",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Get payment proof
    const { data: proof } = await supabase
      .from("payment_proofs")
      .select("order_id")
      .eq("id", proofId)
      .single();

    if (!proof) {
      return error("Payment proof not found", ErrorCode.NOT_FOUND);
    }

    // Update payment proof
    const { error: updateError } = await supabase
      .from("payment_proofs")
      .update({
        status: "rejected",
        rejection_reason: reason,
        verified_by: admin.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", proofId);

    if (updateError) {
      return error("Failed to reject payment proof", ErrorCode.SERVER_ERROR);
    }

    // Update order payment status
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", proof.order_id);

    // Log audit
    await logAudit({
      action: "reject_payment_proof",
      entityType: "payment_proof",
      entityId: proofId,
      userId: admin.id,
      newValue: { reason },
    });

    revalidatePath("/admin/payments");

    return success(null, "Payment proof rejected");
  }
);

/**
 * Check for duplicate payment reference
 */
export const checkDuplicatePayment = withErrorHandling(
  async (referenceNumber: string): Promise<ActionResponse> => {
    await requireRole(["staff", "admin"]);
    const supabase = await createClient();

    const { data, count } = await supabase
      .from("payment_proofs")
      .select("id, status, orders!inner (order_number)", { count: "exact" })
      .eq("reference_number", referenceNumber);

    const isDuplicate = (count || 0) > 0;

    return success({
      isDuplicate,
      usageCount: count || 0,
      existingProofs: data || [],
    });
  }
);

/**
 * Get payment verification logs (Admin)
 */
export const getPaymentVerificationLogs = withErrorHandling(
  async (limit: number = 100): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("payment_verification_log")
      .select(
        `
        *,
        users:staff_id (first_name, last_name, email)
      `
      )
      .order("scanned_at", { ascending: false })
      .limit(limit);

    if (fetchError) {
      return error("Failed to fetch logs", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);
