import { z } from "zod";

export const staffMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(2, "First name is too short"),
  last_name: z.string().min(2, "Last name is too short"),
  middle_name: z.string().optional(),
  contact_number: z.string().regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number"),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  role_id: z.string().uuid("Invalid role ID"),
});

export const updateStaffSchema = staffMemberSchema
  .omit({ password: true, email: true })
  .partial();

export const clockInSchema = z.object({
  register_id: z.string().uuid("Invalid register ID"),
  opening_cash: z.number().nonnegative("Opening cash cannot be negative"),
});

export const clockOutSchema = z.object({
  shift_id: z.string().uuid("Invalid shift ID"),
  closing_cash: z.number().nonnegative("Closing cash cannot be negative"),
  notes: z.string().optional(),
});

export type StaffMemberInput = z.infer<typeof staffMemberSchema>;
export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
