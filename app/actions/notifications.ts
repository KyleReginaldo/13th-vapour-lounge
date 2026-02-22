"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
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
