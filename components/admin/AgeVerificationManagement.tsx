"use client";

import {
  approveAgeVerification,
  getPendingVerifications,
  rejectAgeVerification,
} from "@/app/actions/age-verification";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type VerificationRecord = {
  id: string;
  user_id: string;
  id_verification_url: string | null;
  consent_to_terms: boolean | null;
  consent_to_privacy: boolean | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  users: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
  } | null;
};

export function AgeVerificationManagement() {
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] =
    useState<VerificationRecord | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ["age-verifications"],
    queryFn: async () => {
      const result = await getPendingVerifications();
      if (!result.success) throw new Error(result.error ?? "Failed to load");
      return (result.data ?? []) as VerificationRecord[];
    },
  });

  const pendingCount =
    records?.filter((r) => !r.verified_at && !r.rejection_reason).length ?? 0;
  const approvedCount =
    records?.filter((r) => r.verified_at && !r.rejection_reason).length ?? 0;
  const rejectedCount =
    records?.filter((r) => !!r.rejection_reason).length ?? 0;

  const getStatus = (r: VerificationRecord) => {
    if (r.rejection_reason) return "rejected";
    if (r.verified_at) return "approved";
    return "pending";
  };

  const openReview = (record: VerificationRecord) => {
    setSelectedRecord(record);
    setRejectionReason("");
    setReviewOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    const result = await approveAgeVerification(selectedRecord.id);
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Verification approved — user is now verified");
      setReviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ["age-verifications"] });
    } else {
      toast.error(result.message ?? "Failed to approve");
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    if (rejectionReason.trim().length < 10) {
      toast.error("Please provide a rejection reason (min 10 characters)");
      return;
    }
    setIsSubmitting(true);
    const result = await rejectAgeVerification(
      selectedRecord.id,
      rejectionReason
    );
    setIsSubmitting(false);
    if (result.success) {
      toast.success("Verification rejected");
      setReviewOpen(false);
      queryClient.invalidateQueries({ queryKey: ["age-verifications"] });
    } else {
      toast.error(result.message ?? "Failed to reject");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <Loader2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting admin review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">Users verified</p>
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
            <p className="text-xs text-muted-foreground">
              Submissions rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Verification Submissions
            </CardTitle>
            <CardDescription>
              Review customer ID submissions for age verification
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["age-verifications"] })
            }
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !records || records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No verification submissions yet</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const status = getStatus(record);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {record.users
                                ? `${record.users.first_name} ${record.users.last_name}`.trim()
                                : "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.users?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.users?.date_of_birth
                            ? new Date(
                                record.users.date_of_birth
                              ).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {record.created_at
                            ? new Date(record.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {status === "pending" && (
                            <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                              Pending
                            </Badge>
                          )}
                          {status === "approved" && (
                            <Badge className="bg-green-100 text-green-700 border border-green-200">
                              Approved
                            </Badge>
                          )}
                          {status === "rejected" && (
                            <Badge className="bg-red-100 text-red-700 border border-red-200">
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(record)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review ID Submission</DialogTitle>
            <DialogDescription>
              {selectedRecord?.users
                ? `${selectedRecord.users.first_name} ${selectedRecord.users.last_name} — ${selectedRecord.users.email}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* ID Document Preview */}
              {selectedRecord.id_verification_url ? (
                <div className="rounded-lg border overflow-hidden">
                  <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
                    <p className="text-sm font-medium">Submitted ID Document</p>
                    <a
                      href={selectedRecord.id_verification_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {selectedRecord.id_verification_url.match(
                    /\.(jpg|jpeg|png|webp)(\?|$)/i
                  ) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedRecord.id_verification_url}
                      alt="ID document"
                      className="w-full max-h-64 object-contain bg-muted"
                    />
                  ) : (
                    <div className="p-4 flex items-center justify-center bg-muted">
                      <a
                        href={selectedRecord.id_verification_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border p-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No document uploaded
                </div>
              )}

              {/* Consents */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Terms consent:{" "}
                  {selectedRecord.consent_to_terms ? (
                    <span className="text-green-600 font-medium">✓ Agreed</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ✗ Not agreed
                    </span>
                  )}
                </p>
                <p>
                  Privacy consent:{" "}
                  {selectedRecord.consent_to_privacy ? (
                    <span className="text-green-600 font-medium">✓ Agreed</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ✗ Not agreed
                    </span>
                  )}
                </p>
              </div>

              {/* Current status */}
              {getStatus(selectedRecord) === "approved" && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4" />
                  This verification has already been approved.
                </div>
              )}

              {getStatus(selectedRecord) === "rejected" && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg px-4 py-3">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  <span>
                    <strong>Previously rejected:</strong>{" "}
                    {selectedRecord.rejection_reason}
                  </span>
                </div>
              )}

              {/* Actions */}
              {getStatus(selectedRecord) === "pending" && (
                <>
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={handleApprove}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve Verification
                  </Button>

                  <div className="space-y-2">
                    <Label>Reject with reason</Label>
                    <Textarea
                      placeholder="Explain why the ID was rejected (min 10 characters)…"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={
                        isSubmitting || rejectionReason.trim().length < 10
                      }
                      onClick={handleReject}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject Verification
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
