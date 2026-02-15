"use client";

import { useCart } from "@/lib/queries/cart";
import { cn } from "@/lib/utils";

interface CartBadgeProps {
  className?: string;
}

export const CartBadge = ({ className }: CartBadgeProps) => {
  const { data: cart } = useCart();
  const itemCount = cart?.summary?.itemCount || 0;

  if (itemCount === 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-2 -right-2",
        "flex items-center justify-center",
        "min-w-5 h-5 px-1.5",
        "bg-red-500 text-white text-[11px] font-bold",
        "rounded-full border-2 border-white dark:border-gray-900",
        "animate-in zoom-in-50 duration-200",
        className
      )}
    >
      {itemCount > 99 ? "99+" : itemCount}
    </span>
  );
};
