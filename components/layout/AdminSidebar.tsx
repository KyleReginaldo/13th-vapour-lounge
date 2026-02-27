"use client";

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navigation = [
  {
    name: "Dashboard",
    href: "/admin/",
    icon: HomeIcon,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: ShoppingBagIcon,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: TagIcon,
  },
  {
    name: "Inventory",
    href: "/admin/inventory",
    icon: CubeIcon,
  },
  {
    name: "Suppliers",
    href: "/admin/suppliers",
    icon: BuildingStorefrontIcon,
  },
  {
    name: "Purchase Orders",
    href: "/admin/purchase-orders",
    icon: DocumentTextIcon,
  },
  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCartIcon,
  },
  {
    name: "Payments",
    href: "/admin/payments",
    icon: CreditCardIcon,
  },
  {
    name: "Returns",
    href: "/admin/returns",
    icon: ClockIcon,
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "POS",
    href: "/admin/pos",
    icon: CreditCardIcon,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: ChartBarIcon,
  },
  {
    name: "Staff",
    href: "/admin/staff",
    icon: UsersIcon,
  },
  {
    name: "Shifts",
    href: "/admin/shifts",
    icon: CalendarDaysIcon,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    name: "Verifications",
    href: "/admin/verifications",
    icon: IdentificationIcon,
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ShieldCheckIcon,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
  },
  {
    name: "Policies",
    href: "/admin/policies",
    icon: DocumentTextIcon,
  },
];

export function AdminSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  // Items only visible to admins
  const adminOnlyRoutes = [
    "/admin/reports",
    "/admin/audit-logs",
    "/admin/verifications",
    "/admin/users",
    "/admin/staff",
    "/admin/settings",
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gray-900 text-white h-screen",
          "transition-transform duration-200 ease-in-out",
          // Desktop: always visible, relative position
          "lg:relative lg:translate-x-0 lg:z-auto",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-800 shrink-0">
          <Image
            src="/logo.jpg"
            alt="13th Vapour Lounge Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <h4 className="ml-3 text-lg font-semibold">
            {isAdmin ? "Admin Panel" : "Staff Panel"}
          </h4>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              // Hide admin-only routes from staff
              if (!isAdmin && adminOnlyRoutes.includes(item.href)) return null;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 shrink-0">
          <p className="text-xs text-gray-400">Admin Panel v1.0</p>
        </div>
      </div>
    </>
  );
}
