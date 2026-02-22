"use client";

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { Bars3Icon } from "@heroicons/react/24/outline";

export function MobileSidebarTrigger() {
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <button
      onClick={toggle}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Toggle sidebar"
    >
      <Bars3Icon className="h-6 w-6 text-gray-600" />
    </button>
  );
}
