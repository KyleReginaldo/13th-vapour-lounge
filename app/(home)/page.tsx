import { getProducts } from "@/app/actions/products";
import { getUnreviewedOrders } from "@/app/actions/reviews";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ReviewPromptDialog } from "@/components/shared/ReviewPromptDialog";
import { VerificationBanner } from "@/components/shared/VerificationBanner";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import {
  BadgePercent,
  Cpu,
  Droplets,
  LayoutGrid,
  ShieldAlert,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function HomePage() {
  const [productsData, user] = await Promise.all([
    getProducts(1, 48),
    getCurrentUser().catch(() => null),
  ]);
  const products = productsData?.products || [];
  const showVerificationBanner = !!user && !user.is_verified;

  const unreviewedOrders = user
    ? ((await getUnreviewedOrders().catch(() => ({ data: [] }))).data ?? [])
    : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      {showVerificationBanner && <VerificationBanner />}
      {unreviewedOrders.length > 0 && (
        <ReviewPromptDialog unreviewedOrders={unreviewedOrders} />
      )}
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -top-40 -left-40 w-125 h-125 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-100 h-100 rounded-full bg-orange-400/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 py-16 md:py-20 lg:py-24">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/6 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">
                  Trece Martires&apos; #1 Vape Shop
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5">
                Premium Vapes,
                <br />
                <span className="text-orange-400">Your Way.</span>
              </h1>
              <p className="text-[15px] md:text-base text-white/55 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                Discover our curated collection of premium vape devices, pods,
                e-liquids, and accessories — all verified, age-gated, and ready
                for fast local delivery.
              </p>
              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="/products">
                  <Button className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm border-0 shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_28px_rgba(249,115,22,0.5)] transition-all">
                    Shop All Products →
                  </Button>
                </Link>
                {/* <Link href="/products?category=devices">
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-xl text-sm font-medium border-white/20 text-white hover:bg-white/10 hover:border-white/40 bg-transparent"
                  >
                    Browse Devices
                  </Button>
                </Link> */}
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-5 justify-center lg:justify-start mt-8">
                {[
                  { icon: ShieldAlert, text: "Age Verified 18+" },
                  { icon: Truck, text: "Fast Local Delivery" },
                  { icon: Star, text: "Premium Quality" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 text-xs text-white/50"
                  >
                    <Icon className="w-3.5 h-3.5 text-orange-400" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: product showcase image */}
            <div className="flex-1 relative flex justify-center items-center lg:justify-end max-w-sm lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl w-full max-w-sm aspect-4/3 bg-white/5 flex items-center justify-center">
                <Image
                  src="/logo.jpg"
                  alt="13th Vapour Lounge"
                  width={300}
                  height={300}
                  className="object-contain opacity-90 p-8 rounded-md"
                />
                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="text-xs text-white/80 font-medium">
                    Age-verified store — 18+ only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Quick-Links */}
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-30 shadow-sm">
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
