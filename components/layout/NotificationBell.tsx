"use client";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/app/actions/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BellIcon } from "@heroicons/react/24/outline";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCheck,
  Clock,
  PackageX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NotificationBellProps {
  initialUnreadCount: number;
  isStaff?: boolean;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "low_stock":
      return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    case "critical_stock":
      return <AlertOctagon className="h-4 w-4 text-orange-500 shrink-0" />;
    case "out_of_stock":
      return <PackageX className="h-4 w-4 text-red-500 shrink-0" />;
    case "expiring_stock":
      return <Clock className="h-4 w-4 text-amber-500 shrink-0" />;
    default:
      return <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell({
  initialUnreadCount,
  isStaff = false,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getNotifications()
      .then((res) => {
        if (res.success && res.data) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter((n) => !n.is_read).length);
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleClickNotification(notification: NotificationRow) {
    // Mark as read
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    // Navigate to link
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
        read_at: n.read_at ?? new Date().toISOString(),
      }))
    );
    setUnreadCount(0);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none">
          <BellIcon className="h-6 w-6 text-gray-600" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gray-300" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0 shadow-lg"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-md">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-800">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 gap-1 px-2"
              onClick={(e) => {
                e.preventDefault();
                handleMarkAllRead();
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-105">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center">
              <BellIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer rounded-none focus:bg-blue-50 ${
                    !n.is_read ? "bg-blue-50/60" : "bg-white"
                  }`}
                  onClick={() => handleClickNotification(n)}
                >
                  {/* Type Icon */}
                  <div className="mt-0.5">{getTypeIcon(n.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          !n.is_read
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed whitespace-normal">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && isStaff && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="px-4 py-2 bg-gray-50 rounded-b-md">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setOpen(false);
                  router.push("/admin/inventory");
                }}
              >
                View Inventory
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
