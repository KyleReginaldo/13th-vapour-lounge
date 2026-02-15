"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
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
 * Send transactional email using configured service
 * Replace with actual email service (SendGrid, Resend, etc.)
 */
async function sendEmail(data: EmailData): Promise<boolean> {
  // TODO: Integrate with actual email service
  // For now, log to console
  console.log("📧 Email would be sent:", {
    to: data.to,
    subject: data.subject,
  });

  // Example with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Vapour Lounge <noreply@vapourlounge.com>',
    ...data
  });
  */

  return true;
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
          first_name
        ),
        order_items (
          quantity,
          price,
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

    const itemsList = order.order_items
      .map(
        (item: any) =>
          `${item.quantity}x ${item.products.name} - R${item.price * item.quantity}`
      )
      .join("<br>");

    const html = `
      <h1>Order Confirmation</h1>
      <p>Hi ${order.users.first_name},</p>
      <p>Thank you for your order! Your order number is <strong>${order.order_number}</strong>.</p>
      
      <h2>Order Details</h2>
      ${itemsList}
      
      <p><strong>Total: R${order.total}</strong></p>
      
      <p>Please upload your payment proof to complete your order.</p>
      
      <p>Best regards,<br>Vapour Lounge Team</p>
    `;

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
          first_name
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const html = `
      <h1>Payment Verified!</h1>
      <p>Hi ${order.users.first_name},</p>
      <p>Great news! Your payment for order <strong>${order.order_number}</strong> has been verified.</p>
      <p>We're now processing your order. You'll receive another email when it's ready for pickup.</p>
      
      <p>Best regards,<br>Vapour Lounge Team</p>
    `;

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
          first_name
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    const html = `
      <h1>Your Order is Ready!</h1>
      <p>Hi ${order.users.first_name},</p>
      <p>Your order <strong>${order.order_number}</strong> is ready for pickup at our store.</p>
      
      <p><strong>Pickup Location:</strong><br>
      Vapour Lounge<br>
      123 Main Street<br>
      Sample, Trece Martires</p>
      
      <p>Please bring a valid ID for age verification.</p>
      
      <p>Best regards,<br>Vapour Lounge Team</p>
    `;

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
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return error("User not found", ErrorCode.NOT_FOUND);
    }

    const html = approved
      ? `
        <h1>Age Verification Approved</h1>
        <p>Hi ${user.first_name},</p>
        <p>Congratulations! Your age verification has been approved.</p>
        <p>You can now purchase age-restricted products from our store.</p>
        
        <p>Best regards,<br>Vapour Lounge Team</p>
      `
      : `
        <h1>Age Verification Rejected</h1>
        <p>Hi ${user.first_name},</p>
        <p>Unfortunately, we could not verify your age with the documents provided.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>You can submit new documents by visiting your account settings.</p>
        
        <p>Best regards,<br>Vapour Lounge Team</p>
      `;

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
        
        <p>Best regards,<br>Vapour Lounge Team</p>
      `
        : `
        <h1>Return Request Rejected</h1>
        <p>Hi ${returnRequest.users.first_name},</p>
        <p>Unfortunately, your return request for order <strong>${returnRequest.orders.order_number}</strong> has been rejected.</p>
        ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
        
        <p>If you have questions, please contact our support team.</p>
        
        <p>Best regards,<br>Vapour Lounge Team</p>
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
  async (productId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("name, sku, stock_quantity, low_stock_threshold")
      .eq("id", productId)
      .single();

    if (!product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    // Get admin emails
    const { data: admins } = await supabase
      .from("users")
      .select("email")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      return error("No admin users found", ErrorCode.NOT_FOUND);
    }

    const html = `
      <h1>Low Stock Alert</h1>
      <p>The following product is running low on stock:</p>
      
      <p><strong>Product:</strong> ${product.name}<br>
      <strong>SKU:</strong> ${product.sku}<br>
      <strong>Current Stock:</strong> ${product.stock_quantity}<br>
      <strong>Threshold:</strong> ${product.low_stock_threshold}</p>
      
      <p>Please reorder soon to avoid stockouts.</p>
    `;

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `Low Stock Alert - ${product.name}`,
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
      .select("email, first_name")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return error("User not found", ErrorCode.NOT_FOUND);
    }

    const html = `
      <h1>Welcome to Vapour Lounge!</h1>
      <p>Hi ${user.first_name},</p>
      <p>Thank you for joining Vapour Lounge, Trece Martires's premier vape shop.</p>
      
      <h2>Next Steps:</h2>
      <ol>
        <li>Complete your age verification to purchase products</li>
        <li>Browse our extensive product catalog</li>
        <li>Add items to your cart and checkout</li>
        <li>Upload payment proof after ordering</li>
        <li>Pick up your order at our store</li>
      </ol>
      
      <p>If you have any questions, feel free to contact our support team.</p>
      
      <p>Happy vaping!<br>Vapour Lounge Team</p>
    `;

    await sendEmail({
      to: user.email,
      subject: "Welcome to Vapour Lounge!",
      html,
    });

    return success(null, "Welcome email sent");
  }
);
