"use server";

import { passwordChangeOTPTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/transport";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ── OTP helpers ──────────────────────────────────────────────────────────────

const OTP_COOKIE = "__pw_otp";
const OTP_EXPIRES_MINUTES = 10;

function getOtpSecret(): string {
  return (
    process.env.OTP_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "vapour-lounge-otp-secret"
  );
}

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string, userId: string): string {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${otp}:${userId}`)
    .digest("hex");
}

function signCookiePayload(payload: string): string {
  const sig = crypto
    .createHmac("sha256", getOtpSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

function verifyCookiePayload(value: string): string | null {
  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);
  const expected = crypto
    .createHmac("sha256", getOtpSecret())
    .update(payload)
    .digest("hex");
  if (
    !crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expected, "hex")
    )
  ) {
    return null;
  }
  return payload;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type PasswordChangeState =
  | { status: "idle" }
  | { status: "otp_sent"; email: string }
  | { status: "error"; message: string }
  | { status: "success" };

export type ProfileOrder = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  total: number;
  subtotal: number;
  created_at: string | null;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    variant_attributes: Record<string, string> | null;
  }[];
};

export async function getUserOrders(): Promise<ProfileOrder[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id, order_number, status, payment_status, payment_method,
      total, subtotal, created_at,
      order_items(id, product_name, quantity, unit_price, subtotal, variant_attributes)
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((o) => ({
    ...o,
    items: (o.order_items as any[]) || [],
  }));
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const middleName = (formData.get("middleName") as string) || null;
  const suffix = (formData.get("suffix") as string) || null;
  const contactNumber = formData.get("contactNumber") as string;

  const { error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      suffix: suffix,
      contact_number: contactNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    redirect("/profile?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/profile");
  redirect("/profile?message=Profile updated successfully");
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    redirect("/profile?tab=settings&error=Passwords do not match");
  }

  if (newPassword.length < 6) {
    redirect(
      "/profile?tab=settings&error=Password must be at least 6 characters"
    );
  }

  // Re-authenticate with current password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    redirect("/profile?tab=settings&error=Current password is incorrect");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    redirect(
      "/profile?tab=settings&error=" + encodeURIComponent(error.message)
    );
  }

  revalidatePath("/profile");
  redirect("/profile?tab=settings&message=Password changed successfully");
}
// ── OTP-Based Password Change (two-step) ─────────────────────────────────────

/**
 * Step 1 – Validate current password, generate & email OTP.
 * Used with useActionState.
 */
export async function requestPasswordChangeOTP(
  _prev: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate new passwords
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { status: "error", message: "All fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }
  if (newPassword.length < 6) {
    return {
      status: "error",
      message: "Password must be at least 6 characters.",
    };
  }

  // Re-authenticate to verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInError) {
    return { status: "error", message: "Current password is incorrect." };
  }

  // Generate OTP
  const otp = generateOtp();
  const otpHash = hashOtp(otp, user.id);
  const expiresAt = Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000;

  // Build signed cookie value: otpHash|userId|expiresAt|newPassword
  // newPassword is included so step 2 can apply it without the user re-entering
  const rawPayload = `${otpHash}|${user.id}|${expiresAt}|${Buffer.from(newPassword).toString("base64")}`;
  const signedValue = signCookiePayload(rawPayload);

  const cookieStore = await cookies();
  cookieStore.set(OTP_COOKIE, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OTP_EXPIRES_MINUTES * 60,
    path: "/",
  });

  // Get user's full name for the email
  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .single();
  const firstName = profile?.first_name ?? user.email!.split("@")[0];

  // Send OTP email
  const emailResult = await sendEmail({
    to: user.email!,
    subject: "Your Password Change Verification Code – 13th Vapour Lounge",
    html: passwordChangeOTPTemplate({
      customerName: firstName,
      otp,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
    }),
  });

  if (!emailResult.success) {
    cookieStore.delete(OTP_COOKIE);
    return {
      status: "error",
      message: "Failed to send verification email. Please try again.",
    };
  }

  return { status: "otp_sent", email: user.email! };
}

/**
 * Step 2 – Verify OTP and apply the new password.
 * Used with useActionState.
 */
export async function verifyPasswordChangeOTP(
  _prev: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "Not authenticated." };

  const otp = (formData.get("otp") as string)?.trim();
  if (!otp || otp.length !== 6) {
    return { status: "error", message: "Please enter the 6-digit code." };
  }

  // Read + verify cookie
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(OTP_COOKIE)?.value;
  if (!cookieValue) {
    return {
      status: "error",
      message: "OTP expired or not found. Please request a new one.",
    };
  }

  const payload = verifyCookiePayload(cookieValue);
  if (!payload) {
    cookieStore.delete(OTP_COOKIE);
    return {
      status: "error",
      message: "Invalid session. Please request a new OTP.",
    };
  }

  const parts = payload.split("|");
  if (parts.length !== 4) {
    cookieStore.delete(OTP_COOKIE);
    return {
      status: "error",
      message: "Invalid session. Please request a new OTP.",
    };
  }

  const [storedOtpHash, cookieUserId, expiresAtStr, newPasswordB64] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  // Ownership check
  if (cookieUserId !== user.id) {
    cookieStore.delete(OTP_COOKIE);
    return {
      status: "error",
      message: "Session mismatch. Please request a new OTP.",
    };
  }

  // Expiry check
  if (Date.now() > expiresAt) {
    cookieStore.delete(OTP_COOKIE);
    return {
      status: "error",
      message: "OTP has expired. Please request a new one.",
    };
  }

  // OTP hash check
  const expectedHash = hashOtp(otp, user.id);
  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedHash, "hex"),
      Buffer.from(storedOtpHash, "hex")
    )
  ) {
    return {
      status: "error",
      message: "Incorrect verification code. Please try again.",
    };
  }

  // All good — apply the new password
  const newPassword = Buffer.from(newPasswordB64, "base64").toString("utf8");
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  cookieStore.delete(OTP_COOKIE);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/profile");
  return { status: "success" };
}
