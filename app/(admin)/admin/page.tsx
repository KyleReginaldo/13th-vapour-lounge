import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

async function getDashboardStats() {
  const supabase = await createClient();

  // Get product count
  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  // Get user count
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get pending orders count
  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Get total orders count
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  // Get low stock alerts count
  const { count: lowStockCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .lt("stock_quantity", 10);

  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("status", "completed")
    .gte("created_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  const todaySales =
    todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

  // Calculate average order value
  const { data: completedOrders } = await supabase
    .from("orders")
    .select("total")
    .eq("status", "completed");

  const averageOrderValue =
    completedOrders && completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => sum + (order.total || 0), 0) /
        completedOrders.length
      : 0;

  return {
    productCount: productCount || 0,
    userCount: userCount || 0,
    pendingOrders: pendingOrders || 0,
    totalOrders: totalOrders || 0,
    lowStockCount: lowStockCount || 0,
    todaySales,
    averageOrderValue,
  };
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  const stats = await getDashboardStats();

  return (
    <div className="container mx-auto p-6">
      <AdminDashboardClient
        stats={stats}
        userName={user?.first_name || "Admin"}
      />
    </div>
  );
}
