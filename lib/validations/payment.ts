import { z } from "zod";

export const verifyPaymentSchema = z.object({
  proof_id: z.string().uuid("Invalid proof ID"),
  order_id: z.string().uuid("Invalid order ID"),
});

export const rejectPaymentSchema = z.object({
  proof_id: z.string().uuid("Invalid proof ID"),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
