import { ProductsManagement } from "@/components/admin/ProductsManagement";
import { getCurrentUser } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const isAdmin = (currentUser?.roles as any)?.name === "admin";

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      brand:brands!brand_id(name),
      category:categories!category_id(name),
      product_images(url)
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8">
      <ProductsManagement
        products={(products as any) ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
