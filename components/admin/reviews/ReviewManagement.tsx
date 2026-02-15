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
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

type Review = {
  id: string;
  product_name: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
  is_verified_purchase: boolean;
  helpful_count: number;
};

type ReviewFilter = "all" | "pending" | "approved" | "hidden";

export function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewFilter>("pending");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const mockReviews: Review[] = [
        {
          id: "r1",
          product_name: "VUSE Pebble Disposable",
          product_id: "p1",
          customer_name: "Juan Dela Cruz",
          customer_email: "juan@example.com",
          rating: 5,
          title: "Best disposable vape!",
          comment:
            "Amazing flavor and long-lasting battery. Will definitely buy again. The mint flavor is my absolute favorite.",
          status: "pending",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          is_verified_purchase: true,
          helpful_count: 3,
        },
        {
          id: "r2",
          product_name: "VUSE ePod 2+ Device",
          product_id: "p2",
          customer_name: "Maria Santos",
          customer_email: "maria@example.com",
          rating: 4,
          title: "Great device, fast charging",
          comment:
            "The ePod 2+ is a solid upgrade. Fast charging and great vapor production. Only minor issue is the pod connector.",
          status: "approved",
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          is_verified_purchase: true,
          helpful_count: 7,
        },
        {
          id: "r3",
          product_name: "VUSE Go Max",
          product_id: "p3",
          customer_name: "Pedro Garcia",
          customer_email: "pedro@example.com",
          rating: 2,
          title: "Disappointing flavor",
          comment:
            "The flavor was not as expected. Tastes burnt after a few hours. Not worth the price.",
          status: "pending",
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          is_verified_purchase: false,
          helpful_count: 1,
        },
        {
          id: "r4",
          product_name: "ePod Pods - Mint",
          product_id: "p4",
          customer_name: "Ana Lopez",
          customer_email: "ana@example.com",
          rating: 5,
          title: "Perfect mint flavor",
          comment:
            "Crisp, clean mint flavor. Exactly what I was looking for. Goes well with the ePod 2+.",
          status: "approved",
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          is_verified_purchase: true,
          helpful_count: 12,
        },
        {
          id: "r5",
          product_name: "VUSE Vibe Device",
          product_id: "p5",
          customer_name: "Carlos Reyes",
          customer_email: "carlos@example.com",
          rating: 1,
          title: "Spam review - do not publish",
          comment: "Buy cheap products at www.spam-site.com!!!",
          status: "hidden",
          created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          is_verified_purchase: false,
          helpful_count: 0,
        },
      ];

      setReviews(mockReviews);
      setFilteredReviews(mockReviews.filter((r) => r.status === "pending"));
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = reviews;
    if (statusFilter !== "all")
      filtered = filtered.filter((r) => r.status === statusFilter);
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredReviews(filtered);
  }, [reviews, searchTerm, statusFilter]);

  const handleUpdateStatus = (id: string, newStatus: Review["status"]) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    setDetailsOpen(false);
  };

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDetailsOpen(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0";
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
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
              {reviews.filter((r) => r.status === "approved").length}
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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: ReviewFilter) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-[200px]">
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
        <CardContent>
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
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product_name}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{review.customer_name}</div>
                    {review.is_verified_purchase && (
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
                    <div className="font-medium text-sm">{review.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {review.comment}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "default"
                          : review.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
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
                      {review.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(review.id, "approved")
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              {selectedReview?.product_name}
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {renderStars(selectedReview.rating)}
                </div>
                {selectedReview.is_verified_purchase && (
                  <Badge variant="outline">Verified Purchase</Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold">{selectedReview.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedReview.comment}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-medium">
                    {selectedReview.customer_name}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div>
                    {new Date(selectedReview.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Helpful votes:</span>
                  <div>
                    <ThumbsUp className="h-3 w-3 inline mr-1" />
                    {selectedReview.helpful_count}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    <Badge
                      variant={
                        selectedReview.status === "approved"
                          ? "default"
                          : selectedReview.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {selectedReview.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                {selectedReview.status !== "approved" && (
                  <Button
                    className="flex-1"
                    onClick={() =>
                      handleUpdateStatus(selectedReview.id, "approved")
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                )}
                {selectedReview.status !== "hidden" && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      handleUpdateStatus(selectedReview.id, "hidden")
                    }
                  >
                    <EyeOff className="h-4 w-4 mr-2" /> Hide
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteReview(selectedReview.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
