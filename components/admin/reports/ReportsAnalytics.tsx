"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePaymentMethodBreakdown,
  useSalesOverview,
  useTopProducts,
  type DateRange,
} from "@/lib/hooks/useAnalytics";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type TimePeriod = "today" | "week" | "month" | "year" | "custom";

function getDateRangeForPeriod(period: TimePeriod): DateRange | undefined {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
  };
}

export function ReportsAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const dateRange = useMemo(() => {
    if (period === "custom") {
      if (!customFrom || !customTo) return undefined;
      return {
        startDate: new Date(customFrom).toISOString(),
        endDate: new Date(customTo + "T23:59:59").toISOString(),
      };
    }
    return getDateRangeForPeriod(period);
  }, [period, customFrom, customTo]);

  // Fetch analytics data
  const { data: salesOverview, isLoading: loadingSales } =
    useSalesOverview(dateRange);
  const { data: topProducts, isLoading: loadingProducts } = useTopProducts(
    5,
    dateRange
  );
  const { data: paymentBreakdown, isLoading: loadingPayments } =
    usePaymentMethodBreakdown(dateRange);

  // Fetch recent orders
  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["recent-orders", 10],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          total,
          status,
          created_at,
          users:user_id (
            id,
            email,
            full_name
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const isLoading =
    loadingSales || loadingProducts || loadingPayments || loadingOrders;

  // Calculate unique customers from recent orders
  const uniqueCustomers = useMemo(() => {
    if (!recentOrders) return 0;
    const userIds = new Set(
      recentOrders.map((order: any) => order.users?.id).filter(Boolean)
    );
    return userIds.size;
  }, [recentOrders]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics for your business
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={period}
            onValueChange={(value: TimePeriod) => setPeriod(value)}
          >
            <SelectTrigger className="w-45">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{(salesOverview?.totalRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {salesOverview?.paidOrders || 0} paid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesOverview?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesOverview?.pendingOrders || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{(salesOverview?.averageOrderValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique buyers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Selling Products
            </CardTitle>
            <CardDescription>Best performers by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product: any, index: number) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-bold">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.totalQuantity}</TableCell>
                      <TableCell className="font-bold">
                        ₱{product.totalRevenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No product sales data available for this period
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.order_number ||
                          `ORD-${order.id.substring(0, 8)}`}
                      </TableCell>
                      <TableCell>
                        {order.users?.full_name ||
                          order.users?.email?.split("@")[0] ||
                          "Guest"}
                      </TableCell>
                      <TableCell className="font-bold">
                        ₱{order.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "default"
                              : order.status === "processing"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent orders found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Payment Method</CardTitle>
          <CardDescription>Revenue breakdown by payment type</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentBreakdown && paymentBreakdown.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paymentBreakdown.map((payment: any, index: number) => {
                const colors = [
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-purple-500",
                  "bg-orange-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                ];
                return (
                  <div key={payment.paymentMethod} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">
                        {payment.paymentMethod || "Unknown"}
                      </span>
                      <span className="text-muted-foreground">
                        {payment.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${payment.percentage}%` }}
                      />
                    </div>
                    <div className="text-sm font-bold">
                      ₱{payment.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No payment data available for this period
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
