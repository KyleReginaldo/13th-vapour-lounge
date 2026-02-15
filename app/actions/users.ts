"use server";

import { error, success, type ActionResponse } from "@/lib/actions/utils";
import { createClient } from "@/lib/supabase/server";

/**
 * Promote a user to admin role by email
 */
export async function promoteToAdmin(email: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Get admin role
    const { data: adminRole, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single();

    if (roleError || !adminRole) {
      return error("Admin role not found. Please run seed first.");
    }

    // Update user role
    const { data: user, error: updateError } = await supabase
      .from("users")
      .update({ role_id: adminRole.id })
      .eq("email", email)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message);
    }

    if (!user) {
      return error("User not found with that email");
    }

    return success(user, `Successfully promoted ${email} to admin`);
  } catch (err) {
    return error(err instanceof Error ? err.message : "Failed to promote user");
  }
}

/**
 * Change a user's role by email
 */
export async function changeUserRole(
  email: string,
  roleName: "admin" | "staff" | "customer"
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Get role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", roleName)
      .single();

    if (roleError || !role) {
      return error(`${roleName} role not found. Please run seed first.`);
    }

    // Update user role
    const { data: user, error: updateError } = await supabase
      .from("users")
      .update({ role_id: role.id })
      .eq("email", email)
      .select()
      .single();

    if (updateError) {
      return error(updateError.message);
    }

    if (!user) {
      return error("User not found with that email");
    }

    return success(user, `Successfully changed ${email} role to ${roleName}`);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Failed to change user role"
    );
  }
}
