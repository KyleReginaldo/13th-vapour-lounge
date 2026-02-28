"use client";

import {
  approveReturn,
  completeReturn,
  rejectReturn,
} from "@/app/actions/returns";
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
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  StickyNote,
  User,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReturnRecord = {
  id: string;
  return_number: string;
  order_id: string;
  customer_id: string;
  status: string | null;
  reason: string;
  detailed_reason: string | null;
  refund_amount: number | null;
  refund_method: string | null;
  notes: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  customer: { first_name: string; last_name: string; email: string } | null;
  order: { id: string; order_number: string; total: number } | null;
  processor: { first_name: string; last_name: string } | null;
};

type StatusFilter =
  | "all"
  | "pending"
  | "requested"
  | "approved"
  | "rejected"
  | "completed";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

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
  requested: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    variant: "outline",
    icon: <DollarSign className="h-3.5 w-3.5" />,
  },
};

const REFUND_METHOD_LABELS: Record<string, string> = {
  original: "Original Payment Method",
  store_credit: "Store Credit",
  cash: "Cash",
  refund: "Refund",
  exchange: "Exchange",
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ReturnsManagementProps {
  initialReturns: ReturnRecord[];
}

export function ReturnsManagement({ initialReturns }: ReturnsManagementProps) {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRecord[]>(initialReturns);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  // Dialogs
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  // Form state
  const [refundAmount, setRefundAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReturns(initialReturns);
  }, [initialReturns]);

  // Filter
  const filtered = returns.filter((r) => {
    const status = r.status ?? "";
    const isPending = status === "pending" || status === "requested";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" ? isPending : status === statusFilter);
    if (!matchesStatus) return false;
    if (!searchTerm) return true;
    const lower = searchTerm.toLowerCase();
    return (
      r.return_number.toLowerCase().includes(lower) ||
      r.order?.order_number?.toLowerCase().includes(lower) ||
      `${r.customer?.first_name ?? ""} ${r.customer?.last_name ?? ""}`
        .toLowerCase()
        .includes(lower) ||
      r.reason.toLowerCase().includes(lower)
    );
  });

  // Stats
  const isPending = (s: string | null) => s === "pending" || s === "requested";
  const pendingCount = returns.filter((r) => isPending(r.status)).length;
  const approvedCount = returns.filter((r) => r.status === "approved").length;
  const completedAmount = returns
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.refund_amount ?? 0), 0);

  const openDetails = (r: ReturnRecord) => {
    setSelectedReturn(r);
    setDetailsOpen(true);
  };

  const openApprove = (r: ReturnRecord) => {
    setSelectedReturn(r);
    setRefundAmount(String(r.refund_amount ?? r.order?.total ?? ""));
    setApproveOpen(true);
  };

  const openReject = (r: ReturnRecord) => {
    setSelectedReturn(r);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openComplete = (r: ReturnRecord) => {
    setSelectedReturn(r);
    setCompleteOpen(true);
  };

  // Actions
  const handleApprove = async () => {
    if (!selectedReturn) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Enter a valid refund amount");
      return;
    }
    setIsSubmitting(true);
    const result = await approveReturn(selectedReturn.id, amount);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Return approved");
      setApproveOpen(false);
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to approve return");
    }
  };

  const handleReject = async () => {
    if (!selectedReturn) return;
    if (rejectReason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (min 10 characters)");
      return;
    }
    setIsSubmitting(true);
    const result = await rejectReturn(selectedReturn.id, rejectReason);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Return rejected");
      setRejectOpen(false);
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to reject return");
    }
  };

  const handleComplete = async () => {
    if (!selectedReturn) return;
    setIsSubmitting(true);
    const result = await completeReturn(selectedReturn.id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Return completed — order marked as refunded");
      setCompleteOpen(false);
      setDetailsOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Failed to complete return");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
        <p className="text-muted-foreground mt-1">
          Review and process customer return requests and refunds
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Pending Review",
            value: pendingCount,
            sub: "Needs attention",
            icon: <Clock className="h-4 w-4 text-amber-500" />,
            color: "text-amber-600",
          },
          {
            label: "Approved",
            value: approvedCount,
            sub: "Awaiting completion",
            icon: <CheckCircle className="h-4 w-4 text-green-500" />,
            color: "text-green-600",
          },
          {
            label: "Total Refunded",
            value: formatCurrency(completedAmount),
            sub: "Completed returns",
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            color: "text-foreground",
          },
          {
            label: "Total Returns",
            value: returns.length,
            sub: "All time",
            icon: <RotateCcw className="h-4 w-4 text-muted-foreground" />,
            color: "",
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
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <IconInput
          icon={Search}
          containerClassName="flex-1 max-w-sm"
          placeholder="Return #, order #, customer, reason…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Returns</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            Returns{" "}
            <span className="text-muted-foreground font-normal text-base">
              ({filtered.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Return #</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <RotateCcw className="h-8 w-8 opacity-30" />
                      <p>
                        {searchTerm || statusFilter !== "all"
                          ? "No returns match your filters."
                          : "No return requests yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ret) => {
                  const isActionable =
                    isPending(ret.status) || ret.status === "approved";
                  return (
                    <TableRow key={ret.id}>
                      <TableCell>
                        <span className="font-mono font-semibold text-sm">
                          {ret.return_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {ret.order?.order_number ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {ret.customer?.first_name} {ret.customer?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ret.customer?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm max-w-48 line-clamp-2 block">
                          {ret.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {ret.refund_amount != null
                            ? formatCurrency(ret.refund_amount)
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ret.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(ret.created_at ?? "").toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => openDetails(ret)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {isPending(ret.status) && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => openApprove(ret)}
                            >
                              Approve
                            </Button>
                          )}
                          {ret.status === "approved" && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => openComplete(ret)}
                            >
                              Refund
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

      {/* ── Details Dialog ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReturn?.return_number}
              <StatusBadge status={selectedReturn?.status ?? null} />
            </DialogTitle>
            <DialogDescription>
              Order {selectedReturn?.order?.order_number} ·{" "}
              {selectedReturn?.created_at
                ? new Date(selectedReturn.created_at).toLocaleString()
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-4 mt-1">
              {/* Customer */}
              <div className="rounded-lg border p-4 flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    {selectedReturn.customer?.first_name}{" "}
                    {selectedReturn.customer?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedReturn.customer?.email}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="rounded-lg bg-muted/40 border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Reason
                </p>
                <p className="text-sm">{selectedReturn.reason}</p>
                {selectedReturn.detailed_reason && (
                  <p className="text-sm text-muted-foreground">
                    {selectedReturn.detailed_reason}
                  </p>
                )}
              </div>

              {/* Refund details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Refund Amount</p>
                  <p className="font-bold text-base">
                    {selectedReturn.refund_amount != null
                      ? formatCurrency(selectedReturn.refund_amount)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Total</p>
                  <p className="font-semibold">
                    {selectedReturn.order?.total != null
                      ? formatCurrency(selectedReturn.order.total)
                      : "—"}
                  </p>
                </div>
                {selectedReturn.refund_method && (
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-medium">
                      {REFUND_METHOD_LABELS[selectedReturn.refund_method] ??
                        selectedReturn.refund_method}
                    </p>
                  </div>
                )}
                {selectedReturn.processor && (
                  <div>
                    <p className="text-muted-foreground">Processed by</p>
                    <p className="font-medium">
                      {selectedReturn.processor.first_name}{" "}
                      {selectedReturn.processor.last_name}
                    </p>
                  </div>
                )}
              </div>

              {selectedReturn.notes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex gap-2">
                  <StickyNote className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {selectedReturn.notes}
                  </p>
                </div>
              )}

              <Separator />

              {/* Actions from details */}
              {isPending(selectedReturn.status) && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setDetailsOpen(false);
                      openApprove(selectedReturn);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve Return
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setDetailsOpen(false);
                      openReject(selectedReturn);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}

              {selectedReturn.status === "approved" && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setDetailsOpen(false);
                    openComplete(selectedReturn);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" /> Process Refund
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ── */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Return</DialogTitle>
            <DialogDescription>
              Confirm the refund amount for{" "}
              <strong>{selectedReturn?.return_number}</strong>. The
              customer&apos;s order total was{" "}
              {selectedReturn?.order?.total != null
                ? formatCurrency(selectedReturn.order.total)
                : "—"}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Refund Amount</Label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                step={0.01}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !refundAmount}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Return</DialogTitle>
            <DialogDescription>
              Explain why <strong>{selectedReturn?.return_number}</strong> is
              being rejected. The reason will be recorded.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Product is not eligible for return — consumable item opened (min 10 characters)…"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {rejectReason.trim().length}/10 minimum characters
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || rejectReason.trim().length < 10}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete / Refund Confirmation ── */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Mark <strong>{selectedReturn?.return_number}</strong> as completed
              and refund{" "}
              <strong>
                {selectedReturn?.refund_amount != null
                  ? formatCurrency(selectedReturn.refund_amount)
                  : "the approved amount"}
              </strong>{" "}
              to the customer? The linked order will be marked as refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? "Processing…" : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
