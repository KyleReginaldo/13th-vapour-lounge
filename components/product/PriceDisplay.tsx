import { cn, formatCurrency } from "@/lib/utils";

interface PriceDisplayProps {
  basePrice: number;
  compareAtPrice?: number | null;
  className?: string;
  showCurrency?: boolean;
}

export const PriceDisplay = ({
  basePrice,
  compareAtPrice,
  className,
  showCurrency = true,
}: PriceDisplayProps) => {
  const hasDiscount = compareAtPrice && compareAtPrice > basePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      {/* Current Price */}
      <span className="text-lg font-bold text-primary">
        {formatCurrency(basePrice)}
      </span>

      {/* Original Price (if on sale) */}
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatCurrency(compareAtPrice)}
          </span>
          <span className="text-xs font-medium text-destructive">
            -{discountPercentage}% OFF
          </span>
        </>
      )}
    </div>
  );
};
