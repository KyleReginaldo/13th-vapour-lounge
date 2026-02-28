import { checkAndCreateStockNotifications } from "@/app/actions/notifications";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin or staff role to access this layout
  await requireRole(["admin", "staff"]);
  const currentUser = await getCurrentUser();
  const isAdmin = (currentUser?.roles as any)?.name === "admin";

  // For staff: determine their shift status for today
  // "active"  = currently clocked in (no clock_out)
  // "done"    = clocked out already today
  // "none"    = hasn't clocked in at all today
  type ShiftStatus = "active" | "done" | "none";
  let shiftStatus: ShiftStatus = "active"; // admins always get "active" so they see no warning
  if (!isAdmin && currentUser) {
    const supabase = await createClient();

    // Active shift (clocked in, not yet out)
    const { data: activeShift } = await supabase
      .from("staff_shifts")
      .select("id")
      .eq("staff_id", currentUser.id)
      .is("clock_out", null)
      .maybeSingle();

    if (activeShift) {
      shiftStatus = "active";
    } else {
      // Check if they finished a shift today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayShift } = await supabase
        .from("staff_shifts")
        .select("id")
        .eq("staff_id", currentUser.id)
        .not("clock_out", "is", null)
        .gte("clock_in", todayStart.toISOString())
        .maybeSingle();
      shiftStatus = todayShift ? "done" : "none";
    }
  }

  // Silently check inventory and create stock notifications (fire-and-forget)
  checkAndCreateStockNotifications().catch(() => {});

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isAdmin={isAdmin} shiftStatus={shiftStatus} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
