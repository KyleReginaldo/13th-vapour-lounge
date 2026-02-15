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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Package,
  Plus,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type PurchaseOrder = {
  id: string;
  po_number: string;
  supplier_name: string;
  supplier_id: string;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  total_amount: number;
  items_count: number;
  expected_delivery?: string;
  created_at: string;
  created_by: string;
  notes?: string;
  items: PurchaseOrderItem[];
};

type PurchaseOrderItem = {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
};

type POFilter =
  | "all"
  | "draft"
  | "pending"
  | "approved"
  | "received"
  | "cancelled";

export function PurchaseOrdersManagement() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<POFilter>("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Simulate loading purchase orders
      const mockPOs: PurchaseOrder[] = [
        {
          id: "po1",
          po_number: "PO-2026-001",
          supplier_name: "VUSE Philippines",
          supplier_id: "sup1",
          status: "pending",
          total_amount: 45000,
          items_count: 5,
          expected_delivery: new Date(Date.now() + 7 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          created_by: "Admin",
          notes: "Regular weekly restock order",
          items: [
            {
              id: "i1",
              product_name: "Pebble Disposable",
              product_sku: "VUSE-PEB-001",
              quantity: 50,
              unit_cost: 350,
              total_cost: 17500,
            },
            {
              id: "i2",
              product_name: "ePod 2+ Device",
              product_sku: "VUSE-EPD-001",
              quantity: 20,
              unit_cost: 800,
              total_cost: 16000,
            },
            {
              id: "i3",
              product_name: "ePod Pods Mint",
              product_sku: "VUSE-POD-MT",
              quantity: 30,
              unit_cost: 250,
              total_cost: 7500,
            },
            {
              id: "i4",
              product_name: "Vibe Device",
              product_sku: "VUSE-VIB-001",
              quantity: 5,
              unit_cost: 500,
              total_cost: 2500,
            },
            {
              id: "i5",
              product_name: "Go Max Disposable",
              product_sku: "VUSE-GMX-001",
              quantity: 10,
              unit_cost: 150,
              total_cost: 1500,
            },
          ],
        },
        {
          id: "po2",
          po_number: "PO-2026-002",
          supplier_name: "E-Liquid Direct",
          supplier_id: "sup2",
          status: "approved",
          total_amount: 28000,
          items_count: 3,
          expected_delivery: new Date(Date.now() + 3 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          created_by: "Admin",
          items: [
            {
              id: "i6",
              product_name: "Premium E-Liquid 50ml",
              product_sku: "ELD-PRM-050",
              quantity: 40,
              unit_cost: 400,
              total_cost: 16000,
            },
            {
              id: "i7",
              product_name: "Nic Salt 30ml",
              product_sku: "ELD-NS-030",
              quantity: 30,
              unit_cost: 300,
              total_cost: 9000,
            },
            {
              id: "i8",
              product_name: "Coil Pack 5pc",
              product_sku: "ELD-COL-005",
              quantity: 20,
              unit_cost: 150,
              total_cost: 3000,
            },
          ],
        },
        {
          id: "po3",
          po_number: "PO-2026-003",
          supplier_name: "VUSE Philippines",
          supplier_id: "sup1",
          status: "received",
          total_amount: 32000,
          items_count: 4,
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          created_by: "Admin",
          items: [
            {
              id: "i9",
              product_name: "Pebble Disposable",
              product_sku: "VUSE-PEB-001",
              quantity: 40,
              unit_cost: 350,
              total_cost: 14000,
            },
            {
              id: "i10",
              product_name: "ePod Pods Tobacco",
              product_sku: "VUSE-POD-TB",
              quantity: 25,
              unit_cost: 250,
              total_cost: 6250,
            },
            {
              id: "i11",
              product_name: "Go 700 Disposable",
              product_sku: "VUSE-G7-001",
              quantity: 20,
              unit_cost: 400,
              total_cost: 8000,
            },
            {
              id: "i12",
              product_name: "Pod Cartridge Pack",
              product_sku: "VUSE-PCP-003",
              quantity: 25,
              unit_cost: 150,
              total_cost: 3750,
            },
          ],
        },
      ];

      setPurchaseOrders(mockPOs);
      setFilteredOrders(mockPOs);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Filter orders
  useEffect(() => {
    let filtered = purchaseOrders;
    if (statusFilter !== "all") {
      filtered = filtered.filter((po) => po.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (po) =>
          po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: PurchaseOrder["status"]) => {
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
    return config[status] || { variant: "outline" as const, label: "Unknown" };
  };

  const handleUpdateStatus = (
    poId: string,
    newStatus: PurchaseOrder["status"]
  ) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: newStatus } : po))
    );
    setDetailsOpen(false);
  };

  // Stats
  const pendingCount = purchaseOrders.filter(
    (po) => po.status === "pending"
  ).length;
  const totalPendingValue = purchaseOrders
    .filter((po) => po.status === "pending")
    .reduce((sum, po) => sum + po.total_amount, 0);
  const approvedCount = purchaseOrders.filter(
    (po) => po.status === "approved"
  ).length;
  const receivedThisMonth = purchaseOrders.filter(
    (po) => po.status === "received"
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            Loading purchase orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
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
              {receivedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: POFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
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
        <CardContent>
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
                return (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono font-medium">
                      {po.po_number}
                    </TableCell>
                    <TableCell>{po.supplier_name}</TableCell>
                    <TableCell>{po.items_count} items</TableCell>
                    <TableCell className="font-bold">
                      ₱{po.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {po.expected_delivery ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3" />
                          {new Date(po.expected_delivery).toLocaleDateString()}
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
                      {new Date(po.created_at).toLocaleDateString()}
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
        </CardContent>
      </Card>

      {/* PO Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Purchase Order: {selectedPO?.po_number}</DialogTitle>
            <DialogDescription>
              Supplier: {selectedPO?.supplier_name}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    <Badge variant={getStatusBadge(selectedPO.status).variant}>
                      {getStatusBadge(selectedPO.status).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div>
                    {new Date(selectedPO.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Expected Delivery:
                  </span>
                  <div>
                    {selectedPO.expected_delivery
                      ? new Date(
                          selectedPO.expected_delivery
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPO.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.product_sku}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₱{item.unit_cost.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">
                        ₱{item.total_cost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">
                      Grand Total:
                    </TableCell>
                    <TableCell className="font-bold text-lg">
                      ₱{selectedPO.total_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                {selectedPO.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleUpdateStatus(selectedPO.id, "cancelled")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedPO.id, "approved")
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                  </>
                )}
                {selectedPO.status === "approved" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedPO.id, "received")
                    }
                  >
                    <Package className="h-4 w-4 mr-2" /> Mark as Received
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new order for your supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Supplier</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sup1">VUSE Philippines</SelectItem>
                  <SelectItem value="sup2">E-Liquid Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                Expected Delivery Date
              </label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input placeholder="Additional notes..." />
            </div>
            <p className="text-sm text-muted-foreground">
              After creating, you can add items and submit for approval.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setCreateDialogOpen(false)}>
                Create Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
