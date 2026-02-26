"use server";

import { Database } from "@/database.types";
import { passwordChangeOTPTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/transport";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ── Forgot-password OTP helpers ──────────────────────────────────────────────

const FP_OTP_COOKIE = "__fp_otp";
const FP_VERIFIED_COOKIE = "__fp_verified";
const OTP_EXPIRES_MINUTES = 10;
const VERIFIED_EXPIRES_MINUTES = 15;

function getFpOtpSecret(): string {
  return (
    process.env.OTP_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "vapour-lounge-otp-secret"
  );
}

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string, key: string): string {
  return crypto
    .createHmac("sha256", getFpOtpSecret())
    .update(`${otp}:${key}`)
    .digest("hex");
}

function signPayload(payload: string): string {
  const sig = crypto
    .createHmac("sha256", getFpOtpSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

function verifyPayload(value: string): string | null {
  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);
  const expected = crypto
    .createHmac("sha256", getFpOtpSecret())
    .update(payload)
    .digest("hex");
  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(sig, "hex"),
        Buffer.from(expected, "hex")
      )
    )
      return null;
  } catch {
    return null;
  }
  return payload;
}

export type UserWithRole = Database["public"]["Tables"]["users"]["Row"] & {
  roles: Database["public"]["Tables"]["roles"]["Row"] | null;
};

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const middleName = (formData.get("middleName") as string) || "";
  const suffix = (formData.get("suffix") as string) || "";
  const contactNumber = formData.get("contactNumber") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;

  // Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (authError) {
    redirect("/sign-up?error=" + encodeURIComponent(authError.message));
  }

  if (!authData.user) {
    redirect("/sign-up?error=Failed to create user");
  }

  // Get customer role
  const { data: customerRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "customer")
    .single();

  if (!customerRole) {
    redirect("/sign-up?error=Customer role not found. Please run seed first.");
  }

  // Create user in public.users table
  const { error: userError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName || null,
    suffix: suffix || null,
    contact_number: contactNumber,
    date_of_birth: dateOfBirth,
    role_id: customerRole.id,
    is_verified: false,
  });

  if (userError) {
    redirect("/sign-up?error=" + encodeURIComponent(userError.message));
  }

  revalidatePath("/", "layout");
  redirect(
    "/sign-in?message=Account created! Please check your email to verify."
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/sign-in?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from("users")
    .select(
      `
      *,
      roles:role_id(*)
    `
    )
    .eq("id", authUser.id)
    .single();

  return user as UserWithRole | null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userRole = user.roles?.name;

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }

  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles?.name === "admin";
}

export async function isStaff(): Promise<boolean> {
  const user = await getCurrentUser();
  const role = user?.roles?.name;
  return role === "staff" || role === "admin";
}

export async function sendPasswordResetOtp(
  email: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Check the user exists
  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name")
    .eq("email", email)
    .maybeSingle();

  // Silently succeed so we don't leak whether the email exists
  if (!profile) return {};

  const otp = generateOtp();
  const otpHash = hashOtp(otp, email);
  const expiresAt = Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000;

  const rawPayload = `${email}|${otpHash}|${expiresAt}`;
  const signedValue = signPayload(rawPayload);

  const cookieStore = await cookies();
  cookieStore.set(FP_OTP_COOKIE, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OTP_EXPIRES_MINUTES * 60,
    path: "/",
  });

  const firstName = profile.first_name ?? email.split("@")[0];

  const emailResult = await sendEmail({
    to: email,
    subject: "Your Password Reset Code – 13th Vapour Lounge",
    html: passwordChangeOTPTemplate({
      customerName: firstName,
      otp,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
    }),
  });

  if (!emailResult.success) {
    cookieStore.delete(FP_OTP_COOKIE);
    return { error: "Failed to send verification email. Please try again." };
  }

  return {};
}

export async function verifyPasswordResetOtp(
  email: string,
  token: string
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(FP_OTP_COOKIE)?.value;

  if (!cookieValue)
    return { error: "OTP expired or not found. Please request a new one." };

  const payload = verifyPayload(cookieValue);
  if (!payload) {
    cookieStore.delete(FP_OTP_COOKIE);
    return { error: "Invalid session. Please request a new code." };
  }

  const parts = payload.split("|");
  if (parts.length !== 3) {
    cookieStore.delete(FP_OTP_COOKIE);
    return { error: "Invalid session. Please request a new code." };
  }

  const [cookieEmail, storedHash, expiresAtStr] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (cookieEmail !== email) {
    cookieStore.delete(FP_OTP_COOKIE);
    return { error: "Email mismatch. Please restart the process." };
  }

  if (Date.now() > expiresAt) {
    cookieStore.delete(FP_OTP_COOKIE);
    return { error: "Code has expired. Please request a new one." };
  }

  const expectedHash = hashOtp(token.trim(), email);
  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(expectedHash, "hex"),
        Buffer.from(storedHash, "hex")
      )
    ) {
      return { error: "Incorrect verification code. Please try again." };
    }
  } catch {
    return { error: "Incorrect verification code. Please try again." };
  }

  // OTP valid — swap to a "verified" cookie so the password step can proceed
  cookieStore.delete(FP_OTP_COOKIE);
  const verifiedPayload = `${email}|${Date.now() + VERIFIED_EXPIRES_MINUTES * 60 * 1000}`;
  cookieStore.set(FP_VERIFIED_COOKIE, signPayload(verifiedPayload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: VERIFIED_EXPIRES_MINUTES * 60,
    path: "/",
  });

  return {};
}

export async function updatePassword(
  newPassword: string
): Promise<{ error?: string }> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(FP_VERIFIED_COOKIE)?.value;

  if (!cookieValue)
    return {
      error: "Verification expired. Please start the process again.",
    };

  const payload = verifyPayload(cookieValue);
  if (!payload) {
    cookieStore.delete(FP_VERIFIED_COOKIE);
    return { error: "Invalid session. Please start the process again." };
  }

  const [email, expiresAtStr] = payload.split("|");
  if (Date.now() > parseInt(expiresAtStr, 10)) {
    cookieStore.delete(FP_VERIFIED_COOKIE);
    return { error: "Session expired. Please start the process again." };
  }

  // Look up the auth user id via the users table
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!profile) return { error: "User not found." };

  const { error } = await serviceClient.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  cookieStore.delete(FP_VERIFIED_COOKIE);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
