"use server";

import { error, success, type ActionResponse } from "@/lib/actions/utils";
import { createClient } from "@/lib/supabase/server";

/**
 * Seed the roles table with default roles
 */
export async function seedRoles(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const roles = [{ name: "admin" }, { name: "staff" }, { name: "customer" }];

    // Check if roles already exist
    const { data: existingRoles } = await supabase.from("roles").select("name");

    if (existingRoles && existingRoles.length > 0) {
      return success(existingRoles, "Roles already exist");
    }

    // Insert roles
    const { data, error: insertError } = await supabase
      .from("roles")
      .insert(roles)
      .select();

    if (insertError) {
      return error(insertError.message);
    }

    return success(data, "Roles seeded successfully");
  } catch (err) {
    return error(err instanceof Error ? err.message : "Failed to seed roles");
  }
}

/**
 * Seed shop settings with default values
 */
export async function seedShopSettings(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const settings = [
      {
        key: "shop_name",
        value: { name: "Vapour Lounge" },
      },
      {
        key: "business_hours",
        value: { open: "09:00", close: "21:00" },
      },
      {
        key: "features",
        value: { reviews_enabled: true, age_gate_enabled: true },
      },
      {
        key: "categories",
        value: ["Vape Juice", "Devices", "Accessories", "Coils", "Batteries"],
      },
    ];

    // Check if settings already exist
    const { data: existingSettings } = await supabase
      .from("shop_settings")
      .select("key");

    if (existingSettings && existingSettings.length > 0) {
      return success(existingSettings, "Shop settings already exist");
    }

    // Insert settings
    const { data, error: insertError } = await supabase
      .from("shop_settings")
      .insert(settings)
      .select();

    if (insertError) {
      return error(insertError.message);
    }

    return success(data, "Shop settings seeded successfully");
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Failed to seed shop settings"
    );
  }
}

/**
 * Seed a cash register
 */
export async function seedCashRegister(): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    // Check if register already exists
    const { data: existingRegister } = await supabase
      .from("cash_registers")
      .select("*")
      .limit(1)
      .single();

    if (existingRegister) {
      return success(existingRegister, "Cash register already exists");
    }

    // Insert default register
    const { data, error: insertError } = await supabase
      .from("cash_registers")
      .insert({
        name: "Register 1",
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      return error(insertError.message);
    }

    return success(data, "Cash register seeded successfully");
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Failed to seed cash register"
    );
  }
}

/**
 * Run all seed functions
 */
export async function seedDatabase(): Promise<ActionResponse> {
  try {
    const results = [];

    // Seed roles
    const rolesResult = await seedRoles();
    results.push({ type: "roles", ...rolesResult });

    // Seed shop settings
    const settingsResult = await seedShopSettings();
    results.push({ type: "settings", ...settingsResult });

    // Seed cash register
    const registerResult = await seedCashRegister();
    results.push({ type: "register", ...registerResult });

    const allSuccess = results.every((r) => r.success);

    return success(
      results,
      allSuccess
        ? "Database seeded successfully"
        : "Database seeded with some errors"
    );
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Failed to seed database"
    );
  }
}
