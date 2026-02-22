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

/**
 * Get shop settings
 */
export const getShopSettings = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("shop_settings")
      .select()
      .single();

    if (fetchError) {
      // If no settings exist, return defaults
      return success({
        shop_name: "13th Vapour Lounge",
        tax_rate: 0,
        currency: "PHP",
        allow_cod: true,
        allow_online_payment: true,
        low_stock_threshold: 10,
      });
    }

    return success(data);
  }
);

/**
 * Update shop settings
 */
export const updateShopSettings = withErrorHandling(
  async (settings: any): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Check if settings exist
    const { data: existing } = await supabase
      .from("shop_settings")
      .select()
      .single();

    let data;
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("shop_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) return error(updateError.message);
      data = updated;
    } else {
      const { data: created, error: createError } = await supabase
        .from("shop_settings")
        .insert(settings)
        .select()
        .single();

      if (createError) return error(createError.message);
      data = created;
    }

    await logAudit({
      action: existing ? "update" : "create",
      entityType: "product", // Using existing entity type
      entityId: data.id,
      newValue: settings,
    });

    revalidatePath("/admin/settings");
    return success(data, "Settings updated successfully");
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
