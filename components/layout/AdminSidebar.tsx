"use client";

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronDownIcon,
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
import { useEffect, useState } from "react";

// ─── Nav structure ────────────────────────────────────────────────────────────

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

type NavGroup = {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
  adminOnly?: boolean; // hides entire group from staff
};

type StandaloneItem = NavItem & { standalone: true };

const DASHBOARD: StandaloneItem = {
  standalone: true,
  name: "Dashboard",
  href: "/admin/",
  icon: HomeIcon,
};

const GROUPS: NavGroup[] = [
  {
    name: "Catalog",
    icon: ShoppingBagIcon,
    items: [
      { name: "Products", href: "/admin/products", icon: ShoppingBagIcon },
      { name: "Categories", href: "/admin/categories", icon: TagIcon },
    ],
  },
  {
    name: "Inventory",
    icon: CubeIcon,
    items: [
      { name: "Stock", href: "/admin/inventory", icon: CubeIcon },
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
    ],
  },
  {
    name: "Sales",
    icon: ShoppingCartIcon,
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCartIcon },
      { name: "Payments", href: "/admin/payments", icon: CreditCardIcon },
      { name: "Returns", href: "/admin/returns", icon: ClockIcon },
      {
        name: "Reviews",
        href: "/admin/reviews",
        icon: ClipboardDocumentListIcon,
      },
      { name: "POS", href: "/admin/pos", icon: CreditCardIcon },
    ],
  },
  {
    name: "Reports",
    icon: ChartBarIcon,
    adminOnly: true,
    items: [
      {
        name: "Reports",
        href: "/admin/reports",
        icon: ChartBarIcon,
        adminOnly: true,
      },
    ],
  },
  {
    name: "Team",
    icon: UsersIcon,
    items: [
      { name: "Staff", href: "/admin/staff", icon: UsersIcon, adminOnly: true },
      { name: "Shifts", href: "/admin/shifts", icon: CalendarDaysIcon },
      {
        name: "Users",
        href: "/admin/users",
        icon: UsersIcon,
        adminOnly: true,
      },
      {
        name: "Verifications",
        href: "/admin/verifications",
        icon: IdentificationIcon,
        adminOnly: true,
      },
      {
        name: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ShieldCheckIcon,
        adminOnly: true,
      },
    ],
  },
  {
    name: "System",
    icon: Cog6ToothIcon,
    items: [
      {
        name: "Settings",
        href: "/admin/settings",
        icon: Cog6ToothIcon,
        adminOnly: true,
      },
      { name: "Policies", href: "/admin/policies", icon: DocumentTextIcon },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { isOpen, close } = useSidebarStore();

  // Auto-open the group containing the current route
  const initialOpen = new Set<string>(
    GROUPS.filter((g) =>
      g.items.some(
        (i) => pathname === i.href || pathname.startsWith(i.href + "/")
      )
    ).map((g) => g.name)
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(initialOpen);

  // Keep in sync when pathname changes (e.g. navigation via Link)
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      GROUPS.forEach((g) => {
        if (
          g.items.some(
            (i) => pathname === i.href || pathname.startsWith(i.href + "/")
          )
        ) {
          next.add(g.name);
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const isActiveItem = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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
          "lg:relative lg:translate-x-0 lg:z-auto",
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
          <div className="px-3 space-y-0.5">
            {/* Dashboard — standalone */}
            <Link
              href={DASHBOARD.href}
              onClick={close}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveItem(DASHBOARD.href)
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <DASHBOARD.icon className="h-5 w-5 shrink-0" />
              {DASHBOARD.name}
            </Link>

            {/* Groups */}
            {GROUPS.map((group) => {
              // Hide fully admin-only groups from staff
              if (group.adminOnly && !isAdmin) return null;

              // Filter items by role
              const visibleItems = group.items.filter(
                (i) => isAdmin || !i.adminOnly
              );
              if (visibleItems.length === 0) return null;

              // If only one item, render as a flat link (no accordion)
              if (visibleItems.length === 1) {
                const item = visibleItems[0];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActiveItem(item.href)
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <group.icon className="h-5 w-5 shrink-0" />
                    {group.name}
                  </Link>
                );
              }

              const isGroupOpen = openGroups.has(group.name);
              const isGroupActive = visibleItems.some((i) =>
                isActiveItem(i.href)
              );

              return (
                <div key={group.name}>
                  {/* Group header button */}
                  <button
                    onClick={() => toggleGroup(group.name)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isGroupActive && !isGroupOpen
                        ? "bg-gray-800 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <group.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{group.name}</span>
                    <ChevronDownIcon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        isGroupOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>

                  {/* Items */}
                  {isGroupOpen && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-gray-700 space-y-0.5">
                      {visibleItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={close}
                          className={cn(
                            "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                            isActiveItem(item.href)
                              ? "bg-gray-800 text-white"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
