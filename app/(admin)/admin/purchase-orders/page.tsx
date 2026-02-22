import { PurchaseOrdersManagement } from "@/components/admin/purchase-orders/PurchaseOrdersManagement";
import { createClient } from "@/lib/supabase/server";

export default async function PurchaseOrdersPage() {
  const supabase = await createClient();

  const [{ data: purchaseOrders }, { data: suppliers }, { data: products }] =
    await Promise.all([
      supabase
        .from("purchase_orders")
        .select(
          `*, suppliers:supplier_id(id, name), users:created_by(first_name, last_name), purchase_order_items(id, product_id, quantity, unit_cost, subtotal, products:product_id(id, name))`
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("suppliers")
        .select("id, name")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("products")
        .select("id, name, sku, base_price")
        .eq("is_published", true)
        .order("name"),
    ]);

  return (
    <div className="p-4 md:p-8">
      <PurchaseOrdersManagement
        initialOrders={purchaseOrders ?? []}
        suppliers={suppliers ?? []}
        products={products ?? []}
      />
    </div>
  );
}
