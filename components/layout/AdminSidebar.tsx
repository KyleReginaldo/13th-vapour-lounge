"use client";

import { cn } from "@/lib/utils";
import {
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  CubeIcon,
  DocumentTextIcon,
  HomeIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: HomeIcon,
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: ShoppingBagIcon,
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
    name: "Settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Vapour Lounge</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
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
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-400">Admin Panel v1.0</p>
      </div>
    </div>
  );
}
