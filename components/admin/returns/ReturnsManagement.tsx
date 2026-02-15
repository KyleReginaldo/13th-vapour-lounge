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
  Clock,
  DollarSign,
  FileText,
  Filter,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type Return = {
  id: string;
  return_number: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  quantity: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed" | "refunded";
  refund_amount?: number;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
};

type ReturnFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "refunded";

export function ReturnsManagement() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnFilter>("pending");
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const mockReturns: Return[] = [
        {
          id: "ret1",
          return_number: "RET-2026-001",
          order_number: "ORD-20260210-001",
          customer_name: "Juan Dela Cruz",
          customer_email: "juan@example.com",
          product_name: "VUSE Pebble Disposable",
          quantity: 1,
          reason: "Defective device - not charging properly",
          status: "pending",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          refund_amount: 499,
        },
        {
          id: "ret2",
          return_number: "RET-2026-002",
          order_number: "ORD-20260208-003",
          customer_name: "Maria Santos",
          customer_email: "maria@example.com",
          product_name: "VUSE ePod 2+ Device",
          quantity: 1,
          reason: "Wrong item delivered",
          status: "approved",
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          processed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          refund_amount: 899,
        },
        {
          id: "ret3",
          return_number: "RET-2026-003",
          order_number: "ORD-20260205-005",
          customer_name: "Pedro Garcia",
          customer_email: "pedro@example.com",
          product_name: "ePod Pods Pack (Mint)",
          quantity: 2,
          reason: "Changed my mind",
          status: "rejected",
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          processed_at: new Date(Date.now() - 6 * 86400000).toISOString(),
          notes: "Pod packs are non-returnable after opening",
        },
        {
          id: "ret4",
          return_number: "RET-2026-004",
          order_number: "ORD-20260201-002",
          customer_name: "Ana Lopez",
          customer_email: "ana@example.com",
          product_name: "VUSE Vibe Device",
          quantity: 1,
          reason: "Device stopped working within warranty",
          status: "refunded",
          created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          processed_at: new Date(Date.now() - 12 * 86400000).toISOString(),
          refund_amount: 699,
        },
      ];

      setReturns(mockReturns);
      setFilteredReturns(mockReturns.filter((r) => r.status === "pending"));
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = returns;
    if (statusFilter !== "all")
      filtered = filtered.filter((r) => r.status === statusFilter);
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredReturns(filtered);
  }, [returns, searchTerm, statusFilter]);

  const getStatusBadge = (status: Return["status"]) => {
    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "secondary", label: "Pending Review" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      completed: { variant: "default", label: "Completed" },
      refunded: { variant: "outline", label: "Refunded" },
    };
    return config[status] || { variant: "outline" as const, label: "Unknown" };
  };

  const handleUpdateStatus = (
    id: string,
    newStatus: Return["status"],
    notes?: string
  ) => {
    setReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: newStatus,
              processed_at: new Date().toISOString(),
              processed_by: "admin",
              notes: notes || r.notes,
            }
          : r
      )
    );
    setDetailsOpen(false);
    setRejectionReason("");
  };

  const pendingCount = returns.filter((r) => r.status === "pending").length;
  const approvedCount = returns.filter((r) => r.status === "approved").length;
  const refundedAmount = returns
    .filter((r) => r.status === "refunded")
    .reduce((sum, r) => sum + (r.refund_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Returns
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs review</p>
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
            <p className="text-xs text-muted-foreground">Awaiting return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Refunded
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{refundedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returns.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by return #, order #, customer, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: ReturnFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Returns</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returns Management</CardTitle>
          <CardDescription>
            Process customer returns and refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return #</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((ret) => {
                const statusInfo = getStatusBadge(ret.status);
                return (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono font-medium">
                      {ret.return_number}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {ret.order_number}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ret.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {ret.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>{ret.product_name}</TableCell>
                    <TableCell>{ret.quantity}</TableCell>
                    <TableCell className="max-w-48 truncate">
                      {ret.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ret.refund_amount
                        ? `₱${ret.refund_amount.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReturn(ret);
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

      {/* Return Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return: {selectedReturn?.return_number}</DialogTitle>
            <DialogDescription>
              Order: {selectedReturn?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-medium">
                    {selectedReturn.customer_name}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Product:</span>
                  <div className="font-medium">
                    {selectedReturn.product_name} (x{selectedReturn.quantity})
                  </div>
                </div>
              </div>
              <div className="bg-muted p-3 rounded text-sm">
                <span className="font-medium">Reason:</span>{" "}
                {selectedReturn.reason}
              </div>
              {selectedReturn.notes && (
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  <span className="font-medium">Notes:</span>{" "}
                  {selectedReturn.notes}
                </div>
              )}
              {selectedReturn.refund_amount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Refund Amount:</span>{" "}
                  <span className="font-bold">
                    ₱{selectedReturn.refund_amount.toLocaleString()}
                  </span>
                </div>
              )}

              {selectedReturn.status === "pending" && (
                <div className="space-y-3 border-t pt-4">
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleUpdateStatus(selectedReturn.id, "approved")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve Return
                  </Button>
                  <div>
                    <Input
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button
                      className="w-full mt-2"
                      variant="destructive"
                      disabled={!rejectionReason}
                      onClick={() =>
                        handleUpdateStatus(
                          selectedReturn.id,
                          "rejected",
                          rejectionReason
                        )
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Reject Return
                    </Button>
                  </div>
                </div>
              )}
              {selectedReturn.status === "approved" && (
                <Button
                  className="w-full"
                  onClick={() =>
                    handleUpdateStatus(selectedReturn.id, "refunded")
                  }
                >
                  <DollarSign className="h-4 w-4 mr-2" /> Process Refund
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
