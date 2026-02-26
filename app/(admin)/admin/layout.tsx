import { checkAndCreateStockNotifications } from "@/app/actions/notifications";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { requireRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/supabase-auth";

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

  // Silently check inventory and create stock notifications (fire-and-forget)
  checkAndCreateStockNotifications().catch(() => {});

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isAdmin={isAdmin} />

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
