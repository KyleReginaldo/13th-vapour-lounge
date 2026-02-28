"use client";

import {
  createPurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
} from "@/app/actions/purchase-orders";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconInput } from "@/components/ui/icon-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Supplier = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  base_price: number;
};

type POItem = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  products?: { id: string; name: string } | null;
};

type PurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string | null;
  subtotal: number;
  tax: number | null;
  total: number;
  expected_delivery_date: string | null;
  created_at: string | null;
  notes: string | null;
  suppliers?: { id: string; name: string } | null;
  users?: { first_name: string; last_name: string } | null;
  purchase_order_items?: POItem[];
};

type POFilter =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "received"
  | "cancelled";

type LineItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export function PurchaseOrdersManagement({
  initialOrders = [],
  suppliers = [],
  products = [],
}: {
  initialOrders?: PurchaseOrder[];
  suppliers?: Supplier[];
  products?: Product[];
}) {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] =
    useState<PurchaseOrder[]>(initialOrders);
  const [filteredOrders, setFilteredOrders] =
    useState<PurchaseOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<POFilter>("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create PO form state
  const [supplierId, setSupplierId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product_id: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    setPurchaseOrders(initialOrders);
    setFilteredOrders(initialOrders);
  }, [initialOrders]);

  // Filter orders
  useEffect(() => {
    let filtered = purchaseOrders;
    if (statusFilter !== "all") {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.po_number.toLowerCase().includes(lower) ||
          po.suppliers?.name?.toLowerCase().includes(lower)
      );
    }
    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: string | null) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      draft: { variant: "outline", label: "Draft" },
      pending: { variant: "secondary", label: "Pending Approval" },
      approved: { variant: "default", label: "Approved" },
      received: { variant: "default", label: "Received" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    return (
      config[status ?? ""] || { variant: "outline" as const, label: "Unknown" }
    );
  };

  // Line item helpers
  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      { product_id: "", quantity: 1, unit_price: 0 },
    ]);

  const removeLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const updateLineItem = (
    idx: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        // Auto-fill unit price from product
        if (field === "product_id") {
          const product = products.find((p) => p.id === value);
          if (product) updated.unit_price = product.base_price;
        }
        return updated;
      })
    );
  };

  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const resetCreateForm = () => {
    setSupplierId("");
    setExpectedDelivery("");
    setPoNotes("");
    setLineItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
  };

  // Create PO
  const handleCreatePO = async () => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    const validItems = lineItems.filter(
      (item) => item.product_id && item.quantity > 0 && item.unit_price > 0
    );
    if (validItems.length === 0) {
      toast.error("Add at least one product line item");
      return;
    }

    setIsSubmitting(true);

    const result = await createPurchaseOrder({
      supplier_id: supplierId,
      expected_delivery_date: expectedDelivery
        ? new Date(expectedDelivery).toISOString()
        : null,
      items: validItems,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Purchase order created");
      setCreateDialogOpen(false);
      resetCreateForm();
      router.refresh();
    } else {
      toast.error(result.message || "Failed to create purchase order");
    }
  };

  // Approve PO
  const handleApprove = async (id: string) => {
    setIsSubmitting(true);
    const result = await updatePurchaseOrderStatus(id, "approved");
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Purchase order approved");
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message || "Failed to approve");
    }
  };

  // Mark as received (updates inventory automatically)
  const handleReceive = async (id: string) => {
    setIsSubmitting(true);
    const result = await receivePurchaseOrder(id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Purchase order received — inventory updated");
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message || "Failed to receive");
    }
  };

  // Cancel PO
  const handleCancel = async () => {
    if (!selectedPO) return;
    setIsSubmitting(true);
    const result = await deletePurchaseOrder(selectedPO.id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Purchase order cancelled");
      setCancelDialogOpen(false);
      setDetailsOpen(false);
      setSelectedPO(null);
      router.refresh();
    } else {
      toast.error(result.message || "Failed to cancel");
    }
  };

  // Stats
  const pendingCount = purchaseOrders.filter(
    (po) => po.status === "pending"
  ).length;
  const totalPendingValue = purchaseOrders
    .filter((po) => po.status === "pending")
    .reduce((sum, po) => sum + po.total, 0);
  const approvedCount = purchaseOrders.filter(
    (po) => po.status === "approved"
  ).length;
  const receivedCount = purchaseOrders.filter(
    (po) => po.status === "received"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              ₱{totalPendingValue.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {receivedCount}
            </div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOrders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <IconInput
          icon={Search}
          containerClassName="flex-1"
          placeholder="Search PO number or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={statusFilter}
          onValueChange={(value: POFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            Manage supplier orders and deliveries
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No purchase orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((po) => {
                  const statusInfo = getStatusBadge(po.status);
                  const itemCount = po.purchase_order_items?.length ?? 0;
                  return (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono font-medium">
                        {po.po_number}
                      </TableCell>
                      <TableCell>
                        {po.suppliers?.name ?? "Unknown Supplier"}
                      </TableCell>
                      <TableCell>{itemCount} item(s)</TableCell>
                      <TableCell className="font-bold">
                        ₱{po.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {po.expected_delivery_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Truck className="h-3 w-3" />
                            {new Date(
                              po.expected_delivery_date
                            ).toLocaleDateString()}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {po.created_at
                          ? new Date(po.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPO(po);
                            setDetailsOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PO Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order: {selectedPO?.po_number}</DialogTitle>
            <DialogDescription>
              Supplier: {selectedPO?.suppliers?.name ?? "-"}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    <Badge variant={getStatusBadge(selectedPO.status).variant}>
                      {getStatusBadge(selectedPO.status).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="mt-1 font-medium">
                    {selectedPO.created_at
                      ? new Date(selectedPO.created_at).toLocaleDateString()
                      : "-"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Expected Delivery:
                  </span>
                  <div className="mt-1 font-medium">
                    {selectedPO.expected_delivery_date
                      ? new Date(
                          selectedPO.expected_delivery_date
                        ).toLocaleDateString()
                      : "TBD"}
                  </div>
                </div>
              </div>

              {selectedPO.notes && (
                <div className="text-sm bg-muted p-3 rounded">
                  <span className="font-medium">Notes:</span> {selectedPO.notes}
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedPO.purchase_order_items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.products?.name ?? "Unknown Product"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{item.unit_cost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₱{item.subtotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-right text-muted-foreground"
                    >
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right">
                      ₱{selectedPO.subtotal.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {selectedPO.tax != null && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-right text-muted-foreground"
                      >
                        Tax (12%)
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{selectedPO.tax.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">
                      Grand Total
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      ₱{selectedPO.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                {selectedPO.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      disabled={isSubmitting}
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      onClick={() => handleApprove(selectedPO.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}
                {selectedPO.status === "approved" && (
                  <>
                    <Button
                      variant="destructive"
                      disabled={isSubmitting}
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      onClick={() => handleReceive(selectedPO.id)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Processing..." : "Mark as Received"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel{" "}
              <strong>{selectedPO?.po_number}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Cancelling..." : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create PO Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetCreateForm();
          setCreateDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for your supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Supplier + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="Additional notes for this order..."
                rows={2}
              />
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Items *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Unit Cost (₱)</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="p-1">
                          <select
                            className="w-full h-8 px-2 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                            value={item.product_id}
                            onChange={(e) =>
                              updateLineItem(idx, "product_id", e.target.value)
                            }
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                                {p.sku ? ` (${p.sku})` : ""}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-8 text-sm"
                            placeholder="1"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-sm"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right font-medium text-sm">
                          ₱
                          {(item.quantity * item.unit_price).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </TableCell>
                        <TableCell className="p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeLineItem(idx)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-8 text-sm pr-4">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">
                  ₱
                  {lineItemsTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-end gap-8 text-sm pr-4">
                <span className="text-muted-foreground">Tax (12%):</span>
                <span className="font-semibold">
                  ₱
                  {(lineItemsTotal * 0.12).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-end gap-8 text-base pr-4 border-t pt-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-primary">
                  ₱
                  {(lineItemsTotal * 1.12).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetCreateForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePO} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Purchase Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
