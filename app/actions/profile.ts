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
    product_id: string | null;
    product_slug: string | null;
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
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, variant_attributes, products(slug))
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((o) => ({
    ...o,
    items: ((o.order_items as any[]) || []).map((item: any) => ({
      ...item,
      product_slug: item.products?.slug ?? null,
    })),
  }));
}

/**
 * Re-add all items from a past order to the user's cart.
 * Returns { added, skipped } counts.
 */
export async function reorderItems(orderId: string): Promise<{
  success: boolean;
  added: number;
  skipped: number;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      success: false,
      added: 0,
      skipped: 0,
      message: "Not authenticated.",
    };

  // Fetch order items (must belong to this user)
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_items(product_id, quantity)")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single();

  if (!order)
    return {
      success: false,
      added: 0,
      skipped: 0,
      message: "Order not found.",
    };

  let added = 0;
  let skipped = 0;

  for (const item of (order.order_items as any[]) || []) {
    if (!item.product_id) {
      skipped++;
      continue;
    }

    // Check stock
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, is_published")
      .eq("id", item.product_id)
      .single();

    if (
      !product ||
      !product.is_published ||
      (product.stock_quantity ?? 0) < 1
    ) {
      skipped++;
      continue;
    }

    // Upsert into cart (increment if already there)
    const { data: existing } = await supabase
      .from("carts")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", item.product_id)
      .is("variant_id", null)
      .maybeSingle();

    if (existing) {
      const newQty = Math.min(
        existing.quantity + item.quantity,
        product.stock_quantity ?? 99
      );
      await supabase
        .from("carts")
        .update({ quantity: newQty })
        .eq("id", existing.id);
    } else {
      await supabase.from("carts").insert({
        user_id: user.id,
        product_id: item.product_id,
        variant_id: null,
        quantity: Math.min(item.quantity, product.stock_quantity ?? 99),
      });
    }
    added++;
  }

  revalidatePath("/cart");
  return {
    success: true,
    added,
    skipped,
    message:
      added > 0
        ? `${added} item${added !== 1 ? "s" : ""} added to cart${skipped > 0 ? ` (${skipped} unavailable)` : ""}.`
        : "All items from this order are currently unavailable.",
  };
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

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validate new passwords
  if (!newPassword || !confirmPassword) {
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

// ── Order Tracking ────────────────────────────────────────────────────────────

export type OrderTracking = {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  subtotal: number;
  shipping_cost: number | null;
  discount: number | null;
  tax: number;
  total: number;
  created_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  shipping_full_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  customer_notes: string | null;
  items: {
    id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    variant_attributes: Record<string, string> | null;
    product_slug: string | null;
    product_image: string | null;
  }[];
  statusHistory: {
    id: string;
    from_status: string | null;
    to_status: string;
    notes: string | null;
    created_at: string | null;
  }[];
};

export async function getOrderTracking(
  orderId: string
): Promise<{ data: OrderTracking | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated." };

  // Main order query
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      `
      id, order_number, status, payment_status, payment_method,
      tracking_number, subtotal, shipping_cost, discount, tax, total,
      created_at, paid_at, shipped_at, delivered_at, completed_at, cancelled_at,
      shipping_full_name, shipping_address_line1, shipping_address_line2,
      shipping_city, shipping_postal_code, shipping_country, shipping_phone,
      customer_notes,
      order_items(id, product_id, product_name, quantity, unit_price, subtotal, variant_attributes)
    `
    )
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single();

  if (orderErr || !order) {
    console.error("[getOrderTracking] query failed:", orderErr?.message, {
      orderId,
      userId: user.id,
    });
    return { data: null, error: orderErr?.message ?? "Order not found." };
  }

  // Fetch product slugs/images separately — best-effort
  const productIds: string[] = ((order.order_items as any[]) || [])
    .map((i: any) => i.product_id)
    .filter(Boolean);

  const productMap: Record<
    string,
    { slug: string | null; image: string | null }
  > = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, slug, images")
      .in("id", productIds);
    for (const p of products ?? []) {
      productMap[(p as any).id] = {
        slug: (p as any).slug ?? null,
        image: ((p as any).images as string[] | null)?.[0] ?? null,
      };
    }
  }

  // Status history — best-effort, silently ignored if table/relation isn't set up
  const { data: historyRows } = await supabase
    .from("order_status_history")
    .select("id, from_status, to_status, notes, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return {
    data: {
      ...(order as any),
      items: ((order.order_items as any[]) || []).map((item: any) => ({
        ...item,
        product_slug: productMap[item.product_id]?.slug ?? null,
        product_image: productMap[item.product_id]?.image ?? null,
      })),
      statusHistory: (historyRows ?? []) as OrderTracking["statusHistory"],
    },
  };
}
