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
