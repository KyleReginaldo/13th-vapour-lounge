import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  totalReviews?: number | null;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export const RatingStars = ({
  rating = 0,
  totalReviews = 0,
  size = "sm",
  showCount = true,
  className,
}: RatingStarsProps) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            )}
          />
        ))}
      </div>

      {/* Rating Number */}
      {rating > 0 && (
        <span
          className={cn("font-medium text-foreground", textSizeClasses[size])}
        >
          {rating.toFixed(1)}
        </span>
      )}

      {/* Review Count */}
      {showCount && totalReviews !== null && totalReviews > 0 && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};
