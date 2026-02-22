import { getProducts } from "@/app/actions/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import {
  BadgePercent,
  Cpu,
  Droplets,
  LayoutGrid,
  Shield,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const productsData = await getProducts(1, 48);
  const products = productsData?.products || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Compact promo banner */}
      <div className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs md:text-sm gap-4">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none shrink-0">
              <span className="shrink-0 text-gray-300">
                <Shield className="w-4 h-4 inline mr-1" /> Age Verified Store
              </span>
              <span className="shrink-0 text-gray-500 hidden sm:inline">|</span>
              <span className="shrink-0 text-gray-300 hidden sm:inline">
                <Zap className="w-4 h-4 inline mr-1" /> Fast Local Delivery
              </span>
              <span className="shrink-0 text-gray-500 hidden md:inline">|</span>
              <span className="shrink-0 text-gray-300 hidden md:inline">
                <Sparkles className="w-4 h-4 inline mr-1" /> Premium Quality
                Only
              </span>
            </div>
            <Link
              href="/sign-in"
              className="shrink-0 text-orange-400 hover:text-orange-300 font-medium"
            >
              Sign in for deals →
            </Link>
          </div>
        </div>
      </div>

      {/* Category Quick-Links */}
      <div className="bg-white border-b border-gray-200 sticky top-[64px] md:top-[80px] z-30 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
            {[
              { label: "All", icon: LayoutGrid, href: "/products" },
              {
                label: "Devices",
                icon: Cpu,
                href: "/products?category=devices",
              },
              {
                label: "Vape Juice",
                icon: Droplets,
                href: "/products?category=juice",
              },
              {
                label: "Accessories",
                icon: Wrench,
                href: "/products?category=accessories",
              },
              { label: "New", icon: Sparkles, href: "/products?tag=new" },
              { label: "Sale", icon: BadgePercent, href: "/products?tag=sale" },
            ].map(({ label, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-150"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products — straight to the goods */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Row header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            All Products
            {products.length > 0 && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {products.length}+ items
              </span>
            )}
          </h2>
          <Link
            href="/products"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            See all →
          </Link>
        </div>

        <ProductGrid
          products={products}
          columns={{ mobile: 2, tablet: 3, desktop: 5 }}
          priority={true}
        />

        {products.length > 0 && (
          <div className="mt-10 text-center">
            <Link href="/products">
              <Button
                variant="outline"
                className="rounded-xl border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white px-10"
              >
                View All Products →
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
