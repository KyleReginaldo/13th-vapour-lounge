/**
 * Supabase Service Role Client
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS) policies!
 *
 * Only use this for:
 * - Admin operations that must bypass RLS (e.g., user deletion)
 * - Bulk operations on behalf of system
 * - Operations that need elevated privileges
 *
 * ALWAYS:
 * - Verify user has admin role before using
 * - Log all operations to audit trail
 * - Use regular client (lib/supabase/server.ts) for normal operations
 */

import type { Database } from "@/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key
 * This bypasses all RLS policies - use with extreme caution!
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set in environment variables"
    );
  }

  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. " +
        "This should ONLY be set on the server side and NEVER exposed to the client."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Example usage pattern for admin operations:
 *
 * ```typescript
 * import { createServiceClient } from "@/lib/supabase/service";
 * import { requireRole } from "@/lib/auth/roles";
 * import { logAudit } from "@/lib/auth/audit";
 *
 * export async function forceDeleteUser(userId: string) {
 *   // 1. Verify admin role
 *   const admin = await requireRole(["admin"]);
 *
 *   // 2. Use service client
 *   const supabase = createServiceClient();
 *
 *   // 3. Perform operation
 *   const { error } = await supabase.auth.admin.deleteUser(userId);
 *   if (error) throw error;
 *
 *   // 4. Log to audit trail
 *   await logAudit({
 *     action: "delete_user",
 *     entityType: "user",
 *     entityId: userId,
 *     performedBy: admin.id,
 *   });
 *
 *   return { success: true };
 * }
 * ```
 */
