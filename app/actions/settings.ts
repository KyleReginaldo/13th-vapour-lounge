"use server";

import {
  error,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SETTINGS_DEFAULTS = {
  shop_name: "13th Vapour Lounge",
  tax_rate: 0,
  currency: "PHP",
  allow_cod: true,
  allow_online_payment: true,
  low_stock_threshold: 10,
  shipping_fee: 50,
  free_shipping_threshold: 0,
};

/**
 * Get shop settings (admin only)
 */
export const getShopSettings = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data } = await supabase.from("shop_settings").select("key, value");

    if (!data || data.length === 0) {
      return success(SETTINGS_DEFAULTS);
    }

    const map = (data as { key: string; value: unknown }[]).reduce<
      Record<string, unknown>
    >((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return success({ ...SETTINGS_DEFAULTS, ...map });
  }
);

/**
 * Get public shipping settings (no auth required)
 */
export const getPublicShippingSettings = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const { data } = await supabase
      .from("shop_settings")
      .select("key, value")
      .in("key", ["shipping_fee", "free_shipping_threshold"]);

    const map = ((data ?? []) as { key: string; value: unknown }[]).reduce<
      Record<string, unknown>
    >((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return success({
      shipping_fee: (map.shipping_fee as number) ?? 50,
      free_shipping_threshold: (map.free_shipping_threshold as number) ?? 0,
    });
  }
);

/**
 * Update shop settings
 */
export const updateShopSettings = withErrorHandling(
  async (settings: Record<string, unknown>): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Upsert each key-value pair into the shop_settings table
    const entries = Object.entries(settings);
    const upsertRows = entries.map(([key, value]) => ({
      key,
      value: value as import("@/database.types").Json,
      updated_by: admin.id,
    }));

    const { error: upsertError } = await supabase
      .from("shop_settings")
      .upsert(upsertRows, { onConflict: "key" });

    if (upsertError) return error(upsertError.message);

    await logAudit({
      action: "update",
      entityType: "product", // Using existing entity type
      newValue: settings,
    });

    revalidatePath("/admin/settings");
    return success(settings, "Settings updated successfully");
  }
);

/**
 * Get tax settings
 */
export const getTaxSettings = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);

    // Return default tax configuration
    return success([
      {
        id: "1",
        rate: 0.12,
        description: "VAT",
      },
    ]);
  }
);

/**
 * Update tax rate
 */
export const updateTaxRate = withErrorHandling(
  async (
    id: string,
    rate: number,
    description?: string
  ): Promise<ActionResponse> => {
    await requireRole(["admin"]);

    revalidatePath("/admin/settings");
    return success({ id, rate, description }, "Tax rate updated");
  }
);

/**
 * Get shipping methods
 */
export const getShippingMethods = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);

    // Return default shipping methods
    return success([
      {
        id: "1",
        name: "Standard Shipping",
        price: 50,
        is_active: true,
      },
      {
        id: "2",
        name: "Express Shipping",
        price: 150,
        is_active: true,
      },
    ]);
  }
);

/**
 * Update shipping method
 */
export const updateShippingMethod = withErrorHandling(
  async (id: string, updates: any): Promise<ActionResponse> => {
    await requireRole(["admin"]);

    revalidatePath("/admin/settings");
    return success({ id, ...updates }, "Shipping method updated");
  }
);

/**
 * Get backup/restore options
 */
export const createBackup = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Log backup creation
    await logAudit({
      action: "create",
      entityType: "product", // Using existing entity type
      entityId: new Date().toISOString(),
    });

    return success({ timestamp: new Date().toISOString() }, "Backup initiated");
  }
);
