"use client";

import {
  assignTrackingNumber,
  cancelOrder,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/app/actions/orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Package,
  Phone,
  Search,
  StickyNote,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sku: string;
};

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  users?: { first_name: string; last_name: string; email: string } | null;
  order_items?: OrderItem[] | null;
};

interface OrdersManagementProps {
  orders: Order[];
}

// Status flow: what action to take next
const STATUS_FLOW: Record<string, { next: string; label: string } | null> = {
  pending: { next: "processing", label: "Start Processing" },
  processing: { next: "packed", label: "Mark Packed" },
  packed: { next: "shipped", label: "Mark Shipped" },
  shipped: { next: "delivered", label: "Mark Delivered" },
  delivered: null,
  cancelled: null,
  refunded: null,
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    color: "text-amber-600",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  processing: {
    label: "Processing",
    variant: "default",
    color: "text-blue-600",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  packed: {
    label: "Packed",
    variant: "default",
    color: "text-indigo-600",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  shipped: {
    label: "Shipped",
    variant: "default",
    color: "text-purple-600",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  delivered: {
    label: "Delivered",
    variant: "default",
    color: "text-green-600",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    color: "text-red-600",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  refunded: {
    label: "Refunded",
    variant: "destructive",
    color: "text-red-600",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const PAYMENT_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  unpaid: { label: "Unpaid", variant: "destructive" },
  pending: { label: "Pending", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
};

const ORDER_STATUSES = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"];

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_CONFIG[status ?? ""] ?? {
    label: "Unknown",
    variant: "outline" as const,
    color: "",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };
  return (
    <Badge variant={cfg.variant} className="gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: string | null }) {
  const cfg = PAYMENT_CONFIG[status ?? ""] ?? {
    label: "Unknown",
    variant: "outline" as const,
  };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function OrdersManagement({ orders }: OrdersManagementProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Dialogs
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editStatusOpen, setEditStatusOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  // Edit form state
  const [newStatus, setNewStatus] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const name =
      `${o.users?.first_name ?? ""} ${o.users?.last_name ?? ""}`.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.users?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || o.payment_status === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) =>
      ["processing", "packed"].includes(o.status ?? "")
    ).length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total, 0),
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const openEditStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status ?? "pending");
    setNewPaymentStatus(order.payment_status ?? "unpaid");
    setEditStatusOpen(true);
  };

  const openCancel = (order: Order) => {
    setSelectedOrder(order);
    setCancelReason("");
    setCancelOpen(true);
  };

  const openTracking = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number ?? "");
    setTrackingOpen(true);
  };

  // Advance to next status in flow (quick action)
  const handleAdvanceStatus = async (order: Order) => {
    const next = STATUS_FLOW[order.status ?? ""]?.next;
    if (!next) return;
    // For shipping: open tracking dialog
    if (next === "shipped") {
      openTracking(order);
      return;
    }
    setIsUpdating(true);
    const result = await updateOrderStatus(order.id, next);
    setIsUpdating(false);
    if (result.success) {
      toast.success(`Order advanced to ${next}`);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to update status");
    }
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    let ok = true;
    if (newStatus !== selectedOrder.status) {
      const r = await updateOrderStatus(selectedOrder.id, newStatus);
      if (!r.success) {
        toast.error(r.message ?? "Failed to update order status");
        ok = false;
      }
    }
    if (ok && newPaymentStatus !== selectedOrder.payment_status) {
      const r = await updatePaymentStatus(selectedOrder.id, newPaymentStatus);
      if (!r.success) {
        toast.error(r.message ?? "Failed to update payment status");
        ok = false;
      }
    }
    setIsUpdating(false);
    if (ok) {
      toast.success("Order updated");
      setEditStatusOpen(false);
      router.refresh();
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    setIsUpdating(true);
    const result = await cancelOrder(selectedOrder.id, cancelReason);
    setIsUpdating(false);
    if (result.success) {
      toast.success("Order cancelled");
      setCancelOpen(false);
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to cancel order");
    }
  };

  const handleAssignTracking = async () => {
    if (!selectedOrder || !trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    setIsUpdating(true);
    const result = await assignTrackingNumber(selectedOrder.id, trackingNumber);
    setIsUpdating(false);
    if (result.success) {
      toast.success("Tracking number assigned — order marked as shipped");
      setTrackingOpen(false);
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to assign tracking number");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer orders and track their fulfilment status
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Total Orders",
            value: stats.total,
            icon: <Package className="h-4 w-4 text-muted-foreground" />,
            color: "",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <Clock className="h-4 w-4 text-amber-500" />,
            color: "text-amber-600",
          },
          {
            label: "Processing",
            value: stats.processing,
            icon: <Package className="h-4 w-4 text-blue-500" />,
            color: "text-blue-600",
          },
          {
            label: "Shipped",
            value: stats.shipped,
            icon: <Truck className="h-4 w-4 text-purple-500" />,
            color: "text-purple-600",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
            color: "text-green-600",
          },
          {
            label: "Revenue (Paid)",
            value: formatCurrency(stats.totalRevenue),
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
            color: "text-green-700",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              {s.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Order status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_CONFIG[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PAYMENT_CONFIG[s]?.label ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Orders{" "}
            <span className="text-muted-foreground font-normal text-base">
              ({filteredOrders.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-30" />
                      <p>
                        {searchTerm ||
                        statusFilter !== "all" ||
                        paymentFilter !== "all"
                          ? "No orders match your filters."
                          : "No orders yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const nextStep = STATUS_FLOW[order.status ?? ""];
                  const canCancel = ![
                    "delivered",
                    "cancelled",
                    "refunded",
                  ].includes(order.status ?? "");
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-mono font-semibold text-sm">
                          {order.order_number}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          #{order.id.slice(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {order.users?.first_name} {order.users?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.users?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {order.order_items?.length ?? 0} item(s)
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {formatCurrency(order.total)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PaymentBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(
                            order.created_at ?? ""
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at ?? "").toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => openDetails(order)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {nextStep && (
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1"
                              disabled={isUpdating}
                              onClick={() => handleAdvanceStatus(order)}
                            >
                              {nextStep.label}
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openCancel(order)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Order Details Dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono">{selectedOrder?.order_number}</span>
              <StatusBadge status={selectedOrder?.status ?? null} />
              <PaymentBadge status={selectedOrder?.payment_status ?? null} />
            </DialogTitle>
            <DialogDescription>
              Placed{" "}
              {selectedOrder?.created_at
                ? new Date(selectedOrder.created_at).toLocaleString()
                : "—"}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 mt-2">
              {/* Customer */}
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Customer
                </h3>
                <p className="text-sm">
                  {selectedOrder.users?.first_name}{" "}
                  {selectedOrder.users?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.users?.email}
                </p>
              </div>

              {/* Shipping */}
              {(selectedOrder.shipping_address_line1 ||
                selectedOrder.shipping_full_name) && (
                <div className="rounded-lg border p-4 space-y-1">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </h3>
                  {selectedOrder.shipping_full_name && (
                    <p className="text-sm font-medium">
                      {selectedOrder.shipping_full_name}
                    </p>
                  )}
                  {selectedOrder.shipping_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.shipping_phone}
                    </p>
                  )}
                  {selectedOrder.shipping_address_line1 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address_line1}
                      {selectedOrder.shipping_address_line2
                        ? `, ${selectedOrder.shipping_address_line2}`
                        : ""}
                    </p>
                  )}
                  {selectedOrder.shipping_city && (
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_city}
                      {selectedOrder.shipping_postal_code
                        ? ` ${selectedOrder.shipping_postal_code}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {/* Tracking */}
              {selectedOrder.tracking_number && (
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Truck className="h-4 w-4" /> Tracking Number
                    </p>
                    <p className="text-sm font-mono mt-1">
                      {selectedOrder.tracking_number}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openTracking(selectedOrder)}
                  >
                    Update
                  </Button>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/40 border-b">
                  <h3 className="text-sm font-semibold">Order Items</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedOrder.order_items ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {item.sku}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Totals */}
                <div className="px-4 py-3 space-y-1.5 border-t bg-muted/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {(selectedOrder.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>
                        −{formatCurrency(selectedOrder.discount ?? 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {formatCurrency(selectedOrder.shipping_cost ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder.customer_notes ||
                selectedOrder.delivery_instructions) && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <StickyNote className="h-4 w-4" /> Notes
                  </h3>
                  {selectedOrder.customer_notes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Customer:{" "}
                      </span>
                      {selectedOrder.customer_notes}
                    </p>
                  )}
                  {selectedOrder.delivery_instructions && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Delivery:{" "}
                      </span>
                      {selectedOrder.delivery_instructions}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-wrap gap-2 mt-4">
            {selectedOrder &&
              !["delivered", "cancelled", "refunded"].includes(
                selectedOrder.status ?? ""
              ) && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailsOpen(false);
                    openCancel(selectedOrder);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancel Order
                </Button>
              )}
            {selectedOrder &&
              (selectedOrder.status === "packed" ||
                !selectedOrder.tracking_number) &&
              selectedOrder.status !== "delivered" &&
              selectedOrder.status !== "cancelled" && (
                <Button
                  variant="outline"
                  onClick={() => openTracking(selectedOrder)}
                >
                  <Truck className="h-4 w-4 mr-2" /> Set Tracking
                </Button>
              )}
            <Button
              variant="outline"
              onClick={() => {
                setDetailsOpen(false);
                if (selectedOrder) openEditStatus(selectedOrder);
              }}
            >
              Edit Status
            </Button>
            {selectedOrder && STATUS_FLOW[selectedOrder.status ?? ""] && (
              <Button
                disabled={isUpdating}
                onClick={() => {
                  setDetailsOpen(false);
                  if (selectedOrder) handleAdvanceStatus(selectedOrder);
                }}
              >
                {STATUS_FLOW[selectedOrder.status ?? ""]?.label}{" "}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Status Dialog ── */}
      <Dialog open={editStatusOpen} onOpenChange={setEditStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order Status</DialogTitle>
            <DialogDescription>
              Manually set the order and payment status for{" "}
              <strong>{selectedOrder?.order_number}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select
                value={newPaymentStatus}
                onValueChange={setNewPaymentStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PAYMENT_CONFIG[s]?.label ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditStatusOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Tracking Number Dialog ── */}
      <Dialog open={trackingOpen} onOpenChange={setTrackingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tracking Number</DialogTitle>
            <DialogDescription>
              Enter the courier tracking number for{" "}
              <strong>{selectedOrder?.order_number}</strong>. The order will be
              automatically marked as Shipped.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="tracking">Tracking Number</Label>
            <Input
              id="tracking"
              placeholder="e.g. JRS-2026-00001234"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackingOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTracking}
              disabled={isUpdating || !trackingNumber.trim()}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" /> Ship Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Order Confirmation ── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel <strong>{selectedOrder?.order_number}</strong>? This cannot
              be undone for delivered orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              className="mt-1"
              placeholder="e.g. Customer requested cancellation, out of stock…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={isUpdating || !cancelReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? "Cancelling…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
