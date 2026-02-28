import { getFeatureFlags } from "@/app/actions/feature-flags";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import { Wrench } from "lucide-react";

export async function MaintenanceBanner() {
  const [flagsResult, user] = await Promise.all([
    getFeatureFlags(),
    getCurrentUser(),
  ]);

  const isMaintenanceMode =
    flagsResult?.success && flagsResult.data?.maintenanceMode;
  const isStaffOrAdmin =
    user?.roles?.name === "admin" || user?.roles?.name === "staff";

  if (!isMaintenanceMode || !isStaffOrAdmin) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-2 z-50">
      <Wrench className="w-4 h-4" />
      <span className="font-medium">Maintenance Mode Active</span>
      <span className="hidden sm:inline">
        — Customers cannot access the site right now.
      </span>
    </div>
  );
}
