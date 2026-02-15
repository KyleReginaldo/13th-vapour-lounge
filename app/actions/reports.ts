"use server";

import {
  error,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

/**
 * Get sales report for a date range
 */
export const getSalesReport = withErrorHandling(
  async (startDate: string, endDate: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, payment_status, status, created_at, payment_method")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (ordersError) return error(ordersError.message);

    const totalSales =
      orders?.reduce(
        (sum, o) => sum + (o.payment_status === "paid" ? o.total : 0),
        0
      ) || 0;
    const totalOrders = orders?.length || 0;
    const paidOrders =
      orders?.filter((o) => o.payment_status === "paid").length || 0;
    const pendingOrders =
      orders?.filter((o) => o.payment_status === "pending").length || 0;

    // Payment method breakdown
    const byPaymentMethod = orders?.reduce((acc: any, o) => {
      if (o.payment_status === "paid" && o.payment_method) {
        acc[o.payment_method] = (acc[o.payment_method] || 0) + o.total;
      }
      return acc;
    }, {});

    return success({
      totalSales,
      totalOrders,
      paidOrders,
      pendingOrders,
      averageOrderValue: totalOrders > 0 ? totalSales / paidOrders : 0,
      byPaymentMethod,
      orders,
    });
  }
);

/**
 * Get inventory report
 */
export const getInventoryReport = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, base_price, category_id");

    if (productsError) return error(productsError.message);

    const totalProducts = products?.length || 0;
    const totalValue =
      products?.reduce(
        (sum, p) => sum + (p.stock_quantity || 0) * p.base_price,
        0
      ) || 0;
    const lowStockItems =
      products?.filter((p) => (p.stock_quantity || 0) < 10).length || 0;
    const outOfStockItems =
      products?.filter((p) => (p.stock_quantity || 0) === 0).length || 0;

    // Category breakdown
    const byCategory = products?.reduce((acc: any, p) => {
      const category = p.category_id || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 };
      }
      acc[category].count += 1;
      acc[category].value += (p.stock_quantity || 0) * p.base_price;
      return acc;
    }, {});

    return success({
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      byCategory,
      products,
    });
  }
);

/**
 * Get top selling products
 */
export const getTopSellingProducts = withErrorHandling(
  async (
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        unit_price,
        subtotal,
        order:order_id(created_at, payment_status),
        products:product_id(name, product_images, category_id)
      `
      )
      .gte("order.created_at", startDate)
      .lte("order.created_at", endDate)
      .eq("order.payment_status", "paid");

    if (fetchError) return error(fetchError.message);

    // Aggregate by product
    const aggregated = data?.reduce((acc: any, item) => {
      const key = item.product_id;
      if (!acc[key]) {
        acc[key] = {
          product_id: item.product_id,
          product: item.products,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].totalRevenue += item.subtotal;
      return acc;
    }, {});

    const topProducts = Object.values(aggregated || {})
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return success(topProducts);
  }
);

/**
 * Get customer analytics
 */
export const getCustomerAnalytics = withErrorHandling(
  async (startDate: string, endDate: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_id, total, payment_status, created_at")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (ordersError) return error(ordersError.message);

    const uniqueCustomers = new Set(orders?.map((o) => o.customer_id)).size;
    const totalRevenue =
      orders?.reduce(
        (sum, o) => sum + (o.payment_status === "paid" ? o.total : 0),
        0
      ) || 0;
    const averageRevenuePerCustomer =
      uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

    // Get top customers
    const byCustomer = orders?.reduce((acc: any, o) => {
      if (o.payment_status === "paid") {
        if (!acc[o.customer_id]) {
          acc[o.customer_id] = { totalSpent: 0, orderCount: 0 };
        }
        acc[o.customer_id].totalSpent += o.total;
        acc[o.customer_id].orderCount += 1;
      }
      return acc;
    }, {});

    const topCustomers = Object.entries(byCustomer || {})
      .map(([id, stats]: any) => ({ customer_id: id, ...stats }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return success({
      uniqueCustomers,
      totalRevenue,
      averageRevenuePerCustomer,
      topCustomers,
    });
  }
);
