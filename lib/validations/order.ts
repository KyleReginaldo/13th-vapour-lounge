import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export const updatePaymentStatusSchema = z.object({
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]),
});

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .min(5, "Cancellation reason must be at least 5 characters"),
});

export const trackingNumberSchema = z.object({
  tracking_number: z.string().min(5, "Tracking number is required"),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
