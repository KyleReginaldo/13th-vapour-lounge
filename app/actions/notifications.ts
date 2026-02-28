"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { getCurrentUser, requireRole } from "@/lib/auth/roles";
import {
  ageVerificationResultTemplate,
  lowStockAlertTemplate,
  orderConfirmationTemplate,
  orderReadyTemplate,
  paymentVerifiedTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates";
import { sendEmail as sendEmailTransport } from "@/lib/email/transport";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    throw new Error(
      `[notify] Missing env vars: SUPABASE_URL=${!!url} SERVICE_KEY=${!!key}`
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Internal helper: notify admin users + any currently clocked-in staff
// ---------------------------------------------------------------------------
export async function notifyAdminAndActiveStaff(params: {
  title: string;
  message: string;
  type: string;
  link?: string;
  /** If provided, read the settings table and send email only when the toggle is on */
  emailSettingKey?:
    | "email_order_notifications"
    | "email_low_stock_notifications"
    | "email_payment_notifications";
  /** HTML email to send (only used when emailSettingKey is provided) */
  emailHtml?: string;
  emailSubject?: string;
}): Promise<void> {
  console.log("[notify:start] notifyAdminAndActiveStaff type=", params.type);
  try {
    const supabase = getServiceClient();

    // 1. Resolve admin role ID, then fetch admin users directly (avoids join-filter issues)
    const { data: adminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .maybeSingle();

    const { data: adminUsers, error: adminErr } = adminRole
      ? await supabase
          .from("users")
          .select("id, email")
          .eq("role_id", adminRole.id)
      : { data: [], error: null };

    if (adminErr) console.error("[notify] adminUsers query error:", adminErr);

    // 2. Collect clocked-in staff IDs (no clock_out yet)
    const { data: activeShifts } = await supabase
      .from("staff_shifts")
      .select("staff_id")
      .is("clock_out", null);

    // 3. Fetch emails for clocked-in staff
    const activeStaffIds = (activeShifts ?? [])
      .map((s) => s.staff_id)
      .filter((id): id is string => !!id);

    const { data: activeStaff } =
      activeStaffIds.length > 0
        ? await supabase
            .from("users")
            .select("id, email")
            .in("id", activeStaffIds)
        : { data: [] };

    // Build deduplicated recipient map id → email
    const recipientMap = new Map<string, string>();
    for (const u of adminUsers ?? []) {
      if (u.id) recipientMap.set(u.id, u.email ?? "");
    }
    for (const u of activeStaff ?? []) {
      if (u.id) recipientMap.set(u.id, u.email ?? "");
    }

    console.log(
      `[notify] recipients: ${recipientMap.size} (admins: ${adminUsers?.length ?? 0}, active staff: ${activeStaffIds.length})`
    );

    if (recipientMap.size === 0) return;

    // 4. Bulk-insert in-app notifications
    const inserts = Array.from(recipientMap.keys()).map((userId) => ({
      user_id: userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link ?? null,
    }));
    const { error: insertErr } = await supabase
      .from("notifications")
      .insert(inserts);

    if (insertErr) console.error("[notify] insert error:", insertErr);

    // 5. Optionally send email (respects settings toggle)
    if (params.emailSettingKey && params.emailHtml && params.emailSubject) {
      // shop_settings is a key-value table: { key: string, value: Json }
      const { data: settingRow } = await supabase
        .from("shop_settings")
        .select("value")
        .eq("key", params.emailSettingKey)
        .maybeSingle();

      // if no row found, treat as enabled (default on)
      const toggleOn = settingRow == null || settingRow.value !== false;

      if (toggleOn) {
        for (const email of recipientMap.values()) {
          if (email) {
            await sendEmailTransport({
              to: email,
              subject: params.emailSubject,
              html: params.emailHtml,
            });
          }
        }
      }
    }
  } catch (err) {
    // fire-and-forget — never block the primary operation
    console.error(
      "[notifyAdminAndActiveStaff] FAILED:",
      (err as Error)?.message,
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Internal helper: notify only admin users (use when a staff member acts)
// ---------------------------------------------------------------------------
export async function notifyAdminsOnly(params: {
  title: string;
  message: string;
  type: string;
  link?: string;
}): Promise<void> {
  console.log("[notify:start] notifyAdminsOnly type=", params.type);
  try {
    const supabase = getServiceClient();
    const { data: adminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .maybeSingle();
    const { data: adminUsers } = adminRole
      ? await supabase.from("users").select("id").eq("role_id", adminRole.id)
      : { data: [] };
    if (!adminUsers || adminUsers.length === 0) return;
    const inserts = adminUsers.map((u) => ({
      user_id: u.id,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link ?? null,
    }));
    const { error: insertErr } = await supabase
      .from("notifications")
      .insert(inserts);
    if (insertErr) console.error("[notifyAdminsOnly] insert error:", insertErr);
  } catch (err) {
    console.error("[notifyAdminsOnly] FAILED:", (err as Error)?.message, err);
  }
}

// ---------------------------------------------------------------------------
// Internal helper: notify only currently clocked-in staff
// (use when an admin acts on something staff should know about)
// ---------------------------------------------------------------------------
export async function notifyActiveStaffOnly(params: {
  title: string;
  message: string;
  type: string;
  link?: string;
}): Promise<void> {
  console.log("[notify:start] notifyActiveStaffOnly type=", params.type);
  try {
    const supabase = getServiceClient();
    const { data: activeShifts } = await supabase
      .from("staff_shifts")
      .select("staff_id")
      .is("clock_out", null);
    const activeStaffIds = (activeShifts ?? [])
      .map((s) => s.staff_id)
      .filter((id): id is string => !!id);
    if (activeStaffIds.length === 0) return;
    const inserts = activeStaffIds.map((userId) => ({
      user_id: userId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link ?? null,
    }));
    const { error: insertErr } = await supabase
      .from("notifications")
      .insert(inserts);
    if (insertErr)
      console.error("[notifyActiveStaffOnly] insert error:", insertErr);
  } catch (err) {
    console.error(
      "[notifyActiveStaffOnly] FAILED:",
      (err as Error)?.message,
      err
    );
  }
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send transactional email using SMTP
 */
async function sendEmail(data: EmailData): Promise<boolean> {
  try {
    const result = await sendEmailTransport({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      return false;
    }

    console.log("✓ Email sent successfully to:", data.to);
    return true;
  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        users!customer_id (
          email,
          first_name,
          last_name
        ),
        order_items (
          quantity,
          unit_price,
          products (
            name
          )
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const customerName =
      `${order.users.first_name || ""} ${order.users.last_name || ""}`.trim() ||
      "Customer";

    const items = order.order_items.map((item) => ({
      name: item.products.name,
      quantity: item.quantity,
      price: item.unit_price * item.quantity,
    }));

    const html = orderConfirmationTemplate({
      customerName,
      orderNumber: order.order_number,
      orderTotal: order.total,
      items,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`,
    });

    await sendEmail({
      to: order.users.email,
      subject: `Order Confirmation - ${order.order_number}`,
      html,
    });

    return success(null, "Email sent");
  }
);

/**
 * Send payment verified email
 */
export const sendPaymentVerifiedEmail = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        users!customer_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const customerName =
      `${order.users.first_name || ""} ${order.users.last_name || ""}`.trim() ||
      "Customer";

    const html = paymentVerifiedTemplate({
      customerName,
      orderNumber: order.order_number,
      amount: order.total,
    });

    await sendEmail({
      to: order.users.email,
      subject: `Payment Verified - ${order.order_number}`,
      html,
    });

    return success(null, "Email sent");
  }
);

/**
 * Send order ready for pickup email
 */
export const sendOrderReadyEmail = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        *,
        users!customer_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const customerName =
      `${order.users.first_name || ""} ${order.users.last_name || ""}`.trim() ||
      "Customer";

    const html = orderReadyTemplate({
      customerName,
      orderNumber: order.order_number,
      pickupInstructions:
        "Please bring a valid ID for age verification. Our store is located at 13th Vapour Lounge, 123 Main Street, Trece Martires.",
    });

    await sendEmail({
      to: order.users.email,
      subject: `Order Ready for Pickup - ${order.order_number}`,
      html,
    });

    return success(null, "Email sent");
  }
);

/**
 * Send age verification result email
 */
export const sendAgeVerificationEmail = withErrorHandling(
  async (
    userId: string,
    approved: boolean,
    reason?: string
  ): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return error("User not found", ErrorCode.NOT_FOUND);
    }

    const customerName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer";

    const html = ageVerificationResultTemplate({
      customerName,
      approved,
      reason,
    });

    await sendEmail({
      to: user.email,
      subject: approved
        ? "Age Verification Approved"
        : "Age Verification Rejected",
      html,
    });

    return success(null, "Email sent");
  }
);

/**
 * Send return request status email
 */
export const sendReturnStatusEmail = withErrorHandling(
  async (
    returnId: string,
    status: "approved" | "rejected",
    notes?: string
  ): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: returnRequest, error: fetchError } = await supabase
      .from("returns")
      .select(
        `
        *,
        users!customer_id (
          email,
          first_name
        ),
        orders!inner (
          order_number
        )
      `
      )
      .eq("id", returnId)
      .single();

    if (fetchError || !returnRequest) {
      return error("Return not found", ErrorCode.NOT_FOUND);
    }

    const html =
      status === "approved"
        ? `
        <h1>Return Request Approved</h1>
        <p>Hi ${returnRequest.users.first_name},</p>
        <p>Your return request for order <strong>${returnRequest.orders.order_number}</strong> has been approved.</p>
        <p>Refund amount: <strong>R${returnRequest.refund_amount}</strong></p>
        ${notes ? `<p>Notes: ${notes}</p>` : ""}
        <p>Please bring the items to our store for processing.</p>
        
        <p>Best regards,<br>13th Vapour Lounge Team</p>
      `
        : `
        <h1>Return Request Rejected</h1>
        <p>Hi ${returnRequest.users.first_name},</p>
        <p>Unfortunately, your return request for order <strong>${returnRequest.orders.order_number}</strong> has been rejected.</p>
        ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
        
        <p>If you have questions, please contact our support team.</p>
        
        <p>Best regards,<br>13th Vapour Lounge Team</p>
      `;

    await sendEmail({
      to: returnRequest.users.email,
      subject: `Return Request ${status === "approved" ? "Approved" : "Rejected"} - ${returnRequest.orders.order_number}`,
      html,
    });

    return success(null, "Email sent");
  }
);

/**
 * Send low stock alert to admin
 */
export const sendLowStockAlert = withErrorHandling(
  async (productIds?: string[]): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get low stock products
    let query = supabase
      .from("products")
      .select("id, name, sku, stock_quantity, low_stock_threshold")
      .lte("stock_quantity", 10);

    if (productIds && productIds.length > 0) {
      query = query.in("id", productIds);
    }

    const { data: products } = await query;

    if (!products || products.length === 0) {
      return success(null, "No low stock products found");
    }

    // Get admin emails
    const { data: admins } = await supabase
      .from("users")
      .select("email, roles!inner(name)")
      .eq("roles.name", "admin");

    if (!admins || admins.length === 0) {
      return error("No admin users found", ErrorCode.NOT_FOUND);
    }

    const productsData = products.map((py) => ({
      name: py.name,
      sku: py.sku,
      currentStock: py.stock_quantity ?? 0,
      threshold: py.low_stock_threshold || 10,
    }));

    const html = lowStockAlertTemplate({ products: productsData });

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `Low Stock Alert - ${products.length} product(s) need restocking`,
        html,
      });
    }

    return success(null, "Alert emails sent");
  }
);

/**
 * Send welcome email
 */
export const sendWelcomeEmail = withErrorHandling(
  async (userId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return error("User not found", ErrorCode.NOT_FOUND);
    }

    const customerName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer";

    const html = welcomeEmailTemplate({ customerName });

    await sendEmail({
      to: user.email,
      subject: "Welcome to 13th Vapour Lounge!",
      html,
    });

    return success(null, "Welcome email sent");
  }
);

// ─── In-App Notification CRUD ────────────────────────────────────────────────

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

/**
 * Fetch the current user's in-app notifications (latest 30)
 */
export const getNotifications = withErrorHandling(
  async (): Promise<ActionResponse<NotificationRow[]>> => {
    const user = await getCurrentUser();
    if (!user) return error("Unauthenticated", ErrorCode.UNAUTHORIZED);

    const supabase = await createClient();
    const { data, error: fetchError } = await supabase
      .from("notifications")
      .select("id, title, message, type, link, is_read, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (fetchError) return error(fetchError.message, ErrorCode.SERVER_ERROR);
    return success(data as NotificationRow[], "OK");
  }
);

/**
 * Mark a single notification as read
 */
export const markNotificationRead = withErrorHandling(
  async (notificationId: string): Promise<ActionResponse> => {
    const user = await getCurrentUser();
    if (!user) return error("Unauthenticated", ErrorCode.UNAUTHORIZED);

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (updateError) return error(updateError.message, ErrorCode.SERVER_ERROR);
    return success(null, "Marked as read");
  }
);

/**
 * Mark all notifications as read for the current user
 */
export const markAllNotificationsRead = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const user = await getCurrentUser();
    if (!user) return error("Unauthenticated", ErrorCode.UNAUTHORIZED);

    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (updateError) return error(updateError.message, ErrorCode.SERVER_ERROR);
    return success(null, "All marked as read");
  }
);

// ─── Stock Notification Templates ────────────────────────────────────────────

function buildStockNotification(
  type: "low_stock" | "out_of_stock" | "critical_stock" | "expiring_stock",
  productName: string,
  currentQty?: number,
  expiryDate?: string
): { title: string; message: string } {
  switch (type) {
    case "low_stock":
      return {
        title: `Low Stock: ${productName}`,
        message: `The stock for ${productName} is running low (${currentQty} remaining). You might want to restock soon.`,
      };
    case "out_of_stock":
      return {
        title: `Out of Stock: ${productName}`,
        message: `${productName} is currently out of stock (0 units). Restocking is recommended to avoid missed sales.`,
      };
    case "critical_stock":
      return {
        title: `Critical Stock: ${productName}`,
        message: `${productName} is at a critical stock level (${currentQty} left). Restock immediately to prevent out-of-stock issues.`,
      };
    case "expiring_stock":
      return {
        title: `Expiring Stock: ${productName}`,
        message: `The stock for ${productName} is nearing expiration (expires on ${expiryDate}). Please review and take action.`,
      };
  }
}

/**
 * Scan inventory and create in-app notifications for stock issues.
 * Deduplicates: skips products that already have an unread notification for the same event.
 */
export const checkAndCreateStockNotifications = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get all admin/staff users to notify
    const { data: adminUsers } = await supabase
      .from("users")
      .select("id, roles!inner(name)")
      .or("roles.name.eq.admin,roles.name.eq.staff");

    if (!adminUsers || adminUsers.length === 0)
      return success(null, "No admin users to notify");

    const adminIds = adminUsers.map((u) => u.id);

    // Fetch products with stock data
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug, stock_quantity, low_stock_threshold")
      .eq("is_active", true);

    if (!products) return success(null, "No products found");

    // For each admin, gather existing unread notifications to avoid duplicates
    const inserts: {
      user_id: string;
      title: string;
      message: string;
      type: string;
      link: string;
    }[] = [];

    for (const product of products) {
      const qty = product.stock_quantity ?? 0;
      const threshold = product.low_stock_threshold ?? 10;
      const criticalThreshold = Math.ceil(threshold * 0.3); // 30% of threshold = critical
      const productLink = `/admin/inventory`;

      // Determine notification type
      let notifType: "low_stock" | "out_of_stock" | "critical_stock" | null =
        null;

      if (qty === 0) {
        notifType = "out_of_stock";
      } else if (qty <= criticalThreshold) {
        notifType = "critical_stock";
      } else if (qty <= threshold) {
        notifType = "low_stock";
      }

      if (notifType) {
        for (const adminId of adminIds) {
          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", adminId)
            .eq("type", notifType)
            .eq("is_read", false)
            .like("title", `%${product.name}%`);

          if (!count || count === 0) {
            const { title, message } = buildStockNotification(
              notifType,
              product.name,
              qty
            );
            inserts.push({
              user_id: adminId,
              title,
              message,
              type: notifType,
              link: productLink,
            });
          }
        }
      }
    }

    if (inserts.length > 0) {
      await supabase.from("notifications").insert(inserts);
    }

    return success(
      { created: inserts.length },
      `${inserts.length} notifications created`
    );
  }
);

/**
 * Paginated notifications list for the admin /notifications page
 */
export const getAdminNotifications = withErrorHandling(
  async (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser.user) return error("Unauthorized", ErrorCode.UNAUTHORIZED);

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", currentUser.user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (params?.type) query = query.eq("type", params.type);
    if (params?.isRead !== undefined)
      query = query.eq("is_read", params.isRead);
    if (params?.startDate) query = query.gte("created_at", params.startDate);
    if (params?.endDate) query = query.lte("created_at", params.endDate);

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({ notifications: data, total: count ?? 0, page, pageSize });
  }
);
