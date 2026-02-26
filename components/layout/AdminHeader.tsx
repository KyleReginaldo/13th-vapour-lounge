import { MobileSidebarTrigger } from "@/components/layout/MobileSidebarTrigger";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { getCurrentUser, signOut } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { House } from "lucide-react";
import Link from "next/link";

interface AdminHeaderProps {
  title?: string;
}

export async function AdminHeader({ title }: AdminHeaderProps) {
  const user = await getCurrentUser();

  // Fetch unread notification count for the current admin user
  let unreadCount = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    unreadCount = count ?? 0;
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-3">
        <MobileSidebarTrigger />
        {title && (
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/">
          <House />
        </Link>
        <NotificationBell initialUnreadCount={unreadCount} isStaff />

        {/* User Info — hidden on smallest screens */}
        {user && (
          <span className="hidden sm:inline text-sm text-gray-600">
            {user.first_name} {user.last_name}
          </span>
        )}

        {/* Sign Out Button */}
        <form action={signOut}>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
}
