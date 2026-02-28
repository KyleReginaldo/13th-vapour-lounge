"use client";

import { rejectPayment, verifyPayment } from "@/app/actions/payments";
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
import { IconInput } from "@/components/ui/icon-input";
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
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  Search,
  User,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PaymentProof = {
  id: string;
  order_id: string;
  customer_id: string;
  image_url: string;
  amount: number | null;
  payment_method: string | null;
  reference_number: string | null;
  status: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  extracted_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  customer: { first_name: string; last_name: string; email: string } | null;
  order: { id: string; order_number: string; total: number } | null;
  verifier: { first_name: string; last_name: string } | null;
};

type StatusFilter = "all" | "pending" | "extracted" | "verified" | "rejected";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  extracted: {
    label: "Extracted",
    variant: "default",
    icon: <DollarSign className="h-3.5 w-3.5" />,
  },
  verified: {
    label: "Verified",
    variant: "default",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  gcash: { label: "GCash", color: "text-blue-600" },
  maya: { label: "Maya", color: "text-green-600" },
  bank_transfer: { label: "Bank Transfer", color: "text-purple-600" },
  cod: { label: "Cash on Delivery", color: "text-gray-500" },
  card: { label: "Credit / Debit Card", color: "text-orange-600" },
};

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_CONFIG[status ?? ""] ?? {
    label: status ?? "Unknown",
    variant: "outline" as const,
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  };
  return (
    <Badge variant={cfg.variant} className="gap-1">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

interface PaymentVerificationProps {
  initialProofs: PaymentProof[];
}

export function PaymentVerification({
  initialProofs,
}: PaymentVerificationProps) {
  const router = useRouter();
  const [proofs, setProofs] = useState<PaymentProof[]>(initialProofs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedProof, setSelectedProof] = useState<PaymentProof | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with server-fetched data
  useEffect(() => {
    setProofs(initialProofs);
  }, [initialProofs]);

  // Filtered list
  const filtered = proofs.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    if (!searchTerm) return matchesStatus;
    const lower = searchTerm.toLowerCase();
    return (
      matchesStatus &&
      (p.order?.order_number?.toLowerCase().includes(lower) ||
        p.reference_number?.toLowerCase().includes(lower) ||
        `${p.customer?.first_name ?? ""} ${p.customer?.last_name ?? ""}`
          .toLowerCase()
          .includes(lower) ||
        p.customer?.email?.toLowerCase().includes(lower))
    );
  });

  // Stats
  const byStatus = (s: string) => proofs.filter((p) => p.status === s).length;
  const pendingAmount = proofs
    .filter((p) => p.status === "pending" || p.status === "extracted")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const openProof = (proof: PaymentProof) => {
    setSelectedProof(proof);
    setProofDialogOpen(true);
  };

  const openReview = (proof: PaymentProof) => {
    setSelectedProof(proof);
    setRejectionReason("");
    setReviewDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedProof) return;
    setIsSubmitting(true);
    const result = await verifyPayment(
      selectedProof.id,
      selectedProof.order_id
    );
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Payment verified — order marked as paid");
      setReviewDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to verify payment");
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;
    if (rejectionReason.trim().length < 10) {
      toast.error(
        "Please provide a more detailed rejection reason (min 10 chars)"
      );
      return;
    }
    setIsSubmitting(true);
    const result = await rejectPayment(selectedProof.id, rejectionReason);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Payment proof rejected");
      setReviewDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to reject payment");
    }
  };

  const pendingCount = byStatus("pending") + byStatus("extracted");
  const verifiedCount = byStatus("verified");
  const rejectedCount = byStatus("rejected");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Payment Verification
        </h1>
        <p className="text-muted-foreground mt-1">
          Review payment proofs submitted by customers and approve or reject
          them
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pendingAmount)} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Verified
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {verifiedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting resubmission
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proofs.length}</div>
            <p className="text-xs text-muted-foreground">All submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <IconInput
          icon={Search}
          containerClassName="flex-1 max-w-sm"
          placeholder="Order number, reference, customer…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="extracted">Extracted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Payment Proofs{" "}
            <span className="text-muted-foreground font-normal text-base">
              ({filtered.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-8 w-8 opacity-30" />
                      <p>
                        {searchTerm || statusFilter !== "all"
                          ? "No proofs match your filters."
                          : "No payment proofs yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((proof) => {
                  const methodCfg = METHOD_LABELS[
                    proof.payment_method ?? ""
                  ] ?? {
                    label: proof.payment_method ?? "—",
                    color: "text-muted-foreground",
                  };
                  const isPending =
                    proof.status === "pending" || proof.status === "extracted";
                  return (
                    <TableRow key={proof.id}>
                      <TableCell>
                        <div className="font-mono font-semibold text-sm">
                          {proof.order?.order_number ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {proof.customer?.first_name}{" "}
                          {proof.customer?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {proof.customer?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-medium ${methodCfg.color}`}
                        >
                          {methodCfg.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {proof.amount != null
                            ? formatCurrency(proof.amount)
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          {proof.reference_number ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(
                            proof.uploaded_at ?? proof.created_at ?? ""
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(
                            proof.uploaded_at ?? proof.created_at ?? ""
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge status={proof.status} />
                          {proof.status === "rejected" &&
                            proof.rejection_reason && (
                              <p className="text-xs text-destructive max-w-35 line-clamp-2">
                                {proof.rejection_reason}
                              </p>
                            )}
                          {proof.status === "verified" && proof.verifier && (
                            <p className="text-xs text-muted-foreground">
                              by {proof.verifier.first_name}{" "}
                              {proof.verifier.last_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => openProof(proof)}
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </Button>
                          {isPending && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => openReview(proof)}
                            >
                              Review
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

      {/* Proof Image Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              {selectedProof?.order?.order_number} ·{" "}
              {selectedProof?.customer?.first_name}{" "}
              {selectedProof?.customer?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden bg-muted/30 flex items-center justify-center min-h-50">
                {selectedProof.image_url ? (
                  <img
                    src={selectedProof.image_url}
                    alt="Payment proof"
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground py-12">
                    No image uploaded
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Reference</p>
                  <p className="font-mono font-medium">
                    {selectedProof.reference_number ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-base">
                    {selectedProof.amount != null
                      ? formatCurrency(selectedProof.amount)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="font-medium">
                    {METHOD_LABELS[selectedProof.payment_method ?? ""]?.label ??
                      selectedProof.payment_method ??
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <StatusBadge status={selectedProof.status} />
                </div>
              </div>

              {selectedProof.rejection_reason && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  <strong>Rejection reason:</strong>{" "}
                  {selectedProof.rejection_reason}
                </div>
              )}

              <Separator />

              <div className="flex gap-2">
                {selectedProof.image_url && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(selectedProof.image_url, "_blank")
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Full Size
                  </Button>
                )}
                {(selectedProof.status === "pending" ||
                  selectedProof.status === "extracted") && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setProofDialogOpen(false);
                      openReview(selectedProof);
                    }}
                  >
                    Review Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
            <DialogDescription>
              <span className="font-mono font-medium">
                {selectedProof?.order?.order_number}
              </span>{" "}
              ·{" "}
              {selectedProof?.amount != null
                ? formatCurrency(selectedProof.amount)
                : ""}{" "}
              via{" "}
              {METHOD_LABELS[selectedProof?.payment_method ?? ""]?.label ??
                selectedProof?.payment_method}
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="space-y-5 py-2">
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedProof.customer?.first_name}{" "}
                    {selectedProof.customer?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProof.customer?.email}
                  </p>
                </div>
              </div>

              {selectedProof.image_url && (
                <div
                  className="rounded-lg border overflow-hidden cursor-pointer group relative"
                  onClick={() => {
                    setReviewDialogOpen(false);
                    openProof(selectedProof);
                  }}
                >
                  <img
                    src={selectedProof.image_url}
                    alt="Proof thumbnail"
                    className="w-full max-h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-muted-foreground">Reference #</p>
                  <p className="font-mono font-medium">
                    {selectedProof.reference_number ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Total</p>
                  <p className="font-bold">
                    {selectedProof.order?.total != null
                      ? formatCurrency(selectedProof.order.total)
                      : "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <Button
                className="w-full"
                disabled={isSubmitting}
                onClick={handleVerify}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve &amp; Mark as Paid
              </Button>

              <div className="space-y-2">
                <Label htmlFor="rej-reason">Or reject with a reason</Label>
                <Textarea
                  id="rej-reason"
                  placeholder="Describe why this proof is invalid (min 10 characters)…"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={isSubmitting || rejectionReason.trim().length < 10}
                  onClick={handleReject}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Reject Payment
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
