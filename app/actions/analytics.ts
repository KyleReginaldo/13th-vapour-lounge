"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const dateRangeSchema = z.object({
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
});

/**
 * Get sales overview
 */
export const getSalesOverview = withErrorHandling(
  async (input?: z.infer<typeof dateRangeSchema>): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = input ? dateRangeSchema.parse(input) : null;

    let query = supabase
      .from("orders")
      .select("id, total, status, payment_status, created_at");

    if (validated) {
      query = query
        .gte("created_at", validated.startDate)
        .lte("created_at", validated.endDate);
    }

    const { data: orders, error: fetchError } = await query;

    if (fetchError) {
      return error("Failed to fetch sales data", ErrorCode.SERVER_ERROR);
    }

    // Calculate metrics
    const totalRevenue =
      orders
        ?.filter((o) => o.payment_status === "paid")
        .reduce((sum, o) => sum + o.total, 0) || 0;

    const totalOrders = orders?.length || 0;
    const paidOrders =
      orders?.filter((o) => o.payment_status === "paid").length || 0;
    const pendingOrders =
      orders?.filter((o) => o.payment_status === "pending").length || 0;
    const failedOrders =
      orders?.filter((o) => o.payment_status === "failed").length || 0;

    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Orders by status
    const ordersByStatus = {
      pending: orders?.filter((o) => o.status === "pending").length || 0,
      processing: orders?.filter((o) => o.status === "processing").length || 0,
      ready: orders?.filter((o) => o.status === "ready").length || 0,
      completed: orders?.filter((o) => o.status === "completed").length || 0,
      cancelled: orders?.filter((o) => o.status === "cancelled").length || 0,
    };

    return success({
      totalRevenue,
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      averageOrderValue,
      ordersByStatus,
    });
  }
);

/**
 * Get top selling products
 */
