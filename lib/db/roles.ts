import { createClient } from "@/lib/supabase/server";

/**
 * Get all roles from the database
 */
export async function getRoles() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

/**
 * Get a specific role by name
 */
export async function getRoleByName(name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("name", name)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create initial roles (seed function)
 */
export async function seedRoles() {
  const supabase = await createClient();

  const roles = [{ name: "admin" }, { name: "staff" }, { name: "customer" }];

  const { data, error } = await supabase
    .from("roles")
    .upsert(roles, { onConflict: "name" })
    .select();

  if (error) throw error;
  return data;
}
