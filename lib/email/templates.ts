/**
 * Email template utilities and HTML builders
 */

/**
 * Base HTML email template wrapper
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>13th Vapour Lounge</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">13th Vapour Lounge</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">13th Vapour Lounge</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Order confirmation email template
 */
export function orderConfirmationTemplate(params: {
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  orderUrl?: string;
}): string {
  const itemsHtml = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.price.toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0;">Order Confirmation</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Thank you for your order! We've received your order <strong>${params.orderNumber}</strong> and will process it shortly.
    </p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px 0; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Item</th>
          <th style="padding: 12px 0; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px 0; text-align: right; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 15px 0; font-weight: 600; font-size: 16px; color: #111827;">Total</td>
          <td style="padding: 15px 0; text-align: right; font-weight: 700; font-size: 18px; color: #667eea;">₱${params.orderTotal.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
    
    ${
      params.orderUrl
        ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Track Order</a>
    </div>
    `
        : ""
    }
    
    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
      We'll send you another email when your order is ready for pickup or has been shipped.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Payment verified email template
 */
export function paymentVerifiedTemplate(params: {
  customerName: string;
  orderNumber: string;
  amount: number;
}): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; line-height: 60px; font-size: 30px;">✓</div>
    </div>
    
    <h2 style="color: #111827; margin: 0 0 20px 0; text-align: center;">Payment Verified</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Great news! Your payment of <strong>₱${params.amount.toLocaleString()}</strong> for order <strong>${params.orderNumber}</strong> has been verified and confirmed.
    </p>
    
    <p style="color: #4b5563; margin: 0; line-height: 1.6;">
      Your order is now being processed and you'll receive another update soon.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Order ready for pickup email template
 */
export function orderReadyTemplate(params: {
  customerName: string;
  orderNumber: string;
  pickupInstructions?: string;
}): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0;">Your Order is Ready!</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Your order <strong>${params.orderNumber}</strong> is ready for pickup at our store!
    </p>
    
    ${
      params.pickupInstructions
        ? `
    <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px;">Pickup Instructions</h3>
      <p style="margin: 0; color: #4b5563; line-height: 1.6;">${params.pickupInstructions}</p>
    </div>
    `
        : ""
    }
    
    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
      Please bring a valid ID and your order number when picking up.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Low stock alert email template (for admin/staff)
 */
export function lowStockAlertTemplate(params: {
  products: Array<{
    name: string;
    sku?: string;
    currentStock: number;
    threshold: number;
  }>;
}): string {
  const productsHtml = params.products
    .map(
      (product) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${product.name}${product.sku ? ` (${product.sku})` : ""}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: 600;">${product.currentStock}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${product.threshold}</td>
    </tr>
  `
    )
    .join("");

  const content = `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 30px;">
      <h2 style="color: #991b1b; margin: 0 0 10px 0;">⚠️ Low Stock Alert</h2>
      <p style="color: #7f1d1d; margin: 0;">The following products are running low on stock and need restocking.</p>
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px 0; text-align: left; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Product</th>
          <th style="padding: 12px 0; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Current Stock</th>
          <th style="padding: 12px 0; text-align: center; color: #6b7280; font-weight: 600; font-size: 14px; border-bottom: 2px solid #e5e7eb;">Threshold</th>
        </tr>
      </thead>
      <tbody>
        ${productsHtml}
      </tbody>
    </table>
    
    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px;">
      Please review and restock these items to avoid stockouts.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Welcome email template
 */
export function welcomeEmailTemplate(params: { customerName: string }): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0;">Welcome to 13th Vapour Lounge!</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Thank you for creating an account with us! We're excited to have you as part of our community.
    </p>
    
    <div style="background-color: #f9fafb; padding: 25px; border-radius: 6px; margin: 30px 0;">
      <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
        <li>Browse our collection of premium vape products</li>
        <li>Complete age verification to unlock full access</li>
        <li>Enjoy secure shopping and fast checkout</li>
      </ul>
    </div>
    
    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
      If you have any questions, feel free to reach out to us anytime.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Age verification result email template
 */
export function ageVerificationResultTemplate(params: {
  customerName: string;
  approved: boolean;
  reason?: string;
}): string {
  const content = params.approved
    ? `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; line-height: 60px; font-size: 30px;">✓</div>
    </div>
    
    <h2 style="color: #111827; margin: 0 0 20px 0; text-align: center;">Age Verification Approved</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Great news! Your age verification has been approved. You now have full access to browse and purchase all products.
    </p>
  `
    : `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #ef4444; color: white; width: 60px; height: 60px; border-radius: 50%; line-height: 60px; font-size: 30px;">✗</div>
    </div>
    
    <h2 style="color: #111827; margin: 0 0 20px 0; text-align: center;">Age Verification Declined</h2>
    <p style="color: #4b5563; margin: 0 0 20px 0; line-height: 1.6;">Hi ${params.customerName},</p>
    <p style="color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
      Unfortunately, we were unable to verify your age at this time.
    </p>
    
    ${
      params.reason
        ? `
    <div style="background-color: #fef2f2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
      <p style="margin: 0; color: #7f1d1d;"><strong>Reason:</strong> ${params.reason}</p>
    </div>
    `
        : ""
    }
    
    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
      Please contact us if you have questions or would like to resubmit your verification.
    </p>
  `;

  return emailWrapper(content);
}
