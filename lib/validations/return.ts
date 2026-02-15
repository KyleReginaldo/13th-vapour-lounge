import { z } from "zod";

export const approveReturnSchema = z.object({
  return_id: z.string().uuid("Invalid return ID"),
  refund_amount: z.number().positive("Refund amount must be positive"),
});

export const rejectReturnSchema = z.object({
  return_id: z.string().uuid("Invalid return ID"),
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

export const restockReturnSchema = z.object({
  return_id: z.string().uuid("Invalid return ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export type ApproveReturnInput = z.infer<typeof approveReturnSchema>;
export type RejectReturnInput = z.infer<typeof rejectReturnSchema>;
