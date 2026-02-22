"use server";

import { withErrorHandling, type ActionResponse } from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DaySchedule = {
  isOpen: boolean;
  openTime: string; // Format: "HH:mm" (24-hour)
  closeTime: string; // Format: "HH:mm" (24-hour)
};

export type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const defaultSchedule: WeeklySchedule = {
  monday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
  tuesday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
  wednesday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
  thursday: { isOpen: true, openTime: "09:00", closeTime: "21:00" },
  friday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
  saturday: { isOpen: true, openTime: "10:00", closeTime: "23:00" },
  sunday: { isOpen: true, openTime: "10:00", closeTime: "20:00" },
};

/**
 * Get the current business hours schedule
 */
export const getBusinessHours = withErrorHandling(
  async (): Promise<ActionResponse<WeeklySchedule>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "business_hours")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found, which is ok
      throw error;
    }

    // Return the stored schedule or default schedule
    const schedule = data?.value || defaultSchedule;

    return {
      success: true,
      data: schedule as WeeklySchedule,
    };
  }
);

/**
 * Update business hours schedule
 */
export const updateBusinessHours = withErrorHandling(
  async (schedule: WeeklySchedule): Promise<ActionResponse> => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();

    // Validate schedule
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    for (const day of days) {
      const daySchedule = schedule[day];
      if (!daySchedule) {
        throw new Error(`Missing schedule for ${day}`);
      }

      if (daySchedule.isOpen) {
        // Validate time format
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(daySchedule.openTime)) {
          throw new Error(
            `Invalid open time format for ${day}: ${daySchedule.openTime}`
          );
        }
        if (!timeRegex.test(daySchedule.closeTime)) {
          throw new Error(
            `Invalid close time format for ${day}: ${daySchedule.closeTime}`
          );
        }

        // Validate that close time is after open time
        const [openHour, openMin] = daySchedule.openTime.split(":").map(Number);
        const [closeHour, closeMin] = daySchedule.closeTime
          .split(":")
          .map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (closeMinutes <= openMinutes) {
          throw new Error(`Close time must be after open time for ${day}`);
        }
      }
    }

    // Get old value for audit log
    const { data: oldData } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "business_hours")
      .single();

    // Upsert the schedule
    const { error } = await supabase.from("shop_settings").upsert(
      {
        key: "business_hours",
        value: schedule,
        description: "Store operating hours for each day of the week",
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
      entityId: "business_hours",
      oldValue: (oldData?.value || defaultSchedule) as Record<string, any>,
      newValue: schedule as Record<string, any>,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");

    return {
      success: true,
      message: "Business hours updated successfully",
    };
  }
);

/**
 * Check if the store is currently open
 */
export const isStoreOpen = withErrorHandling(
  async (): Promise<ActionResponse<boolean>> => {
    const scheduleResult = await getBusinessHours();

    if (!scheduleResult.success || !scheduleResult.data) {
      return { success: true, data: false };
    }

    const schedule = scheduleResult.data;
    const now = new Date();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ] as const;
    const dayName = dayNames[now.getDay()];
    const daySchedule = schedule[dayName];

    if (!daySchedule.isOpen) {
      return { success: true, data: false };
    }

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMin;

    const [openHour, openMin] = daySchedule.openTime.split(":").map(Number);
    const [closeHour, closeMin] = daySchedule.closeTime.split(":").map(Number);
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    const isOpen =
      currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    return {
      success: true,
      data: isOpen,
    };
  }
);
