import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { createClient } from "@/lib/supabase/server";

export default async function OrdersPage() {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      users(first_name, last_name, email),
      order_items(product_name, quantity, unit_price)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }

  return (
    <div className="container mx-auto p-6">
      <OrdersManagement orders={orders || []} />
    </div>  
  );
}
