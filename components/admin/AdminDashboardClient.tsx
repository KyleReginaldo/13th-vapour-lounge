"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

interface DashboardStatsProps {
  stats: {
    productCount: number;
    userCount: number;
    pendingOrders: number;
    lowStockCount: number;
    todaySales: number;
    totalOrders: number;
    averageOrderValue: number;
    recentActivity: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      created_at: string | null;
      is_read: boolean | null;
      link: string | null;
    }>;
  };
  userName: string;
  isAdmin?: boolean;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  trend?: { value: string; positive: boolean };
  badge?: { text: string; variant: "default" | "destructive" | "secondary" };
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {badge && (
          <Badge variant={badge.variant} className="ml-2">
            {badge.text}
          </Badge>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
      {trend && (
        <div
          className={`text-xs mt-2 flex items-center ${
            trend.positive ? "text-green-600" : "text-red-600"
          }`}
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          {trend.value}
        </div>
      )}
    </CardContent>
  </Card>
);

export function AdminDashboardClient({
  stats,
  userName,
  isAdmin = false,
}: DashboardStatsProps) {
  const allQuickActions = [
    {
      title: "Add Product",
      href: "/admin/products",
      icon: Plus,
      description: "Add new products to inventory",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "View Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      description: "Manage customer orders",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "POS System",
      href: "/admin/pos",
      icon: Package,
      description: "Point of sale terminal",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: TrendingUp,
      description: "View analytics and reports",
      color: "bg-orange-600 hover:bg-orange-700",
      adminOnly: true,
    },
  ];

  const quickActions = allQuickActions.filter(
    (action) => !action.adminOnly || isAdmin
  );

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.todaySales)}
          description="Today's earnings"
          icon={DollarSign}
          // trend={{ value: "+12.5% from yesterday", positive: true }}
        />

        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          description="Lifetime orders"
          icon={ShoppingCart}
          // trend={{ value: `${stats.pendingOrders} pending`, positive: false }}
        />

        <StatCard
          title="Products"
          value={stats.productCount}
          description="Active inventory items"
          icon={ShoppingBag}
          badge={
            stats.lowStockCount > 0
              ? {
                  text: `${stats.lowStockCount} low stock`,
                  variant: "destructive",
                }
              : undefined
          }
        />

        <StatCard
          title="Customers"
          value={stats.userCount}
          description="Registered users"
          icon={Users}
          // trend={{ value: "+5.2% this month", positive: true }}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Average Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on completed orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              {stats.pendingOrders > 0 && (
                <Badge variant="secondary">Action needed</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.lowStockCount}</div>
              {stats.lowStockCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Low
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Items below threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts to get things done faster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                asChild
                size="lg"
                className={`h-auto flex-col gap-2 p-6 ${action.color}`}
              >
                <Link href={action.href}>
                  <action.icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-90">
                      {action.description}
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New order received</p>
                <p className="text-xs text-muted-foreground">
                  Order #ORD-12345 - ₱1,250.00
                </p>
              </div>
              <div className="text-xs text-muted-foreground">2 min ago</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Product updated</p>
                <p className="text-xs text-muted-foreground">
                  JUUL Classic Pod - Price changed
                </p>
              </div>
              <div className="text-xs text-muted-foreground">15 min ago</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Low stock alert</p>
                <p className="text-xs text-muted-foreground">
                  RELX Pod Mint - 3 units remaining
                </p>
              </div>
              <div className="text-xs text-muted-foreground">1 hour ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
