"use client";

import { getProductReviews } from "@/app/actions/reviews";
import { RatingStars } from "@/components/product/RatingStars";
import { Button } from "@/components/ui/button";
import { Loader2, Star, UserCircle2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  images: string[] | null;
  created_at: string | null;
  verified_purchase: boolean | null;
  users: { first_name: string | null; last_name: string | null } | null;
};

type Props = {
  productId: string;
  initialReviews: Review[];
  initialTotal: number;
  averageRating: number;
};

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[#6B6B6B] w-3 shrink-0">{star}</span>
      <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[12px] text-[#ADADAD] w-6 text-right shrink-0">
        {count}
      </span>
    </div>
  );
}

export function ProductReviewsSection({
  productId,
  initialReviews,
  initialTotal,
  averageRating,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const hasMore = reviews.length < total;

  const loadMore = async () => {
    setLoading(true);
    const next = page + 1;
    const res = await getProductReviews(productId, next, PAGE_SIZE);
    setLoading(false);
    if (res.success && res.data) {
      const data = res.data as any;
      setReviews((prev) => [...prev, ...(data?.data ?? [])]);
      setTotal(data?.totalReviews ?? total);
      setPage(next);
    }
  };

  // Distribution per star
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="space-y-8">
      {/* Overall stats */}
      <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-[#EBEBEB] bg-white">
        {/* Score */}
        <div className="flex flex-col items-center justify-center gap-1 sm:min-w-[120px]">
          <span className="text-5xl font-extrabold text-[#0A0A0A] leading-none">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </span>
          <RatingStars
            rating={averageRating}
            totalReviews={null}
            showCount={false}
            size="md"
          />
          <span className="text-[13px] text-[#ADADAD]">
            {total} {total === 1 ? "review" : "reviews"}
          </span>
        </div>

        {/* Bars */}
        {total > 0 && (
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {dist.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={total} />
            ))}
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-[#EBEBEB] p-12 text-center">
          <p className="text-[#ADADAD] text-[14px]">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const name = [review.users?.first_name, review.users?.last_name]
              .filter(Boolean)
              .join(" ");
            const date = review.created_at
              ? new Date(review.created_at).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null;

            return (
              <div
                key={review.id}
                className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#F5F5F5] flex items-center justify-center shrink-0">
                      <UserCircle2 className="h-5 w-5 text-[#ADADAD]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F0F0F] leading-none">
                        {name || "Anonymous"}
                      </p>
                      {date && (
                        <p className="text-[11px] text-[#ADADAD] mt-0.5">
                          {date}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <RatingStars
                      rating={review.rating}
                      showCount={false}
                      size="sm"
                    />
                    {review.verified_purchase && (
                      <span className="text-[11px] font-medium text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Title + text */}
                {review.title && (
                  <p className="text-[14px] font-semibold text-[#0F0F0F]">
                    {review.title}
                  </p>
                )}
                {review.review_text && (
                  <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                    {review.review_text}
                  </p>
                )}

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {review.images.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightbox(url)}
                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E8E8E8] hover:opacity-90 transition-opacity"
                      >
                        <Image
                          src={url}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
                className="rounded-xl px-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Load more reviews`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] aspect-square rounded-2xl overflow-hidden">
            <Image
              src={lightbox}
              alt="Review photo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
