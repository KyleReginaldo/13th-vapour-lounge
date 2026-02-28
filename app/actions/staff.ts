"use server";

import {
  error,
  ErrorCode,
  success,
  validateInput,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import {
  CASH_DIFF_THRESHOLD,
  NOTIF_TYPES,
} from "@/lib/constants/notifications";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  clockInSchema,
  clockOutSchema,
  staffMemberSchema,
  updateStaffSchema,
  type ClockInInput,
  type ClockOutInput,
  type StaffMemberInput,
} from "@/lib/validations/staff";
import { revalidatePath } from "next/cache";
import { notifyAdminAndActiveStaff } from "./notifications";

/**
 * Create staff member
 */
export const createStaffMember = withErrorHandling(
  async (input: StaffMemberInput): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const validated = validateInput(staffMemberSchema, input);
    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          first_name: validated.first_name,
          last_name: validated.last_name,
        },
      },
    });

    if (authError) return error(authError.message);
    if (!authData.user) return error("Failed to create auth user");

    // Create user in public.users
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: validated.email,
      first_name: validated.first_name,
      last_name: validated.last_name,
      middle_name: validated.middle_name || null,
      contact_number: validated.contact_number,
      date_of_birth: validated.date_of_birth,
      token_identifier: authData.user.id,
      role_id: "13fead46-a738-4feb-bc84-0edb7dd2a523",
      is_verified: true,
    });

    if (userError) return error(userError.message);

    await logAudit({
      action: "create",
      entityType: "user",
      entityId: authData.user.id,
      newValue: { email: validated.email, role_id: validated.role_id },
    });

    await notifyAdminAndActiveStaff({
      title: `New Staff: ${validated.first_name} ${validated.last_name}`,
      message: `${validated.first_name} ${validated.last_name} (${validated.email}) has been added as a staff member.`,
      type: NOTIF_TYPES.STAFF_CREATED,
      link: "/admin/staff",
    });

    revalidatePath("/admin/staff");
    return success(authData.user, "Staff member created successfully");
  }
);

/**
 * Update staff member
 */
export const updateStaffMember = withErrorHandling(
  async (
    userId: string,
    input: Partial<StaffMemberInput>
  ): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const validated = validateInput(updateStaffSchema, input);
    const supabase = await createClient();

    const { data, error: updateError } = await supabase
      .from("users")
      .update(validated)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/staff");
    return success(data, "Staff member updated successfully");
  }
);

/**
 * Change staff role
 */
export const changeStaffRole = withErrorHandling(
  async (userId: string, roleId: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = createServiceClient();

    const { data, error: updateError } = await supabase
      .from("users")
      .update({ role_id: roleId })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "user",
      entityId: userId,
      newValue: { role_id: roleId },
    });

    await notifyAdminAndActiveStaff({
      title:
        `Role Changed: ${(data as any).first_name ?? ""} ${(data as any).last_name ?? ""}`.trim(),
      message:
        `${(data as any).first_name ?? "Staff"} ${(data as any).last_name ?? ""}'s role has been updated.`.trim(),
      type: NOTIF_TYPES.ROLE_CHANGED,
      link: "/admin/staff",
    });

    revalidatePath("/admin/staff");
    return success(data, "Staff role updated");
  }
);

/**
 * Clock in staff member
 */
