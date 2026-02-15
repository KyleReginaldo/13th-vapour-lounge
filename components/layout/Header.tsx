"use client";

import { CartBadge } from "@/components/cart/CartBadge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCart } = useCartStore();

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
                <div className="text-xl md:text-2xl font-bold gradient-text">
                  VAPOUR LOUNGE
                </div>
              </Link>
            </div>

            {/* Center: Search (Desktop Only) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={openCart}
              >
                <ShoppingCart className="h-5 w-5" />
                <CartBadge />
              </Button>

              <Link href="/profile" className="hidden md:block">
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm">Account</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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

            {/* Cart Drawer */}
            <CartDrawer />
          </nav>
        </div>
      </header>
    </>
  );
};
