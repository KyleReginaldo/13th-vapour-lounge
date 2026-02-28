"use client";

import {
  approveReview,
  deleteReview,
  hideReview,
  unhideReview,
} from "@/app/actions/reviews";
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
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ReviewRecord = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_approved: boolean | null;
  is_hidden: boolean | null;
  helpful_count: number | null;
  verified_purchase: boolean | null;
  images: string[] | null;
  created_at: string | null;
  user: { first_name: string; last_name: string; email: string } | null;
  product: { id: string; name: string } | null;
};

type ReviewFilter = "all" | "pending" | "approved" | "hidden";

function getStatus(review: ReviewRecord): "pending" | "approved" | "hidden" {
  if (review.is_hidden) return "hidden";
  if (review.is_approved) return "approved";
  return "pending";
}

interface ReviewManagementProps {
  initialReviews: ReviewRecord[];
}

export function ReviewManagement({ initialReviews }: ReviewManagementProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRecord[]>(initialReviews);
  const [filteredReviews, setFilteredReviews] = useState<ReviewRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("pending");
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewRecord | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    let filtered = reviews;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => getStatus(r) === statusFilter);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.product?.name?.toLowerCase().includes(lower) ||
          `${r.user?.first_name} ${r.user?.last_name}`
            .toLowerCase()
            .includes(lower) ||
          r.title?.toLowerCase().includes(lower) ||
          r.review_text?.toLowerCase().includes(lower)
      );
    }
    setFilteredReviews(filtered);
  }, [reviews, searchTerm, statusFilter]);

  const handleApprove = async (review: ReviewRecord) => {
    setIsSubmitting(true);
    try {
      const result = await approveReview(review.id);
      if (result?.success) {
        toast.success("Review approved");
        setDetailsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to approve review");
      }
    } catch {
      toast.error("Failed to approve review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHide = async (review: ReviewRecord) => {
    setIsSubmitting(true);
    try {
      const result = await hideReview(review.id);
      if (result?.success) {
        toast.success("Review hidden");
        setDetailsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to hide review");
      }
    } catch {
      toast.error("Failed to hide review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnhide = async (review: ReviewRecord) => {
    setIsSubmitting(true);
    try {
      const result = await unhideReview(review.id);
      if (result?.success) {
        toast.success("Review unhidden");
        setDetailsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to unhide review");
      }
    } catch {
      toast.error("Failed to unhide review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    setIsSubmitting(true);
    try {
      const result = await deleteReview(reviewToDelete.id);
      if (result?.success) {
        toast.success("Review deleted");
        setDeleteConfirmOpen(false);
        setDetailsOpen(false);
        setReviewToDelete(null);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to delete review");
      }
    } catch {
      toast.error("Failed to delete review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const pendingCount = reviews.filter((r) => getStatus(r) === "pending").length;
  const approvedCount = reviews.filter(
    (r) => getStatus(r) === "approved"
  ).length;
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <div className="flex gap-0.5 mt-1">
              {renderStars(Math.round(parseFloat(avgRating)))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">Needs moderation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-xs text-muted-foreground">Live on site</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <IconInput
          icon={Search}
          containerClassName="flex-1"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={statusFilter}
          onValueChange={(value: ReviewFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>Moderate and manage product reviews</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No reviews found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => {
                  const status = getStatus(review);
                  const customerName = review.user
                    ? `${review.user.first_name} ${review.user.last_name}`
                    : "Unknown";
                  return (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.product?.name ?? "Unknown Product"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customerName}</div>
                        {review.verified_purchase && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Verified Purchase
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {renderStars(review.rating)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-64">
                        <div className="font-medium text-sm">
                          {review.title ?? "(No title)"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {review.review_text}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === "approved"
                              ? "default"
                              : status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReview(review);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {status === "pending" && (
                            <Button
                              size="sm"
                              disabled={isSubmitting}
                              onClick={() => handleApprove(review)}
                            >
                              <CheckCircle className="h-4 w-4" />
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

      {/* Review Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              {selectedReview?.product?.name ?? "Unknown Product"}
            </DialogDescription>
          </DialogHeader>
          {selectedReview &&
            (() => {
              const status = getStatus(selectedReview);
              const customerName = selectedReview.user
                ? `${selectedReview.user.first_name} ${selectedReview.user.last_name}`
                : "Unknown";
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {renderStars(selectedReview.rating)}
                    </div>
                    {selectedReview.verified_purchase && (
                      <Badge variant="outline">Verified Purchase</Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">
                      {selectedReview.title ?? "(No title)"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReview.review_text}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <div className="font-medium">{customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedReview.user?.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <div>
                        {selectedReview.created_at
                          ? new Date(selectedReview.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Helpful votes:
                      </span>
                      <div>
                        <ThumbsUp className="h-3 w-3 inline mr-1" />
                        {selectedReview.helpful_count ?? 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="mt-1">
                        <Badge
                          variant={
                            status === "approved"
                              ? "default"
                              : status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t pt-4">
                    {status !== "approved" && (
                      <Button
                        className="flex-1"
                        disabled={isSubmitting}
                        onClick={() => handleApprove(selectedReview)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                      </Button>
                    )}
                    {status === "hidden" ? (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={isSubmitting}
                        onClick={() => handleUnhide(selectedReview)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Unhide
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="flex-1"
                        disabled={isSubmitting}
                        onClick={() => handleHide(selectedReview)}
                      >
                        <EyeOff className="h-4 w-4 mr-2" /> Hide
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      disabled={isSubmitting}
                      onClick={() => {
                        setReviewToDelete(selectedReview);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this review? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
