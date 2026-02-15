import { z } from "zod";

export const inventoryBatchSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  supplier_id: z.string().uuid("Invalid supplier ID").optional(),
  batch_number: z.string().min(1, "Batch number is required").optional(),
  quantity_received: z.number().int().positive("Quantity must be positive"),
  quantity_remaining: z
    .number()
    .int()
    .nonnegative("Remaining quantity cannot be negative")
    .optional(),
  expiry_date: z.string().datetime().optional().nullable(),
  received_at: z.string().datetime().optional(),
});

export const stockAdjustmentSchema = z.object({
  batch_id: z.string().uuid("Invalid batch ID"),
  adjustment: z.number().int("Adjustment must be an integer"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export const stockAlertSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  alert_type: z.enum([
    "low_stock",
    "critical_stock",
    "expiring_soon",
    "expired",
  ]),
  current_quantity: z.number().int().nonnegative(),
  threshold_quantity: z.number().int().nonnegative().optional(),
  expiry_date: z.string().datetime().optional(),
});

export type InventoryBatchInput = z.infer<typeof inventoryBatchSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type StockAlertInput = z.infer<typeof stockAlertSchema>;
