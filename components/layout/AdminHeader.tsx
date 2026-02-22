import { MobileSidebarTrigger } from "@/components/layout/MobileSidebarTrigger";
import { getCurrentUser, signOut } from "@/lib/auth/roles";
import { BellIcon } from "@heroicons/react/24/outline";

interface AdminHeaderProps {
  title?: string;
}

export async function AdminHeader({ title }: AdminHeaderProps) {
  const user = await getCurrentUser();

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
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <BellIcon className="h-6 w-6 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

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
