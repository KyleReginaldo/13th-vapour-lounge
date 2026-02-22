import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      users(first_name, last_name, email),
      order_items(id, product_name, sku, quantity, unit_price, subtotal, variant_attributes)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <div className="p-4 md:p-8">
      <OrdersManagement orders={orders || []} />
    </div>
  );
}
