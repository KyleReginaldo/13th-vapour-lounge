import { ProductsContent } from "@/components/product/ProductsContent";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default async function ProductsPage() {
  const supabase = await createClient();

  const [{ data: categoriesData }, { data: brandsData }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("brands")
      .select("id, name, slug")
      .order("name", { ascending: true }),
  ]);

  const categories = (categoriesData ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  const brands = (brandsData ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
  }));

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ProductsContent categories={categories} brands={brands} />
    </Suspense>
  );
}
