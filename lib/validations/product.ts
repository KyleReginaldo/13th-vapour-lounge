import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  category: z.string().min(1, "Category is required"),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().nonnegative("Quantity must be non-negative"),
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),
  low_stock_threshold: z.number().int().positive().optional(),
  critical_stock_threshold: z.number().int().positive().optional(),
  qr_code: z.string().optional(),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