export const getTopProducts = withErrorHandling(
  async (
    limit = 10,
    dateRange?: z.infer<typeof dateRangeSchema>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = dateRange ? dateRangeSchema.parse(dateRange) : null;

    // Build query for order items
    let ordersQuery = supabase
      .from("orders")
      .select("id")
      .eq("payment_status", "paid");

    if (validated) {
      ordersQuery = ordersQuery
        .gte("created_at", validated.startDate)
        .lte("created_at", validated.endDate);
    }

    const { data: validOrders } = await ordersQuery;
    const orderIds = validOrders?.map((o) => o.id) || [];

    if (orderIds.length === 0) {
      return success([]);
    }

    // Get order items
    const { data: orderItems, error: fetchError } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        unit_price,
        products (
          id,
          name,
          slug,
          category_id,
          categories (
            name
          )
        )
      `
      )
      .in("order_id", orderIds);

    if (fetchError) {
      return error("Failed to fetch product data", ErrorCode.SERVER_ERROR);
    }

    // Aggregate by product
    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        slug: string;
        image: string | null;
        category: string | null;
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    for (const item of orderItems || []) {
      const existing = productMap.get(item.product_id);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.unit_price * item.quantity;
      } else {
        productMap.set(item.product_id, {
          productId: item.product_id,
          name: item.products?.name || "Unknown",
          slug: item.products?.slug || "",
          image: null,
          category: item.products?.categories?.name || null,
          totalQuantity: item.quantity,
          totalRevenue: item.unit_price * item.quantity,
        });
      }
    }

    // Sort by quantity and limit
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return success(topProducts);
  }
);

/**
 * Get revenue by category
 */
export const getRevenueByCategory = withErrorHandling(
  async (
    dateRange?: z.infer<typeof dateRangeSchema>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = dateRange ? dateRangeSchema.parse(dateRange) : null;

    let ordersQuery = supabase
      .from("orders")
      .select("id")
      .eq("payment_status", "paid");

    if (validated) {
      ordersQuery = ordersQuery
        .gte("created_at", validated.startDate)
        .lte("created_at", validated.endDate);
    }

    const { data: validOrders } = await ordersQuery;
    const orderIds = validOrders?.map((o) => o.id) || [];

    if (orderIds.length === 0) {
      return success([]);
    }

    const { data: orderItems, error: fetchError } = await supabase
      .from("order_items")
      .select(
        `
        quantity,
        unit_price,
        products!inner (
          category_id,
          categories (
            id,
            name
          )
        )
      `
      )
      .in("order_id", orderIds);

    if (fetchError) {
      return error("Failed to fetch category data", ErrorCode.SERVER_ERROR);
    }

    // Aggregate by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        totalRevenue: number;
        itemCount: number;
      }
    >();

    for (const item of orderItems || []) {
      const categoryId = item.products?.category_id;
      const categoryName = item.products?.categories?.name || "Uncategorized";

      if (categoryId) {
        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.totalRevenue += item.unit_price * item.quantity;
          existing.itemCount += item.quantity;
        } else {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName,
            totalRevenue: item.unit_price * item.quantity,
            itemCount: item.quantity,
          });
        }
      }
    }

    const categoryRevenue = Array.from(categoryMap.values()).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    return success(categoryRevenue);
  }
);

/**
 * Get daily sales for chart
 */
export const getDailySales = withErrorHandling(
  async (days = 30): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid")
      .gte("created_at", startDate.toISOString())
      .order("created_at");

    if (fetchError) {
      return error("Failed to fetch sales data", ErrorCode.SERVER_ERROR);
    }

    // Group by day
    const dailyMap = new Map<
      string,
      { date: string; revenue: number; orders: number }
    >();

    for (const order of orders || []) {
      const date = (order.created_at ?? "").split("T")[0]; // YYYY-MM-DD
      const existing = dailyMap.get(date);
      if (existing) {
        existing.revenue += order.total;
        existing.orders += 1;
      } else {
        dailyMap.set(date, {
          date,
          revenue: order.total,
          orders: 1,
        });
      }
    }

    const dailySales = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return success(dailySales);
  }
);

/**
 * Get customer analytics
 */
export const getCustomerAnalytics = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // Total customers
    const { count: totalCustomers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .eq("is_active", true);

    // Age verified customers
    const { count: verifiedCustomers } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .eq("is_verified", true);

    // New customers this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { count: newThisMonth } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", monthStart.toISOString());

    // Top customers by order count
    const { data: topCustomers, error: topError } = await supabase
      .from("orders")
      .select(
        `
        customer_id,
        total,
        users:customer_id (
          email,
          first_name,
          last_name
        )
      `
      )
      .eq("payment_status", "paid");

    if (topError) {
      return error("Failed to fetch customer data", ErrorCode.SERVER_ERROR);
    }

    // Aggregate customer spending
    const customerMap = new Map<
      string,
      {
        customerId: string;
        email: string;
        name: string;
        orderCount: number;
        totalSpent: number;
      }
    >();

    for (const order of topCustomers || []) {
      const existing = customerMap.get(order.customer_id);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
      } else {
        customerMap.set(order.customer_id, {
          customerId: order.customer_id,
          email: order.users?.email || "",
          name: `${order.users?.first_name || ""} ${order.users?.last_name || ""}`.trim(),
          orderCount: 1,
          totalSpent: order.total,
        });
      }
    }

    const topSpenders = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return success({
      totalCustomers: totalCustomers || 0,
      verifiedCustomers: verifiedCustomers || 0,
      newThisMonth: newThisMonth || 0,
      topSpenders,
    });
  }
);

/**
 * Get inventory insights
 */
export const getInventoryInsights = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Low stock products
    const { data: lowStock } = await supabase
      .from("products")
      .select("id, name, slug, stock_quantity, low_stock_threshold")
      .lte("stock_quantity", 10)
      .order("stock_quantity");

    // Out of stock
    const { count: outOfStock } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("stock_quantity", 0);

    // Total inventory value (commented out due to missing unit_price column in products)
    // const { data: products } = await supabase
    //   .from("products")
    //   .select("stock_quantity, unit_price");

    // const totalInventoryValue =
    //   products?.reduce((sum, p) => sum + (p.stock_quantity ?? 0) * (p.unit_price ?? 0), 0) || 0;
    const totalInventoryValue = 0;

    return success({
      lowStockProducts: lowStock || [],
      outOfStockCount: outOfStock || 0,
      totalInventoryValue,
    });
  }
);

/**
 * Get payment method breakdown
 */
export const getPaymentMethodBreakdown = withErrorHandling(
  async (
    dateRange?: z.infer<typeof dateRangeSchema>
  ): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const validated = dateRange ? dateRangeSchema.parse(dateRange) : null;

    let query = supabase
      .from("orders")
      .select("payment_method, total")
      .eq("payment_status", "paid");

    if (validated) {
      query = query
        .gte("created_at", validated.startDate)
        .lte("created_at", validated.endDate);
    }

    const { data: orders, error: fetchError } = await query;

    if (fetchError) {
      return error("Failed to fetch payment data", ErrorCode.SERVER_ERROR);
    }

    // Aggregate by payment method
    const methodMap = new Map<
      string,
      { method: string; count: number; revenue: number }
    >();

    for (const order of orders || []) {
      const paymentMethod = order.payment_method ?? "unknown";
      const existing = methodMap.get(paymentMethod);
      if (existing) {
        existing.count += 1;
        existing.revenue += order.total;
      } else {
        methodMap.set(paymentMethod, {
          method: paymentMethod,
          count: 1,
          revenue: order.total,
        });
      }
    }

    const breakdown = Array.from(methodMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return success(breakdown);
  }
);
