"use server";

import { withErrorHandling, type ActionResponse } from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FeatureFlags = {
  ageGateEnabled: boolean;
  reviewsEnabled: boolean;
  posEnabled: boolean;
  onlineOrderingEnabled: boolean;
  emailNotificationsEnabled: boolean;
  lowStockAlertsEnabled: boolean;
  ageVerificationRequired: boolean;
  maintenanceMode: boolean;
  newUserRegistrationsEnabled: boolean;
  guestCheckoutEnabled: boolean;
};

const defaultFeatureFlags: FeatureFlags = {
  ageGateEnabled: true,
  reviewsEnabled: true,
  posEnabled: true,
  onlineOrderingEnabled: true,
  emailNotificationsEnabled: true,
  lowStockAlertsEnabled: true,
  ageVerificationRequired: true,
  maintenanceMode: false,
  newUserRegistrationsEnabled: true,
  guestCheckoutEnabled: false,
};

/**
 * Get current feature flags
 */
export const getFeatureFlags = withErrorHandling(
  async (): Promise<ActionResponse<FeatureFlags>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "feature_flags")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      throw error;
    }

    // Return the stored flags or default flags
    const flags = data?.value || defaultFeatureFlags;

    return {
      success: true,
      data: flags as FeatureFlags,
    };
  }
);

/**
 * Update feature flags
 */
export const updateFeatureFlags = withErrorHandling(
  async (flags: Partial<FeatureFlags>): Promise<ActionResponse> => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get current flags
    const currentResult = await getFeatureFlags();
    if (!currentResult.success || !currentResult.data) {
      throw new Error("Failed to get current feature flags");
    }

    const currentFlags = currentResult.data;

    // Merge with new flags
    const updatedFlags: FeatureFlags = {
      ...currentFlags,
      ...flags,
    };

    // Upsert the flags
    const { error } = await supabase.from("shop_settings").upsert(
      {
        key: "feature_flags",
        value: updatedFlags,
        description: "Feature toggles for enabling/disabling system features",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

    if (error) {
      throw error;
    }

    // Audit log
    await logAudit({
      action: "update",
      entityType: "setting",
      entityId: "feature_flags",
      oldValue: currentFlags as Record<string, any>,
      newValue: updatedFlags as Record<string, any>,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
      message: "Feature flags updated successfully",
    };
  }
);

/**
 * Check if a specific feature is enabled
 */
export const isFeatureEnabled = withErrorHandling(
  async (feature: keyof FeatureFlags): Promise<ActionResponse<boolean>> => {
    const result = await getFeatureFlags();

    if (!result.success || !result.data) {
      // Default to false if we can't get flags
      return { success: true, data: false };
    }

    return {
      success: true,
      data: result.data[feature] ?? defaultFeatureFlags[feature],
    };
  }
);
