import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  brand_id: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  compare_at_price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  quantity: z.number().int().nonnegative("Quantity must be non-negative"),
  images: z
    .array(
      z
        .string()
        .refine(
          (val) =>
            val.startsWith("http://") ||
            val.startsWith("https://") ||
            val.startsWith("data:image/"),
          "Invalid image URL or data URI"
        )
    )
    .min(1, "At least one image is required"),
  low_stock_threshold: z.number().int().positive().optional(),
  critical_stock_threshold: z.number().int().positive().optional(),
  barcode: z.string().optional(),
  qr_code: z.string().optional(),
  product_type: z.string().optional(),
  track_inventory: z.boolean().optional(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
