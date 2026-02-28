"use client";

import { markAllNotificationsRead } from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Package,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

interface Props {
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  currentType?: string;
  currentRead?: string;
  currentFrom?: string;
  currentTo?: string;
}

const TYPE_LABELS: Record<string, string> = {
  new_order: "New Order",
  pos_sale: "POS Sale",
  clock_in: "Clock In",
  clock_out: "Clock Out",
  cash_discrepancy: "Cash Discrepancy",
  staff_created: "Staff Created",
  role_changed: "Role Changed",
  inventory_adjusted: "Inventory",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
  critical_stock: "Critical Stock",
  expiring_stock: "Expiring Stock",
};

function notifIcon(type: string) {
  switch (type) {
    case "new_order":
      return <ShoppingCart className="h-4 w-4" />;
    case "pos_sale":
      return <Wallet className="h-4 w-4" />;
    case "clock_in":
    case "clock_out":
      return <Clock className="h-4 w-4" />;
    case "cash_discrepancy":
      return <AlertTriangle className="h-4 w-4" />;
    case "staff_created":
    case "role_changed":
      return <Users className="h-4 w-4" />;
    case "low_stock":
    case "out_of_stock":
    case "critical_stock":
    case "expiring_stock":
    case "inventory_adjusted":
      return <Package className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function notifColor(type: string): string {
  switch (type) {
    case "cash_discrepancy":
    case "out_of_stock":
    case "critical_stock":
      return "text-red-600 bg-red-50";
    case "low_stock":
    case "expiring_stock":
      return "text-yellow-600 bg-yellow-50";
    case "new_order":
      return "text-purple-600 bg-purple-50";
    case "pos_sale":
      return "text-blue-600 bg-blue-50";
    case "clock_in":
      return "text-green-600 bg-green-50";
    case "clock_out":
      return "text-indigo-600 bg-indigo-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationsPage({
  notifications,
  total,
  page,
  pageSize,
  currentType,
  currentRead,
  currentFrom,
  currentTo,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      type: currentType,
      read: currentRead,
      from: currentFrom,
      to: currentTo,
      page: String(page),
      ...overrides,
    };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    return `/admin/notifications?${p.toString()}`;
  }

  function navigate(overrides: Record<string, string | undefined>) {
    router.push(buildUrl(overrides));
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (res?.success) {
        toast.success("All notifications marked as read");
        router.refresh();
      } else {
        toast.error("Failed to mark notifications as read");
      }
    });
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {total} total &mdash; {unreadCount} unread on this page
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={isPending}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark All Read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            Type
          </label>
          <Select
            value={currentType ?? "all"}
            onValueChange={(v) =>
              navigate({ type: v === "all" ? undefined : v, page: "1" })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            Status
          </label>
          <Select
            value={currentRead ?? "all"}
            onValueChange={(v) =>
              navigate({ read: v === "all" ? undefined : v, page: "1" })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="false">Unread</SelectItem>
              <SelectItem value="true">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            From
          </label>
          <Input
            type="date"
            className="w-36"
            defaultValue={currentFrom ?? ""}
            onChange={(e) =>
              navigate({ from: e.target.value || undefined, page: "1" })
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase">
            To
          </label>
          <Input
            type="date"
            className="w-36"
            defaultValue={currentTo ?? ""}
            onChange={(e) =>
              navigate({ to: e.target.value || undefined, page: "1" })
            }
          />
        </div>

        {(currentType || currentRead || currentFrom || currentTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/notifications")}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""} (page {page} of {totalPages}
            )
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-30" />
              <p>No notifications found</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/30",
                    !n.is_read && "bg-muted/10"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      notifColor(n.type)
                    )}
                  >
                    {notifIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          !n.is_read && "font-semibold"
                        )}
                      >
                        {n.title}
                      </span>
                      <Badge variant="outline" className="text-xs py-0">
                        {TYPE_LABELS[n.type] ?? n.type}
                      </Badge>
                      {!n.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {n.message}
                    </p>
                  </div>

                  {/* Right column */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(n.created_at)}
                    </span>
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigate({ page: String(page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
