"use server";

import { sendEmail } from "@/lib/email/transport";

export type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function submitContactForm(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactFormState> {
  const { name, email, subject, message } = formData;

  if (!name.trim() || name.trim().length < 2)
    return { status: "error", message: "Please enter your full name." };
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { status: "error", message: "Please enter a valid email address." };
  if (!subject.trim() || subject.trim().length < 3)
    return { status: "error", message: "Please enter a subject." };
  if (!message.trim() || message.trim().length < 10)
    return {
      status: "error",
      message: "Message must be at least 10 characters.",
    };

  const storeEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "";

  if (!storeEmail) {
    return {
      status: "error",
      message:
        "Contact form is not configured yet. Please reach us on Facebook.",
    };
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 16px;color:#0A0A0A">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;border-bottom:1px solid #F0F0F0;color:#888;width:100px">Name</td><td style="padding:8px 0;border-bottom:1px solid #F0F0F0;font-weight:600">${name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #F0F0F0;color:#888">Email</td><td style="padding:8px 0;border-bottom:1px solid #F0F0F0"><a href="mailto:${email}" style="color:#0A0A0A">${email}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #F0F0F0;color:#888">Subject</td><td style="padding:8px 0;border-bottom:1px solid #F0F0F0">${subject}</td></tr>
      </table>
      <div style="margin-top:16px">
        <p style="color:#888;margin:0 0 8px">Message</p>
        <div style="background:#F7F7F7;padding:16px;border-radius:8px;white-space:pre-wrap;color:#0A0A0A">${message}</div>
      </div>
      <p style="margin-top:24px;font-size:12px;color:#ADADAD">Sent from the 13th Vapour Lounge contact form</p>
    </div>
  `;

  const result = await sendEmail({
    to: storeEmail,
    subject: `[Contact Form] ${subject} — from ${name}`,
    html,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
  });

  if (!result.success) {
    return {
      status: "error",
      message:
        "Failed to send your message. Please try again or reach us on Facebook.",
    };
  }

  return { status: "success" };
}
