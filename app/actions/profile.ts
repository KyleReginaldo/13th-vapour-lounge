"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
