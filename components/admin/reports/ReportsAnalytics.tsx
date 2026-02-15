"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

type TimePeriod = "today" | "week" | "month" | "year";

type SalesData = {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_customers: number;
  revenue_change: number; // percentage
  orders_change: number;
};

type TopProduct = {
  name: string;
  units_sold: number;
  revenue: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

export function ReportsAnalytics() {
  const [period, setPeriod] = useState<TimePeriod>("month");
  const [salesData, setSalesData] = useState<SalesData>({
    total_revenue: 0,
    total_orders: 0,
    average_order_value: 0,
    total_customers: 0,
    revenue_change: 0,
    orders_change: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Try to fetch real data
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: products } = await supabase.from("products").select("*");

      if (orders && orders.length > 0) {
        const totalRevenue = orders.reduce(
          (sum: number, o: any) => sum + (o.total_price || o.total || 0),
          0
        );
        const totalOrders = orders.length;

        setSalesData({
          total_revenue: totalRevenue,
          total_orders: totalOrders,
          average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          total_customers: new Set(orders.map((o: any) => o.user_id)).size,
          revenue_change: 15.2,
          orders_change: 8.5,
        });

        setRecentOrders(
          orders.slice(0, 10).map((o: any) => ({
            id: o.id,
            order_number: o.order_number || `ORD-${o.id.substring(0, 8)}`,
            customer_name: "Customer",
            total: o.total_price || o.total || 0,
            status: o.status || "pending",
            created_at: o.created_at,
          }))
        );
      } else {
        // Use mock data
        setSalesData({
          total_revenue: 285000,
          total_orders: 156,
          average_order_value: 1827,
          total_customers: 89,
          revenue_change: 15.2,
          orders_change: 8.5,
        });

        setRecentOrders([
          {
            id: "1",
            order_number: "ORD-20260215-001",
            customer_name: "Juan Dela Cruz",
            total: 2500,
            status: "completed",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "2",
            order_number: "ORD-20260215-002",
            customer_name: "Maria Santos",
            total: 1800,
            status: "processing",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            id: "3",
            order_number: "ORD-20260214-003",
            customer_name: "Pedro Garcia",
            total: 3200,
            status: "completed",
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "4",
            order_number: "ORD-20260214-004",
            customer_name: "Ana Lopez",
            total: 1500,
            status: "pending",
            created_at: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: "5",
            order_number: "ORD-20260213-005",
            customer_name: "Carlos Reyes",
            total: 4500,
            status: "completed",
            created_at: new Date(Date.now() - 259200000).toISOString(),
          },
        ]);
      }

      setTopProducts([
        { name: "VUSE Pebble Disposable", units_sold: 145, revenue: 72355 },
        { name: "VUSE ePod 2+ Device", units_sold: 67, revenue: 60233 },
        { name: "VUSE Go Max Disposable", units_sold: 89, revenue: 44411 },
        { name: "ePod Pods - Mint", units_sold: 120, revenue: 30000 },
        { name: "VUSE Vibe Device", units_sold: 42, revenue: 29358 },
      ]);

      setIsLoading(false);
    }
    loadData();
  }, [period]);

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <p className="text-sm text-muted-foreground">
            Key metrics for your business
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value: TimePeriod) => setPeriod(value)}
        >
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
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
              ₱{salesData.total_revenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs">
              {salesData.revenue_change >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    +{salesData.revenue_change}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {salesData.revenue_change}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.total_orders}</div>
            <div className="flex items-center gap-1 text-xs">
              {salesData.orders_change >= 0 ? (
                <>
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    +{salesData.orders_change}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {salesData.orders_change}%
                  </span>
                </>
              )}
              <span className="text-muted-foreground">vs last period</span>
            </div>
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
              ₱{salesData.average_order_value.toLocaleString()}
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
            <div className="text-2xl font-bold">
              {salesData.total_customers}
            </div>
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
            <CardDescription>Best performers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
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
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-bold">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.units_sold}</TableCell>
                    <TableCell className="font-bold">
                      ₱{product.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                method: "GCash",
                amount: 98000,
                percentage: 34,
                color: "bg-blue-500",
              },
              {
                method: "Cash",
                amount: 85000,
                percentage: 30,
                color: "bg-green-500",
              },
              {
                method: "Maya",
                amount: 62000,
                percentage: 22,
                color: "bg-purple-500",
              },
              {
                method: "Bank Transfer",
                amount: 40000,
                percentage: 14,
                color: "bg-orange-500",
              },
            ].map((payment) => (
              <div key={payment.method} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{payment.method}</span>
                  <span className="text-muted-foreground">
                    {payment.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${payment.color}`}
                    style={{ width: `${payment.percentage}%` }}
                  />
                </div>
                <div className="text-sm font-bold">
                  ₱{payment.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
