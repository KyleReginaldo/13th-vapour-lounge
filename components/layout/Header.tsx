"use client";

import { CartBadge } from "@/components/cart/CartBadge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { type UserWithRole } from "@/lib/auth/roles";
import { signOut } from "@/lib/auth/supabase-auth";
import {
  Grid,
  Home,
  LogIn,
  LogOut,
  Menu,
  ShoppingCart,
  Tag,
  User,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
interface HeaderProps {
  user: UserWithRole | null;
  unreadNotifCount?: number;
}

export const Header = ({ user, unreadNotifCount = 0 }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left: Logo + Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="text-xl md:text-2xl font-bold gradient-text ">
                  <Image
                    src="/logo.jpg"
                    alt="13th Vapour Lounge Logo"
                    width={48}
                    height={48}
                    className="rounded-md"
                  />{" "}
                </div>
              </Link>
            </div>

            {/* Center: Search (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <SearchAutocomplete placeholder="Search products..." />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Notification Bell — logged-in users only */}
              {user && (
                <NotificationBell
                  initialUnreadCount={unreadNotifCount}
                  isStaff={
                    user.roles?.name === "admin" || user.roles?.name === "staff"
                  }
                />
              )}

              <Link
                href="/cart"
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-accent transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <CartBadge />
              </Link>

              {user ? (
                <>
                  <Link
                    href={
                      user.roles?.name === "admin"
                        ? "/admin"
                        : user.roles?.name === "staff"
                          ? "/admin"
                          : "/profile"
                    }
                    className="hidden md:block"
                  >
                    <Button variant="ghost" className="gap-2">
                      <User className="h-5 w-5" />
                      <span className="text-sm">
                        {user.roles?.name === "admin"
                          ? "Admin Panel"
                          : user.roles?.name === "staff"
                            ? "Staff Panel"
                            : "Profile"}
                      </span>
                    </Button>
                  </Link>
                  <form action={signOut} className="hidden md:block">
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      title="Sign Out"
                      className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </form>
                </>
              ) : (
                <Link href="/sign-in" className="hidden md:block">
                  <Button variant="ghost" className="gap-2">
                    <LogIn className="h-5 w-5" />
                    <span className="text-sm">Sign In</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <SearchAutocomplete placeholder="Search products..." />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 h-12 text-sm border-t">
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <Link
              href="/products"
              className="hover:text-primary transition-colors"
            >
              Shop All
            </Link>
            <Link
              href="/products?category=juice"
              className="hover:text-primary transition-colors"
            >
              Vape Juice
            </Link>
            <Link
              href="/products?category=devices"
              className="hover:text-primary transition-colors"
            >
              Devices
            </Link>
            <Link
              href="/products?tag=new"
              className="hover:text-primary transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              href="/products?tag=sale"
              className="text-destructive font-semibold hover:text-destructive/80 transition-colors"
            >
              Sale
            </Link>
          </nav>
        </div>
      </header>
      {/* Mobile Sidebar Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 flex flex-col p-0">
          {/* Sidebar Header */}
          <SheetHeader className="px-6 py-5 border-b bg-gray-50">
            {user && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {user.email}
              </p>
            )}
          </SheetHeader>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {[
              { href: "/", icon: Home, label: "Home" },
              { href: "/products", icon: Grid, label: "Shop All" },
              {
                href: "/products?category=juice",
                icon: Zap,
                label: "Vape Juice",
              },
              {
                href: "/products?category=devices",
                icon: Zap,
                label: "Devices",
              },
              { href: "/products?tag=new", icon: Tag, label: "New Arrivals" },
              {
                href: "/products?tag=sale",
                icon: Tag,
                label: "Sale",
                red: true,
              },
            ].map(({ href, icon: Icon, label, red }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 ${
                  red ? "text-red-500 hover:bg-red-50" : "text-gray-700"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Bottom: Account / Sign In */}
          <div className="border-t px-3 py-4 space-y-1">
            {user ? (
              <>
                <Link
                  href={
                    user.roles?.name === "admin" || user.roles?.name === "staff"
                      ? "/admin"
                      : "/profile"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <User className="h-4 w-4" />
                  {user.roles?.name === "admin" || user.roles?.name === "staff"
                    ? "Admin Dashboard"
                    : "My Account"}
                </Link>
                <form action={signOut} className="w-full">
                  <button
                    type="submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
