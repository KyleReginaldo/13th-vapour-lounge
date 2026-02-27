"use client";

import {
  getMyVerificationStatus,
  submitAgeVerification,
} from "@/app/actions/age-verification";
import { uploadReviewImage } from "@/app/actions/images";
import { cancelOrderByCustomer } from "@/app/actions/orders";
import {
  reorderItems,
  requestPasswordChangeOTP,
  updateProfile,
  verifyPasswordChangeOTP,
  type PasswordChangeState,
  type ProfileOrder,
} from "@/app/actions/profile";
import { submitProductReview } from "@/app/actions/reviews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { type UserWithRole } from "@/lib/auth/supabase-auth";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Upload,
  User,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

// ── Helpers ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-green-50 text-green-700 border-green-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-50 text-gray-700 border-gray-200",
};

function StatusBadge({
  value,
  styleMap,
}: {
  value: string | null;
  styleMap: Record<string, string>;
}) {
  if (!value) return null;
  const cls = styleMap[value] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        cls
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function SaveButton({ label = "Save Changes" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-10 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white rounded-xl disabled:opacity-60"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "orders" | "settings";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: UserCircle },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "settings", label: "Settings", icon: KeyRound },
];

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ user }: { user: UserWithRole }) {
  const fullName = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  const fields = [
    {
      icon: User,
      label: "Full Name",
      value: `${fullName}${user.suffix ? `, ${user.suffix}` : ""}`,
    },
    { icon: User, label: "Email", value: user.email },
    { icon: Phone, label: "Contact Number", value: user.contact_number },
    {
      icon: Calendar,
      label: "Date of Birth",
      value: new Date(user.date_of_birth).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    { icon: ShieldCheck, label: "Role", value: user.roles?.name ?? "customer" },
    {
      icon: Calendar,
      label: "Member Since",
      value: user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
          })
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <div className="flex items-center gap-4 rounded-2xl bg-[#0A0A0A] p-6 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold">{fullName}</p>
          <p className="text-sm text-white/50">{user.email}</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white/70">
            <ShieldCheck className="h-3 w-3" />
            {user.roles?.name ?? "customer"}
          </span>
        </div>
      </div>

      {/* Detail fields */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white divide-y divide-[#F5F5F5] overflow-hidden">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <Icon className="h-4 w-4 text-[#888]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-[#ADADAD] uppercase tracking-wide">
                {label}
              </p>
              <p className="text-[14px] font-medium text-[#0F0F0F] truncate">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

const MAX_REVIEW_IMAGES = 3;

function ReviewModal({
  open,
  productName,
  productId,
  orderId,
  onClose,
  onReviewed,
}: {
  open: boolean;
  productName: string;
  productId: string;
  orderId: string;
  onClose: () => void;
  onReviewed: (productId: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRating(0);
    setHoveredStar(0);
    setTitle("");
    setComment("");
    setError(null);
    setSuccess(false);
    setImageUrls([]);
    setUploadingCount(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    const remaining = MAX_REVIEW_IMAGES - imageUrls.length;
    const batch = files.slice(0, remaining);
    setUploadingCount((c) => c + batch.length);
    const results = await Promise.all(
      batch.map(async (file) => {
        const res = await uploadReviewImage(file);
        return res.success && res.data ? res.data.url : null;
      })
    );
    setUploadingCount((c) => c - batch.length);
    const uploaded = results.filter(Boolean) as string[];
    if (uploaded.length)
      setImageUrls((prev) =>
        [...prev, ...uploaded].slice(0, MAX_REVIEW_IMAGES)
      );
    if (uploaded.length < batch.length)
      setError("Some images failed to upload. Please try again.");
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title is too short.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Review is too short.");
      return;
    }
    if (uploadingCount > 0) {
      setError("Please wait for images to finish uploading.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitProductReview({
      productId,
      orderId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images: imageUrls.length ? imageUrls : undefined,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.message ?? "Failed to submit.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onReviewed(productId);
      handleClose();
    }, 1400);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-sm p-0 gap-0 overflow-hidden rounded-2xl border border-[#EBEBEB]"
      >
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-[#F5F5F5]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-[15px] font-semibold text-[#0F0F0F]">
                Write a Review
              </DialogTitle>
              <p className="text-[12px] text-[#ADADAD] mt-0.5 line-clamp-1">
                {productName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1 hover:bg-[#F5F5F5] transition-colors text-[#ADADAD] hover:text-[#3D3D3D] shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {success ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-semibold text-[#0F0F0F]">Review submitted!</p>
              <p className="text-[13px] text-[#ADADAD]">
                It will be visible after moderation.
              </p>
            </div>
          ) : (
            <>
              {/* Stars + Photos row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[#3D3D3D]">
                    Your rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= (hoveredStar || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-[#E0E0E0]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo upload */}
                <div className="space-y-1.5">
                  <p className="text-[12px] font-medium text-[#3D3D3D]">
                    Photos{" "}
                    <span className="font-normal text-[#ADADAD] text-[11px]">
                      (up to {MAX_REVIEW_IMAGES})
                    </span>
                  </p>
                  <div className="flex gap-1.5">
                    {imageUrls.map((url) => (
                      <div
                        key={url}
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E8E8E8] group shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="review"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setImageUrls((p) => p.filter((u) => u !== url))
                          }
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {Array.from({ length: uploadingCount }).map((_, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 rounded-lg border border-dashed border-[#E8E8E8] bg-[#FAFAFA] flex items-center justify-center shrink-0"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-[#ADADAD]" />
                      </div>
                    ))}
                    {imageUrls.length < MAX_REVIEW_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCount > 0}
                        className="w-14 h-14 rounded-lg border border-dashed border-[#E8E8E8] bg-[#FAFAFA] hover:bg-[#F0F0F0] disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-0.5 text-[#ADADAD] hover:text-[#6B6B6B] shrink-0"
                      >
                        <ImagePlus className="h-4 w-4" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImagePick}
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#3D3D3D]">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Great product!"
                  maxLength={200}
                  className="w-full h-9 px-3 text-[12px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-[#3D3D3D]">
                  Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={2}
                  maxLength={2000}
                  className="w-full px-3 py-2 text-[12px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-5 pb-5 pt-0 flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 h-9 rounded-xl border border-[#E8E8E8] text-[12px] font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
              className="flex-1 h-9 rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-[12px] font-semibold disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Order Detail Sheet ───────────────────────────────────────────────────────

function OrderDetailSheet({
  order,
  open,
  onClose,
  onReorder,
  reorderingId,
  onCancel,
  cancellingId,
}: {
  order: ProfileOrder | null;
  open: boolean;
  onClose: () => void;
  onReorder: (id: string) => void;
  reorderingId: string | null;
  onCancel: (id: string) => void;
  cancellingId: string | null;
}) {
  const [reviewingProduct, setReviewingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Pre-populate from localStorage (same key as ReviewPromptDialog)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("review_prompt_reviewed_keys");
      if (raw) setReviewedIds(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  if (!order) return null;

  const canReview =
    order.status === "completed" || order.status === "delivered";
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
      >
        {/* Review Modal */}
        {reviewingProduct && (
          <ReviewModal
            open
            productName={reviewingProduct.name}
            productId={reviewingProduct.id}
            orderId={order.id}
            onClose={() => setReviewingProduct(null)}
            onReviewed={(id) => {
              const key = `${id}:${order.id}`;
              setReviewedIds((s) => new Set([...s, key]));
              try {
                const raw = localStorage.getItem("review_prompt_reviewed_keys");
                const existing: string[] = raw ? JSON.parse(raw) : [];
                if (!existing.includes(key)) existing.push(key);
                localStorage.setItem(
                  "review_prompt_reviewed_keys",
                  JSON.stringify(existing)
                );
              } catch {}
              setReviewingProduct(null);
            }}
          />
        )}
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-[#F0F0F0]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-[15px] font-semibold text-[#0F0F0F]">
                {order.order_number}
              </SheetTitle>
              <p className="text-[12px] text-[#ADADAD] mt-0.5">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#ADADAD] uppercase tracking-wide">
                  Order
                </span>
                <StatusBadge value={order.status} styleMap={STATUS_STYLES} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-[#ADADAD] uppercase tracking-wide">
                  Payment
                </span>
                <StatusBadge
                  value={order.payment_status}
                  styleMap={PAYMENT_STATUS_STYLES}
                />
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#ADADAD] mb-3">
              Items ({order.items.length})
            </p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#0F0F0F] leading-snug">
                        {item.product_name}
                      </p>
                      {item.variant_attributes &&
                        Object.keys(item.variant_attributes).length > 0 && (
                          <p className="text-[11px] text-[#ADADAD] mt-0.5">
                            {Object.entries(item.variant_attributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        )}
                      <p className="text-[11px] text-[#ADADAD] mt-1">
                        ₱{item.unit_price.toLocaleString()} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-[13px] font-semibold text-[#0F0F0F]">
                        ₱{item.subtotal.toLocaleString()}
                      </p>
                      {canReview &&
                        item.product_id &&
                        !reviewedIds.has(`${item.product_id}:${order.id}`) && (
                          <button
                            onClick={() =>
                              setReviewingProduct({
                                id: item.product_id!,
                                name: item.product_name,
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-medium text-amber-500 hover:text-amber-600 transition-colors"
                          >
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            Review
                          </button>
                        )}
                      {canReview &&
                        item.product_id &&
                        reviewedIds.has(`${item.product_id}:${order.id}`) && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                            <CheckCircle2 className="h-3 w-3" /> Reviewed
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mx-5 mt-4 rounded-xl border border-[#F0F0F0] bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
              <span className="text-[13px] text-[#6B6B6B]">Subtotal</span>
              <span className="text-[13px] font-medium text-[#0F0F0F]">
                ₱{order.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5]">
              <span className="text-[13px] text-[#6B6B6B]">Payment</span>
              <span className="text-[13px] font-medium text-[#0F0F0F] capitalize">
                {order.payment_method?.replace(/_/g, " ") ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[14px] font-semibold text-[#0F0F0F]">
                Total
              </span>
              <span className="text-[14px] font-bold text-[#0F0F0F]">
                ₱{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[#F0F0F0] space-y-2.5">
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#0A0A0A] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors"
          >
            <Truck className="h-4 w-4" />
            Track Order
          </Link>
          {(order.status === "completed" || order.status === "delivered") && (
            <Button
              onClick={() => onReorder(order.id)}
              disabled={reorderingId === order.id}
              variant="outline"
              className="w-full h-10 rounded-xl border-[#E8E8E8] text-[#3D3D3D] hover:bg-[#F5F5F5] disabled:opacity-60"
            >
              {reorderingId === order.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Order Again
            </Button>
          )}
          {order.status === "pending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={cancellingId === order.id}
                  className="w-full h-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                >
                  {cancellingId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel order{" "}
                    <span className="font-semibold">{order.order_number}</span>.
                    This cannot be undone. If you already paid, please contact
                    us to arrange a refund.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => onCancel(order.id)}
                  >
                    Yes, Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-10 rounded-xl border-[#E8E8E8] text-[#3D3D3D] hover:bg-[#F5F5F5]"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: ProfileOrder[] }) {
  const router = useRouter();
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [reorderMsg, setReorderMsg] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProfileOrder | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    setCancelMsg(null);
    try {
      const result = await cancelOrderByCustomer(orderId);
      if (result.success) {
        setCancelSuccess(true);
        setCancelMsg("Order cancelled successfully.");
        setSelectedOrder(null);
      } else {
        setCancelSuccess(false);
        setCancelMsg(result.message ?? "Failed to cancel order.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    setReorderMsg(null);
    try {
      const result = await reorderItems(orderId);
      setReorderMsg(result.message);
      if (result.added > 0) {
        setSelectedOrder(null);
        setTimeout(() => router.push("/cart"), 800);
      }
    } finally {
      setReorderingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E0E0E0] bg-white py-16 text-center">
        <Package className="h-12 w-12 text-[#D0D0D0] mb-3" />
        <p className="font-medium text-[#3D3D3D]">No orders yet</p>
        <p className="text-sm text-[#ADADAD] mt-1 mb-5">
          Your order history will appear here.
        </p>
        <Link href="/products">
          <Button className="rounded-xl bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]">
            Start shopping <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <OrderDetailSheet
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onReorder={handleReorder}
        reorderingId={reorderingId}
        onCancel={handleCancel}
        cancellingId={cancellingId}
      />
      {cancelMsg && cancellingId === null && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] flex items-center justify-between gap-3 ${
            cancelSuccess
              ? "border-green-100 bg-green-50 text-green-700"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          <span>{cancelMsg}</span>
          <button
            onClick={() => setCancelMsg(null)}
            className="shrink-0 text-xs underline opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden cursor-pointer hover:border-[#D5D5D5] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            {/* Order header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#F5F5F5]">
              <div>
                <p className="text-[13px] font-semibold text-[#0F0F0F]">
                  {order.order_number}
                </p>
                <p className="text-[12px] text-[#ADADAD]">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[#ADADAD] uppercase tracking-wide">
                    Order
                  </span>
                  <StatusBadge value={order.status} styleMap={STATUS_STYLES} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[#ADADAD] uppercase tracking-wide">
                    Payment
                  </span>
                  <StatusBadge
                    value={order.payment_status}
                    styleMap={PAYMENT_STATUS_STYLES}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#F5F5F5]">
              {order.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#0F0F0F] truncate">
                      {item.product_name}
                    </p>
                    {item.variant_attributes && (
                      <p className="text-[11px] text-[#ADADAD]">
                        {Object.entries(item.variant_attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-medium text-[#0F0F0F]">
                      ₱{item.subtotal.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#ADADAD]">
                      qty {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="px-5 py-2.5">
                  <p className="text-[12px] text-[#ADADAD]">
                    +{order.items.length - 3} more item
                    {order.items.length - 3 > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#FAFAFA] border-t border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 text-[12px] text-[#ADADAD]">
                <CreditCard className="h-3.5 w-3.5" />
                {order.payment_method?.replace(/_/g, " ") ?? "—"}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-[#0F0F0F]">
                  ₱{order.total.toLocaleString()}
                </p>
                <ChevronRight className="h-4 w-4 text-[#ADADAD]" />
              </div>
            </div>
            {reorderMsg && reorderingId === null && (
              <div className="px-5 py-2 text-[12px] text-green-600 bg-green-50 border-t border-green-100">
                {reorderMsg}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ user }: { user: UserWithRole }) {
  const [showNewPw, setShowNewPw] = useState(false);
  const inputCls =
    "h-10 text-[14px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all";

  // Two-step password change state
  const [requestState, requestAction] = useActionState<
    PasswordChangeState,
    FormData
  >(requestPasswordChangeOTP, { status: "idle" });
  const [verifyState, verifyAction] = useActionState<
    PasswordChangeState,
    FormData
  >(verifyPasswordChangeOTP, { status: "idle" });

  const otpStep = requestState.status === "otp_sent";
  const passwordChanged = verifyState.status === "success";

  // OTP digit boxes
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpBoxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpBoxRefs.current[index + 1]?.focus();
  };

  const handleOtpDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpBoxRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpDigitPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtpDigits(next);
    otpBoxRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Age verification state
  const [ageVerifStatus, setAgeVerifStatus] = useState<null | {
    verified_at: string | null;
    rejection_reason: string | null;
  }>(null);
  const [ageVerifLoading, setAgeVerifLoading] = useState(true);
  const [ageVerifSubmitting, setAgeVerifSubmitting] = useState(false);
  const [ageVerifError, setAgeVerifError] = useState<string | null>(null);
  const [ageVerifSuccess, setAgeVerifSuccess] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    getMyVerificationStatus()
      .then((res) => {
        if (res.success && res.data) {
          setAgeVerifStatus(
            res.data as {
              verified_at: string | null;
              rejection_reason: string | null;
            }
          );
        }
        setAgeVerifLoading(false);
      })
      .catch(() => setAgeVerifLoading(false));
  }, []);

  const handleAgeVerifSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedFile || !consentTerms || !consentPrivacy) return;
      setAgeVerifSubmitting(true);
      setAgeVerifError(null);
      const fd = new FormData();
      fd.append("idDocument", selectedFile);
      fd.append("consentToTerms", "true");
      fd.append("consentToPrivacy", "true");
      const result = await submitAgeVerification(fd);
      setAgeVerifSubmitting(false);
      if (result.success) {
        setAgeVerifSuccess(true);
      } else {
        setAgeVerifError(
          result.message ?? "Failed to submit. Please try again."
        );
      }
    },
    [selectedFile, consentTerms, consentPrivacy]
  );

  const isVerified = user.is_verified;
  const isPending =
    !isVerified &&
    (ageVerifSuccess ||
      (ageVerifStatus &&
        !ageVerifStatus.verified_at &&
        !ageVerifStatus.rejection_reason));
  const isRejected =
    !isVerified && ageVerifStatus && ageVerifStatus.rejection_reason;

  return (
    <div className="space-y-6">
      {/* Edit profile */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <p className="font-semibold text-[#0F0F0F] text-[15px]">
            Edit Profile
          </p>
          <p className="text-[13px] text-[#ADADAD]">
            Update your personal information
          </p>
        </div>
        <form action={updateProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.first_name}
                required
                readOnly
                className={cn(inputCls, "bg-[#F9F9F9] cursor-not-allowed")}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.last_name}
                required
                readOnly
                className={cn(inputCls, "bg-[#F9F9F9] cursor-not-allowed")}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="middleName"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Middle Name
              </Label>
              <Input
                id="middleName"
                name="middleName"
                defaultValue={user.middle_name ?? ""}
                readOnly
                className={cn(inputCls, "bg-[#F9F9F9] cursor-not-allowed")}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="suffix"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Suffix
              </Label>
              <Input
                id="suffix"
                name="suffix"
                defaultValue={user.suffix ?? ""}
                placeholder="Jr., Sr., III"
                readOnly
                className={cn(inputCls, "bg-[#F9F9F9] cursor-not-allowed")}
              />
            </div>
            <p className="text-[11px] text-[#ADADAD] -mt-2 sm:col-span-2">
              Name fields are locked to match your verification ID.
            </p>
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="contactNumber"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Contact Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  defaultValue={user.contact_number}
                  required
                  className={cn(inputCls, "pl-9")}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <SaveButton label="Save Profile" />
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5]">
          <p className="font-semibold text-[#0F0F0F] text-[15px]">
            Change Password
          </p>
          <p className="text-[13px] text-[#ADADAD]">Keep your account secure</p>
        </div>

        {passwordChanged ? (
          /* ── Success state ── */
          <div className="p-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="font-semibold text-[#0F0F0F]">Password changed!</p>
            <p className="text-[13px] text-[#ADADAD]">
              Your password has been updated successfully.
            </p>
          </div>
        ) : !otpStep ? (
          /* ── Step 1: Enter current + new passwords ── */
          <form action={requestAction} className="p-6 space-y-4">
            {requestState.status === "error" && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-[13px] text-red-700">
                  {requestState.message}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label
                htmlFor="newPassword"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPw ? "text" : "password"}
                  minLength={6}
                  required
                  className={cn(inputCls, "pl-9 pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#3D3D3D] transition-colors text-xs"
                >
                  {showNewPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmPassword"
                className="text-[13px] font-medium text-[#3D3D3D]"
              >
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD]" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={cn(inputCls, "pl-9")}
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <SaveButton label="Send Verification Code" />
            </div>
          </form>
        ) : (
          /* ── Step 2: Enter OTP ── */
          <div className="p-6 space-y-5">
            {/* Email hint */}
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <Mail className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[13px] text-blue-700">
                A 6-digit verification code was sent to{" "}
                <strong>
                  {requestState.status === "otp_sent"
                    ? requestState.email
                    : "your email"}
                </strong>
                . It expires in 10 minutes.
              </p>
            </div>

            <form action={verifyAction} className="space-y-4">
              {verifyState.status === "error" && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-red-700">
                    {verifyState.message}
                  </p>
                </div>
              )}
              {/* Hidden input carries the joined OTP value to the server action */}
              <input type="hidden" name="otp" value={otpDigits.join("")} />

              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-[#3D3D3D]">
                  Verification Code
                </Label>
                <div className="flex gap-2" onPaste={handleOtpDigitPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpBoxRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      autoFocus={i === 0}
                      onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpDigitKeyDown(i, e)}
                      className="w-full h-12 text-center text-[20px] font-semibold text-[#0F0F0F] border-[1.5px] border-[#E8E8E8] rounded-xl bg-white outline-none transition-all duration-150 focus:border-[#0A0A0A] focus:-translate-y-px focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] caret-transparent"
                    />
                  ))}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    // reset by submitting a blank form to requestAction (triggers re-request)
                    // simplest: reload the page state via action
                    window.location.reload()
                  }
                  className="flex items-center gap-1.5 text-[13px] text-[#ADADAD] hover:text-[#3D3D3D] transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Start over
                </button>
                <SaveButton label="Verify & Change Password" />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Age Verification */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F5F5] flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#0F0F0F] text-[15px]">
              Age Verification
            </p>
            <p className="text-[13px] text-[#ADADAD]">
              Verify your age to access all products
            </p>
          </div>
          {isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 border border-green-200 px-3 py-1 text-[12px] font-semibold text-green-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
          {isPending && !isVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[12px] font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Pending Review
            </span>
          )}
        </div>

        <div className="p-6">
          {ageVerifLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#ADADAD]" />
            </div>
          ) : isVerified ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <ShieldCheck className="h-6 w-6 text-green-500" />
              </div>
              <p className="font-semibold text-[#0F0F0F]">
                You&apos;re verified!
              </p>
              <p className="text-[13px] text-[#ADADAD]">
                Your age has been verified. You have full access to all
                products.
              </p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <p className="font-semibold text-[#0F0F0F]">Under Review</p>
              <p className="text-[13px] text-[#ADADAD]">
                Your ID has been submitted and is awaiting admin review. This
                usually takes 1–2 business days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAgeVerifSubmit} className="space-y-4">
              {isRejected && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-red-700">
                      Previous submission rejected
                    </p>
                    <p className="text-[12px] text-red-600 mt-0.5">
                      {ageVerifStatus?.rejection_reason ??
                        "Your previous ID submission was not accepted. Please upload a valid government-issued ID."}
                    </p>
                  </div>
                </div>
              )}
              {ageVerifError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-red-700">{ageVerifError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-[#3D3D3D]">
                  Upload ID
                </Label>
                <div
                  className="border-2 border-dashed border-[#E8E8E8] rounded-xl p-6 text-center cursor-pointer hover:border-[#0A0A0A] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-[#0A0A0A]" />
                      <span className="text-[13px] font-medium text-[#0A0A0A] truncate max-w-50">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-7 w-7 text-[#ADADAD]" />
                      <p className="text-[13px] text-[#ADADAD]">
                        Click to upload your ID
                      </p>
                      <p className="text-[11px] text-[#CDCDCD]">
                        JPG, PNG or PDF — max 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={(e) => setConsentTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E8E8E8] accent-[#0A0A0A]"
                  />
                  <span className="text-[12px] text-[#3D3D3D]">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="underline text-[#0A0A0A]"
                      target="_blank"
                    >
                      Terms &amp; Conditions
                    </a>{" "}
                    and confirm that I am at least 18 years old.
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={(e) => setConsentPrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[#E8E8E8] accent-[#0A0A0A]"
                  />
                  <span className="text-[12px] text-[#3D3D3D]">
                    I consent to the processing of my ID document as outlined in
                    the{" "}
                    <a
                      href="/privacy"
                      className="underline text-[#0A0A0A]"
                      target="_blank"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    ageVerifSubmitting ||
                    !selectedFile ||
                    !consentTerms ||
                    !consentPrivacy
                  }
                  className="h-10 px-6 rounded-xl bg-[#0A0A0A] hover:bg-[#222] text-white text-[13px] font-semibold disabled:opacity-50"
                >
                  {ageVerifSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Alerts (reads URL params) ─────────────────────────────────────────────────

function Alerts() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-[13px] text-green-700">{message}</p>
        </div>
      )}
    </>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function ProfileClient({
  user,
  orders,
  defaultTab = "overview",
}: {
  user: UserWithRole;
  orders: ProfileOrder[];
  defaultTab?: Tab;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 max-w-3xl">
        {/* Alerts */}
        <Suspense fallback={null}>
          <Alerts />
        </Suspense>

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F0F0F] tracking-tight">
            My Account
          </h1>
          <p className="text-[14px] text-[#ADADAD] mt-0.5">
            Manage your profile, orders and settings
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl bg-white border border-[#EBEBEB] p-1.5 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all",
                activeTab === id
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "text-[#888] hover:text-[#0F0F0F]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab user={user} />}
        {activeTab === "orders" && <OrdersTab orders={orders} />}
        {activeTab === "settings" && <SettingsTab user={user} />}
      </div>
    </div>
  );
}
