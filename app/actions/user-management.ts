"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

/**
 * Get active sessions for a user (Admin only)
 */
export const getUserSessions = withErrorHandling(
  async (userId: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("user_sessions")
      .select(
        `
        *,
        users!inner (email, first_name, last_name)
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return error("Failed to fetch sessions", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

/**
 * Force logout a user by invalidating all their sessions (Admin only)
 */
export const forceLogoutUser = withErrorHandling(
  async (userId: string, reason: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const serviceClient = createServiceClient();

    // Invalidate all user sessions in database
    const { error: updateError } = await serviceClient
      .from("user_sessions")
      .update({ is_active: false })
      .eq("user_id", userId);

    if (updateError) {
      return error("Failed to invalidate sessions", ErrorCode.SERVER_ERROR);
    }

    // Sign out user from Supabase Auth (requires service role)
    await serviceClient.auth.admin.signOut(userId);

    // Log audit trail
    await logAudit({
      action: "force_logout",
      entityType: "user",
      entityId: userId,
      userId: admin.id,
      newValue: { reason },
    });

    revalidatePath("/admin/users");

    return success(null, "User logged out successfully");
  }
);

/**
 * Deactivate user account (Admin only)
 */
export const deactivateUser = withErrorHandling(
  async (userId: string, reason: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Update user status
    const { error: updateError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", userId);

    if (updateError) {
      return error("Failed to deactivate user", ErrorCode.SERVER_ERROR);
    }

    // Force logout
    await forceLogoutUser(userId, reason);

    // Log audit
    await logAudit({
      action: "deactivate_user",
      entityType: "user",
      entityId: userId,
      userId: admin.id,
      newValue: { reason },
    });

    revalidatePath("/admin/users");

    return success(null, "User deactivated successfully");
  }
);

/**
 * Reactivate user account (Admin only)
 */
export const reactivateUser = withErrorHandling(
  async (userId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    const { error: updateError } = await supabase
      .from("users")
      .update({ is_active: true })
      .eq("id", userId);

    if (updateError) {
      return error("Failed to reactivate user", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "reactivate_user",
      entityType: "user",
      entityId: userId,
      userId: admin.id,
    });

    revalidatePath("/admin/users");

    return success(null, "User reactivated successfully");
  }
);

/**
 * Delete user permanently (Admin only - DANGEROUS)
 */
export const deleteUser = withErrorHandling(
  async (userId: string, confirmation: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);

    if (confirmation !== "DELETE") {
      return error(
        "Please type DELETE to confirm user deletion",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const serviceClient = createServiceClient();

    // Delete from auth (this will cascade delete in users table via FK)
    const { error: deleteError } =
      await serviceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return error("Failed to delete user", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "delete_user",
      entityType: "user",
      entityId: userId,
      userId: admin.id,
    });

    revalidatePath("/admin/users");

    return success(null, "User deleted permanently");
  }
);

/**
 * Get all users (Admin/Staff)
 */
export const getAllUsers = withErrorHandling(
  async (filters?: {
    role?: string;
    isVerified?: boolean;
    isActive?: boolean;
  }): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase
      .from("users")
      .select(
        `
        *,
        roles!inner (name, description)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.role) {
      query = query.eq("roles.name", filters.role);
    }

    if (filters?.isVerified !== undefined) {
      query = query.eq("is_verified", filters.isVerified);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      return error("Failed to fetch users", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

/**
 * Update user role (Admin only)
 */
export const updateUserRole = withErrorHandling(
  async (userId: string, roleId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Verify role exists
    const { data: role } = await supabase
      .from("roles")
      .select("id, name")
      .eq("id", roleId)
      .single();

    if (!role) {
      return error("Role not found", ErrorCode.NOT_FOUND);
    }

    // Update user
    const { error: updateError } = await supabase
      .from("users")
      .update({ role_id: roleId })
      .eq("id", userId);

    if (updateError) {
      return error("Failed to update user role", ErrorCode.SERVER_ERROR);
    }

    // Log audit
    await logAudit({
      action: "update_user_role",
      entityType: "user",
      entityId: userId,
      userId: admin.id,
      newValue: { role_name: role.name, role_id: roleId },
    });

    revalidatePath("/admin/users");

    return success(null, `User role updated to ${role.name}`);
  }
);

/**
 * Get all roles (Admin only)
 */
export const getRoles = withErrorHandling(async (): Promise<ActionResponse> => {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error: fetchError } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  if (fetchError) {
    return error("Failed to fetch roles", ErrorCode.SERVER_ERROR);
  }

  return success(data);
});
