import { getBrands, getCategories } from "@/app/actions/categories-brands";
import { ProductsContent } from "@/components/product/ProductsContent";
import { Suspense } from "react";

export default async function ProductsPage() {
  const [categoriesResult, brandsResult] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);

  const categories = (
    (categoriesResult?.data as { id: string; name: string; slug: string }[]) ??
    []
  ).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  const brands = (
    (brandsResult?.data as { id: string; name: string; slug: string }[]) ?? []
  ).map((b) => ({ id: b.id, name: b.name, slug: b.slug }));

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
