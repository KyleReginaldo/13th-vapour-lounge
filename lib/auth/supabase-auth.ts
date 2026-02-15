"use server";

import { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    token_identifier: authData.user.id,
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
