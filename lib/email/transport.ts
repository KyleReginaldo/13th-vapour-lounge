import nodemailer from "nodemailer";

/**
 * Email transporter configuration using SMTP
 */
export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
});

/**
 * Default email sender info
 */
export const defaultFrom = {
  name: process.env.SMTP_FROM_NAME || "13th Vapour Lounge",
  email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
};

/**
 * Send email with retry logic
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  retries = 3,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  retries?: number;
}): Promise<{ success: boolean; error?: string }> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await emailTransporter.sendMail({
        from: `${defaultFrom.name} <${defaultFrom.email}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      });

      return { success: true };
    } catch (error: any) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed:`, error.message);

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Failed to send email after retries",
  };
}

/**
 * Verify email transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await emailTransporter.verify();
    console.log("✓ Email service is ready");
    return true;
  } catch (error) {
    console.error("✗ Email service connection failed:", error);
    return false;
  }
}
