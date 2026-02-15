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
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Filter,
  Image as ImageIcon,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  payment_method: "bank_transfer" | "gcash" | "maya" | "cod" | "card";
  payment_status: "pending" | "verified" | "rejected";
  payment_proof_url?: string;
  transaction_reference?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
};

type PaymentFilter = "all" | "pending" | "verified" | "rejected";

export function PaymentVerification() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("pending");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load payments from database
  useEffect(() => {
    async function loadPayments() {
      const supabase = createClient();

      // In a real implementation, load from payments table with order and user data
      // For now, simulate payment data
      const mockPayments: Payment[] = [
        {
          id: "pay1",
          order_id: "order1",
          amount: 2500,
          payment_method: "gcash",
          payment_status: "pending",
          payment_proof_url:
            "https://via.placeholder.com/400x600/4CAF50/FFFFFF?text=GCash+Receipt",
          transaction_reference: "GC-202602150001",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          order_number: "ORD-20260215-001",
          customer_name: "Juan Dela Cruz",
          customer_email: "juan@example.com",
        },
        {
          id: "pay2",
          order_id: "order2",
          amount: 1800,
          payment_method: "bank_transfer",
          payment_status: "pending",
          payment_proof_url:
            "https://via.placeholder.com/400x600/2196F3/FFFFFF?text=Bank+Transfer+Receipt",
          transaction_reference: "BT-202602150002",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          order_number: "ORD-20260215-002",
          customer_name: "Maria Santos",
          customer_email: "maria@example.com",
        },
        {
          id: "pay3",
          order_id: "order3",
          amount: 3200,
          payment_method: "maya",
          payment_status: "verified",
          payment_proof_url:
            "https://via.placeholder.com/400x600/FF9800/FFFFFF?text=Maya+Receipt",
          transaction_reference: "MA-202602140003",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          verified_at: new Date(Date.now() - 82800000).toISOString(),
          verified_by: "admin",
          order_number: "ORD-20260214-003",
          customer_name: "Pedro Garcia",
          customer_email: "pedro@example.com",
        },
        {
          id: "pay4",
          order_id: "order4",
          amount: 1500,
          payment_method: "gcash",
          payment_status: "rejected",
          payment_proof_url:
            "https://via.placeholder.com/400x600/F44336/FFFFFF?text=Invalid+Receipt",
          transaction_reference: "GC-202602140004",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          rejection_reason: "Receipt is unclear and cannot be verified",
          order_number: "ORD-20260213-004",
          customer_name: "Ana Lopez",
          customer_email: "ana@example.com",
        },
        {
          id: "pay5",
          order_id: "order5",
          amount: 4500,
          payment_method: "bank_transfer",
          payment_status: "pending",
          payment_proof_url:
            "https://via.placeholder.com/400x600/9C27B0/FFFFFF?text=Bank+Receipt",
          transaction_reference: "BT-202602150005",
          created_at: new Date(Date.now() - 1800000).toISOString(),
          order_number: "ORD-20260215-005",
          customer_name: "Carlos Reyes",
          customer_email: "carlos@example.com",
        },
      ];

      setPayments(mockPayments);
      setFilteredPayments(
        mockPayments.filter((p) => p.payment_status === "pending")
      );
      setIsLoading(false);
    }

    loadPayments();
  }, []);

  // Filter payments based on search and status
  useEffect(() => {
    let filtered = payments;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.payment_status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.order_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.customer_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.customer_email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.transaction_reference
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter]);

  // Get payment status badge
  const getStatusBadge = (
    status: Payment["payment_status"]
  ): {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
    icon: any;
  } => {
    switch (status) {
      case "pending":
        return { variant: "secondary", label: "Pending Review", icon: Clock };
      case "verified":
        return { variant: "default", label: "Verified", icon: CheckCircle };
      case "rejected":
        return { variant: "destructive", label: "Rejected", icon: XCircle };
      default:
        return { variant: "outline", label: "Unknown", icon: AlertCircle };
    }
  };

  // Get payment method icon and label
  const getPaymentMethodInfo = (method: Payment["payment_method"]) => {
    switch (method) {
      case "gcash":
        return { label: "GCash", color: "text-blue-600" };
      case "maya":
        return { label: "Maya", color: "text-green-600" };
      case "bank_transfer":
        return { label: "Bank Transfer", color: "text-purple-600" };
      case "cod":
        return { label: "Cash on Delivery", color: "text-gray-600" };
      case "card":
        return { label: "Credit/Debit Card", color: "text-orange-600" };
      default:
        return { label: "Unknown", color: "text-gray-600" };
    }
  };

  // Handle payment verification
  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const supabase = createClient();

      // In real implementation, update payment status in database
      // For now, update local state
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                payment_status: "verified",
                verified_at: new Date().toISOString(),
                verified_by: "current_user", // Get from auth
              }
            : p
        )
      );

      setVerificationDialogOpen(false);
      setSelectedPayment(null);

      console.log("Payment verified:", paymentId);
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async (paymentId: string, reason: string) => {
    try {
      const supabase = createClient();

      // In real implementation, update payment status and send notification
      setPayments((prev) =>
        prev.map((p) =>
          p.id === paymentId
            ? {
                ...p,
                payment_status: "rejected",
                rejection_reason: reason,
              }
            : p
        )
      );

      setVerificationDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason("");

      console.log("Payment rejected:", paymentId, reason);
    } catch (error) {
      console.error("Error rejecting payment:", error);
    }
  };

  // Calculate stats
  const pendingCount = payments.filter(
    (p) => p.payment_status === "pending"
  ).length;
  const verifiedCount = payments.filter(
    (p) => p.payment_status === "verified"
  ).length;
  const rejectedCount = payments.filter(
    (p) => p.payment_status === "rejected"
  ).length;
  const pendingAmount = payments
    .filter((p) => p.payment_status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              ₱{pendingAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verifiedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs resubmission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value: PaymentFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>
            Review and verify payment proofs from customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const status = getStatusBadge(payment.payment_status);
                const methodInfo = getPaymentMethodInfo(payment.payment_method);
                const StatusIcon = status.icon;

                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">{payment.order_number}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.customer_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={methodInfo.color}>
                        {methodInfo.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold">
                      ₱{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.transaction_reference || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={status.variant}
                        className="flex items-center gap-1 w-fit"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      {payment.payment_status === "rejected" &&
                        payment.rejection_reason && (
                          <div className="text-xs text-red-600 mt-1">
                            {payment.rejection_reason}
                          </div>
                        )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {payment.payment_proof_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setProofDialogOpen(true);
                            }}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.payment_status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setVerificationDialogOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              {selectedPayment && `Order: ${selectedPayment.order_number}`}
            </DialogDescription>
          </DialogHeader>

          {selectedPayment?.payment_proof_url && (
            <div className="space-y-4">
              <img
                src={selectedPayment.payment_proof_url}
                alt="Payment Proof"
                className="w-full rounded-lg border"
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <div className="font-mono">
                    {selectedPayment.transaction_reference}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <div className="font-bold">
                    ₱{selectedPayment.amount.toLocaleString()}
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  window.open(selectedPayment.payment_proof_url, "_blank")
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Size
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment &&
                `Order: ${selectedPayment.order_number} - ₱${selectedPayment.amount.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() =>
                  selectedPayment && handleVerifyPayment(selectedPayment.id)
                }
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Payment
              </Button>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium">Or Reject Payment</label>
              <Input
                className="mt-2"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <Button
                className="w-full mt-2"
                variant="destructive"
                disabled={!rejectionReason}
                onClick={() =>
                  selectedPayment &&
                  handleRejectPayment(selectedPayment.id, rejectionReason)
                }
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
