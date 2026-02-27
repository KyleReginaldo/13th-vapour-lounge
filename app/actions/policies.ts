"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import {
  POLICY_DEFAULT_CONTENT,
  POLICY_META,
  type PolicyData,
  type PolicyKey,
} from "@/lib/policies";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Get a single policy by key
 */
export const getPolicy = withErrorHandling(
  async (key: PolicyKey): Promise<ActionResponse<PolicyData>> => {
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (fetchError) {
      return error("Failed to fetch policy", ErrorCode.SERVER_ERROR);
    }

    if (!data) {
      return success({
        title: POLICY_META[key].label,
        content: POLICY_DEFAULT_CONTENT[key],
        updated_at: null,
      });
    }

    return success(data.value as PolicyData);
  }
);

/**
 * Get all policies at once
 */
export const getAllPolicies = withErrorHandling(
  async (): Promise<ActionResponse<Record<PolicyKey, PolicyData>>> => {
    const supabase = await createClient();

    const keys = Object.keys(POLICY_META) as PolicyKey[];

    const { data, error: fetchError } = await supabase
      .from("shop_settings")
      .select("key, value")
      .in("key", keys);

    if (fetchError) {
      return error("Failed to fetch policies", ErrorCode.SERVER_ERROR);
    }

    const result = {} as Record<PolicyKey, PolicyData>;

    for (const key of keys) {
      const row = data?.find((r) => r.key === key);
      result[key] = row
        ? (row.value as PolicyData)
        : {
            title: POLICY_META[key].label,
            content: POLICY_DEFAULT_CONTENT[key],
            updated_at: null,
          };
    }

    return success(result);
  }
);

/**
 * Save / update a policy (admin only)
 */
export const savePolicy = withErrorHandling(
  async (
    key: PolicyKey,
    content: string
  ): Promise<ActionResponse<PolicyData>> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const payload: PolicyData = {
      title: POLICY_META[key].label,
      content: content.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("shop_settings")
      .upsert({ key, value: payload }, { onConflict: "key" });

    if (upsertError) {
      return error("Failed to save policy", ErrorCode.SERVER_ERROR);
    }

    revalidatePath(POLICY_META[key].slug);
    revalidatePath("/admin/policies");

    return success(payload, `${POLICY_META[key].label} saved successfully`);
  }
);
