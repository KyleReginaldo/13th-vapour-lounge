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

/**
 * Email configuration types
 */
type EmailTemplate =
  | "order_confirmation"
  | "payment_verified"
  | "order_ready"
  | "order_completed"
  | "return_approved"
  | "return_rejected"
  | "age_verification_approved"
  | "age_verification_rejected"
  | "low_stock_alert"
  | "welcome";

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

    const items = order.order_items.map((item: any) => ({
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

    const productsData = products.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      currentStock: p.stock_quantity,
      threshold: p.low_stock_threshold || 10,
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
      .in("roles.name", ["admin", "staff"]);

    if (!adminUsers || adminUsers.length === 0)
      return success(null, "No admin users to notify");

    const adminIds = adminUsers.map((u: any) => u.id);

    // Fetch products with stock data including expiry
    const { data: products } = await supabase
      .from("products")
      .select(
        "id, name, slug, stock_quantity, low_stock_threshold, expiry_date"
      )
      .eq("is_active", true);

    if (!products) return success(null, "No products found");

    // For each admin, gather existing unread notifications to avoid duplicates
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const inserts: {
      user_id: string;
      title: string;
      message: string;
      type: string;
      link: string;
    }[] = [];

    for (const product of products as any[]) {
      const qty = product.stock_quantity ?? 0;
      const threshold = product.low_stock_threshold ?? 10;
      const criticalThreshold = Math.ceil(threshold * 0.3); // 30% of threshold = critical
      const productLink = `/admin/inventory`;

      // Determine notification type
      let notifType:
        | "low_stock"
        | "out_of_stock"
        | "critical_stock"
        | "expiring_stock"
        | null = null;

      if (qty === 0) {
        notifType = "out_of_stock";
      } else if (qty <= criticalThreshold) {
        notifType = "critical_stock";
      } else if (qty <= threshold) {
        notifType = "low_stock";
      }

      // Check expiry (within 30 days)
      if (product.expiry_date) {
        const expiry = new Date(product.expiry_date);
        if (expiry <= thirtyDaysFromNow && expiry >= now) {
          const formattedExpiry = expiry.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          for (const adminId of adminIds) {
            // Check for existing unread expiry notification for this product
            const { count } = await supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", adminId)
              .eq("type", "expiring_stock")
              .eq("is_read", false)
              .like("title", `%${product.name}%`);

            if (!count || count === 0) {
              const { title, message } = buildStockNotification(
                "expiring_stock",
                product.name,
                undefined,
                formattedExpiry
              );
              inserts.push({
                user_id: adminId,
                title,
                message,
                type: "expiring_stock",
                link: productLink,
              });
            }
          }
        }
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
