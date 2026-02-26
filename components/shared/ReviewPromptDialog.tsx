"use client";

import { submitProductReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Loader2, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

type UnreviewedOrder = {
  orderId: string;
  orderNumber: string;
  completedAt: string | null;
  items: {
    productId: string;
    productName: string;
    productSlug: string | null;
  }[];
};

const DISMISSED_KEY = "review_prompt_dismissed_at";
const DISMISS_HOURS = 24;

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${
              star <= (hovered || value)
                ? "text-amber-400 fill-amber-400"
                : "text-[#E0E0E0]"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewPromptDialog({
  unreviewedOrders,
}: {
  unreviewedOrders: UnreviewedOrder[];
}) {
  const [open, setOpen] = useState(false);
  const [orderIdx, setOrderIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const allItems = unreviewedOrders.flatMap((o) =>
    o.items.map((item) => ({
      ...item,
      orderId: o.orderId,
      orderNumber: o.orderNumber,
    }))
  );
  const pendingItems = allItems.filter((i) => !skipped.has(i.productId));
  const current = pendingItems[0] ?? null;

  useEffect(() => {
    if (!unreviewedOrders.length) return;
    // Show at most once per DISMISS_HOURS
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (ts) {
      const hours = (Date.now() - Number(ts)) / 3_600_000;
      if (hours < DISMISS_HOURS) return;
    }
    // Small delay so it doesn't pop instantly on page load
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [unreviewedOrders.length]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  };

  const reset = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setError(null);
    setSuccess(false);
  };

  const handleSkip = () => {
    if (!current) return;
    const next = skipped;
    next.add(current.productId);
    setSkipped(new Set(next));
    reset();
    // Close without 24h suppress when all items handled
    if (pendingItems.length <= 1) setOpen(false);
  };

  const handleSubmit = async () => {
    if (!current) return;
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (comment.trim().length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const order = unreviewedOrders.find((o) =>
      o.items.some((i) => i.productId === current.productId)
    );

    const result = await submitProductReview({
      productId: current.productId,
      orderId: order!.orderId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Failed to submit review.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      const next = new Set(skipped);
      next.add(current.productId);
      setSkipped(next);
      reset();
      // Close without 24h suppress — show again next visit if more items
      if (pendingItems.length <= 1) setOpen(false);
    }, 1400);
  };

  if (!current) return null;

  const remaining = pendingItems.length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md p-0 gap-0 overflow-hidden rounded-2xl border border-[#EBEBEB]"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#F5F5F5]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-[15px] font-semibold text-[#0F0F0F]">
                How was your order?
              </DialogTitle>
              <p className="text-[12px] text-[#ADADAD] mt-0.5">
                {remaining > 1
                  ? `${remaining} products waiting for your review`
                  : "1 product waiting for your review"}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="rounded-lg p-1 hover:bg-[#F5F5F5] transition-colors text-[#ADADAD] hover:text-[#3D3D3D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Product name */}
          <div className="rounded-xl bg-[#FAFAFA] border border-[#F0F0F0] px-4 py-3">
            <p className="text-[11px] font-medium text-[#ADADAD] uppercase tracking-wider mb-0.5">
              Reviewing
            </p>
            <p className="text-[14px] font-semibold text-[#0F0F0F] line-clamp-2">
              {current.productName}
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-semibold text-[#0F0F0F]">Review submitted!</p>
              <p className="text-[13px] text-[#ADADAD]">
                It will be visible after moderation.
              </p>
            </div>
          ) : (
            <>
              {/* Stars */}
              <div className="space-y-1.5">
                <p className="text-[13px] font-medium text-[#3D3D3D]">
                  Your rating
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#3D3D3D]">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={200}
                  className="w-full h-10 px-3 text-[13px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#3D3D3D]">
                  Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others what you think about this product..."
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2.5 text-[13px] rounded-xl border-[1.5px] border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] focus:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] transition-all resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 pb-5 flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="flex-1 h-10 rounded-xl border border-[#E8E8E8] text-[13px] font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            >
              Skip
            </button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-[#0A0A0A] hover:bg-[#1A1A1A] text-white text-[13px] font-semibold disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
