// Re-export all auth functions from supabase-auth
export {
  getCurrentUser,
  isAdmin,
  isStaff,
  requireAuth,
  requireRole,
  signIn,
  signOut,
  signUp,
  type UserWithRole,
} from "./supabase-auth";

export type UserRole = "admin" | "staff" | "customer";

// Alias for requireRole with staff access
export async function requireStaff() {
  const { requireRole } = await import("./supabase-auth");
  return requireRole(["admin", "staff"]);
}

// Alias for requireRole with admin access
export async function requireAdmin() {
  const { requireRole } = await import("./supabase-auth");
  return requireRole(["admin"]);
}

/**
 * Like requireRole(["admin", "staff"]) but also enforces that staff members
 * have an active (un-clocked-out) shift before they can perform any mutation.
 * Admins are exempt — they can always act regardless of shift status.
 * Throws with a user-facing message caught by withErrorHandling.
 */
export async function requireClockedIn() {
  const { requireRole } = await import("./supabase-auth");
  const { createClient } = await import("@/lib/supabase/server");

  const user = await requireRole(["admin", "staff"]);

  // Admins bypass the clock-in check
  if (user.roles?.name === "admin") return user;

  // Staff must have an active shift
  const supabase = await createClient();
  const { data: activeShift } = await supabase
    .from("staff_shifts")
    .select("id")
    .eq("staff_id", user.id)
    .is("clock_out", null)
    .maybeSingle();

  if (!activeShift) {
    throw new Error(
      "You must be clocked in to perform this action. Please clock in from the Shifts page first."
    );
  }

  return user;
}
