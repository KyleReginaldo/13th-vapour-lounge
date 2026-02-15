import { z } from "zod";

export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  contact_person: z
    .string()
    .min(2, "Contact person name is too short")
    .max(100)
    .optional()
    .nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number")
    .optional()
    .nullable(),
  address: z.string().max(500, "Address is too long").optional().nullable(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
