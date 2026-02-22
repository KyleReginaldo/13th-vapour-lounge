import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "./roles";

type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "price_change"
  | "stock_adjustment"
  | "status_change"
  | "login"
  | "logout"
  | "submit_age_verification"
  | "approve_age_verification"
  | "reject_age_verification"
  | "force_logout"
  | "deactivate_user"
  | "reactivate_user"
  | "delete_user"
  | "update_user_role"
  | "extract_payment_data"
  | "verify_payment"
  | "reject_payment_proof"
  | "create_product_variant"
  | "update_product_variant"
  | "delete_product_variant"
  | "bulk_update_variant_stock"
  | "enable_product_variants"
  | "disable_product_variants"
  | "request_return"
  | "approve_return"
  | "reject_return"
  | "process_refund"
  | "bulk_generate_qr_codes";

type AuditEntityType =
  | "product"
  | "order"
  | "inventory"
  | "supplier"
  | "user"
  | "purchase_order"
  | "stock_movement"
  | "payment"
  | "return"
  | "age_verification"
  | "payment_proof"
  | "product_variant"
  | "setting";

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  userId?: string; // Optional: For service role operations
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Create an audit log entry for tracking critical actions
 */
export async function logAudit({
  action,
  entityType,
  entityId,
  userId,
  oldValue,
  newValue,
  ipAddress,
}: AuditLogParams): Promise<void> {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    const supabase = await createClient();

    await supabase.from("audit_logs").insert({
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      ip_address: ipAddress || null,
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break app functionality
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogs(
  entityType: AuditEntityType,
  entityId: string
) {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      user:users(
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  return logs || [];
}

/**
 * Get all audit logs with pagination
 */
export async function getAllAuditLogs(page = 1, pageSize = 50) {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  const { data: logs, count } = await supabase
    .from("audit_logs")
    .select(
      `
      *,
      user:users(
        id,
        first_name,
        last_name,
        email
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  return {
    logs: logs || [],
    totalCount: count || 0,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
