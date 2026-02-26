"use client";

import { uploadReviewImage } from "@/app/actions/images";
import { submitProductReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
const REVIEWED_KEY = "review_prompt_reviewed_keys"; // compound "productId:orderId"
const DISMISS_HOURS = 24;
const MAX_IMAGES = 3;

function getReviewedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(REVIEWED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReviewedKey(productId: string, orderId: string) {
  try {
    const existing = getReviewedKeys();
    existing.add(`${productId}:${orderId}`);
    localStorage.setItem(REVIEWED_KEY, JSON.stringify([...existing]));
  } catch {}
}

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
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  // image upload state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allItems = unreviewedOrders.flatMap((o) =>
    o.items.map((item) => ({
      ...item,
      orderId: o.orderId,
      orderNumber: o.orderNumber,
    }))
  );
  const pendingItems = allItems.filter(
    (i) => !skipped.has(`${i.productId}:${i.orderId}`)
  );
  const current = pendingItems[0] ?? null;

  // Merge localStorage reviewed keys so already-reviewed order+product combos never re-show
  useEffect(() => {
    const reviewed = getReviewedKeys();
    if (reviewed.size > 0) {
      setSkipped((prev) => new Set([...prev, ...reviewed]));
    }
  }, []);

  useEffect(() => {
    if (!pendingItems.length) return;
    // Show at most once per DISMISS_HOURS
    const ts = localStorage.getItem(DISMISSED_KEY);
    if (ts) {
      const hours = (Date.now() - Number(ts)) / 3_600_000;
      if (hours < DISMISS_HOURS) return;
    }
    // Small delay so it doesn't pop instantly on page load
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingItems.length]);

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
    setImageUrls([]);
  };

  // ── Image upload ─────────────────────────────────────────────────────────

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const remaining = MAX_IMAGES - imageUrls.length;
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
    if (uploaded.length) {
      setImageUrls((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
    }
    const failed = batch.length - uploaded.length;
    if (failed > 0) {
      setError(`${failed} image(s) failed to upload. Please try again.`);
    }
  };

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSkip = () => {
    if (!current) return;
    const next = new Set(skipped);
    next.add(`${current.productId}:${current.orderId}`);
    setSkipped(next);
    reset();
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
    if (uploadingCount > 0) {
      setError("Please wait for images to finish uploading.");
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
      images: imageUrls.length ? imageUrls : undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Failed to submit review.");
      return;
    }

    // Persist to localStorage so re-renders never re-show this order+product combo
    saveReviewedKey(current.productId, current.orderId);

    setSuccess(true);
    setTimeout(() => {
      const next = new Set(skipped);
      next.add(`${current.productId}:${current.orderId}`);
      setSkipped(next);
      reset();
      if (pendingItems.length <= 1) setOpen(false);
    }, 1400);
  };

  if (!current) return null;

  const remaining = pendingItems.length;
  const canAddMore = imageUrls.length < MAX_IMAGES;

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
                Your review is now live on the product page.
              </p>
            </div>
          ) : (
            <>
              {/* Stars + Photos row */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-[#3D3D3D]">
                    Your rating
                  </p>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* Photos inline */}
                <div className="space-y-1.5">
                  <p className="text-[13px] font-medium text-[#3D3D3D]">
                    Photos{" "}
                    <span className="font-normal text-[#ADADAD] text-[11px]">
                      (up to {MAX_IMAGES})
                    </span>
                  </p>
                  <div className="flex gap-1.5">
                    {imageUrls.map((url) => (
                      <div
                        key={url}
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E8E8E8] group shrink-0"
                      >
                        <Image
                          src={url}
                          alt="Review photo"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}

                    {Array.from({ length: uploadingCount }).map((_, i) => (
                      <div
                        key={`uploading-${i}`}
                        className="w-14 h-14 rounded-lg border border-dashed border-[#E8E8E8] bg-[#FAFAFA] flex items-center justify-center shrink-0"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-[#ADADAD]" />
                      </div>
                    ))}

                    {canAddMore && (
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
                  rows={2}
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
          <div className="px-6 pb-5 pt-4 flex items-center gap-2 border-t border-[#F5F5F5]">
            <button
              onClick={handleSkip}
              className="flex-1 h-10 rounded-xl border border-[#E8E8E8] text-[13px] font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            >
              Skip
            </button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || uploadingCount > 0}
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
