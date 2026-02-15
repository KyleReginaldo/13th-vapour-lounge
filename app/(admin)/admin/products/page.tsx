import { ProductsManagement } from "@/components/admin/ProductsManagement";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      brands(name),
      categories(name),
      product_images(url)
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <ProductsManagement products={(products as any) ?? []} />
    </div>
  );
}
