import { z } from "zod";

export const poItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unit_price: z.number().positive("Unit price must be positive"),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid("Invalid supplier ID"),
  expected_delivery_date: z.string().datetime().optional().nullable(),
  items: z.array(poItemSchema).min(1, "At least one item is required"),
  status: z.enum(["pending", "approved", "received", "cancelled"]).optional(),
});

export const updatePOStatusSchema = z.object({
  status: z.enum(["pending", "approved", "received", "cancelled"]),
});

export type POItemInput = z.infer<typeof poItemSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