export const clockIn = withErrorHandling(
  async (input: ClockInInput): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const validated = validateInput(clockInSchema, input);
    const supabase = await createClient();

    // Check if already clocked in
    const { data: activeShift } = await supabase
      .from("staff_shifts")
      .select()
      .eq("staff_id", user.id)
      .is("clock_out", null)
      .single();

    if (activeShift) {
      return error("Already clocked in", ErrorCode.CONFLICT);
    }

    const { data: shift, error: insertError } = await supabase
      .from("staff_shifts")
      .insert({
        staff_id: user.id,
        register_id: validated.register_id,
        opening_cash: validated.opening_cash,
        clock_in: new Date().toISOString(),
        status: "open",
      })
      .select()
      .single();

    if (insertError) return error(insertError.message);

    // Notify admins (fire-and-forget)
    const staffName =
      `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
    const clockInTime = new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    await notifyAdminAndActiveStaff({
      title: `${staffName} Clocked In`,
      message: `${staffName} started their shift at ${clockInTime}.`,
      type: NOTIF_TYPES.CLOCK_IN,
      link: "/admin/shifts",
    });

    revalidatePath("/admin/staff");
    revalidatePath("/admin/shifts");
    return success(shift, "Clocked in successfully");
  }
);

/**
 * Clock out staff member
 */
export const clockOut = withErrorHandling(
  async (input: ClockOutInput): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const validated = validateInput(clockOutSchema, input);
    const supabase = await createClient();

    // Get shift details
    const { data: shift } = await supabase
      .from("staff_shifts")
      .select()
      .eq("id", validated.shift_id)
      .single();

    if (!shift) {
      return error("Shift not found", ErrorCode.NOT_FOUND);
    }

    if (shift.clock_out) {
      return error("Already clocked out", ErrorCode.CONFLICT);
    }

    // Calculate expected cash
    const { data: orders } = await supabase
      .from("orders")
      .select("total")
      .eq("payment_method", "cash")
      .gte("created_at", shift.clock_in);

    const expectedCash =
      (shift.opening_cash || 0) +
      (orders?.reduce((sum, o) => sum + o.total, 0) || 0);

    const cashDifference = validated.closing_cash - expectedCash;

    const { data: updatedShift, error: updateError } = await supabase
      .from("staff_shifts")
      .update({
        clock_out: new Date().toISOString(),
        closing_cash: validated.closing_cash,
        expected_cash: expectedCash,
        cash_difference: cashDifference,
        notes: validated.notes,
        status: "closed",
      })
      .eq("id", validated.shift_id)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    // Notify about clock-out (fire-and-forget)
    const staffName =
      `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
    const shiftDate = shift.clock_in
      ? new Date(shift.clock_in).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "unknown";
    const clockOutTime = new Date().toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    await notifyAdminAndActiveStaff({
      title: `${staffName} Clocked Out`,
      message: `${staffName} ended their shift (started: ${shiftDate}, clocked out: ${clockOutTime}).`,
      type: NOTIF_TYPES.CLOCK_OUT,
      link: "/admin/shifts",
    });

    // Extra notification for significant cash discrepancy
    if (Math.abs(cashDifference) > CASH_DIFF_THRESHOLD) {
      const diffLabel =
        cashDifference > 0
          ? `+₱${Math.abs(cashDifference).toFixed(2)} overage`
          : `-₱${Math.abs(cashDifference).toFixed(2)} shortage`;
      await notifyAdminAndActiveStaff({
        title: `⚠️ Cash Discrepancy — ${staffName}`,
        message: `${staffName}'s shift closed with a ${diffLabel}. Please review the shift report.`,
        type: NOTIF_TYPES.CASH_DISCREPANCY,
        link: `/admin/shifts`,
      });
    }

    revalidatePath("/admin/staff");
    revalidatePath("/admin/shifts");
    return success(updatedShift, "Clocked out successfully");
  }
);

/**
 * Get staff shifts history
 */
export const getStaffShifts = withErrorHandling(
  async (
    staffId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase
      .from("staff_shifts")
      .select(
        `
        *,
        staff:staff_id(first_name, last_name),
        register:register_id(name)
      `
      )
      .order("clock_in", { ascending: false });

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }
    if (startDate) {
      query = query.gte("clock_in", startDate);
    }
    if (endDate) {
      query = query.lte("clock_in", endDate);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) return error(fetchError.message);

    return success(data);
  }
);

/**
 * Get active shifts
 */
export const getActiveShifts = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("staff_shifts")
      .select(
        `
        *,
        staff:staff_id(first_name, last_name),
        register:register_id(name)
      `
      )
      .is("clock_out", null)
      .order("clock_in", { ascending: false });

    if (fetchError) return error(fetchError.message);

    return success(data);
  }
);

/**
 * Get all active cash registers (for clock-in register selection)
 */
export const getCashRegisters = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("cash_registers")
      .select("id, name, location")
      .eq("is_active", true)
      .order("name");

    if (fetchError) return error(fetchError.message);
    return success(data);
  }
);

/**
 * Get the currently logged-in user's active (not clocked out) shift
 */
export const getMyActiveShift = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const user = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("staff_shifts")
      .select(`*, register:register_id(name, location)`)
      .eq("staff_id", user.id)
      .is("clock_out", null)
      .maybeSingle();

    if (fetchError) return error(fetchError.message);
    return success(data);
  }
);
