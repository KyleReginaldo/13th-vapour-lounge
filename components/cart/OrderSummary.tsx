"use client";

import { cn, formatCurrency } from "@/lib/utils";

interface OrderSummaryProps {
  summary: {
    subtotal: number;
    tax: number;
    shipping?: number;
    total: number;
    itemCount: number;
  };
  className?: string;
}

export const OrderSummary = ({ summary, className }: OrderSummaryProps) => {
  return (
    <div
      className={cn(
        "space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg",
        className
      )}
    >
      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Subtotal ({summary.itemCount}{" "}
          {summary.itemCount === 1 ? "item" : "items"})
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(summary.subtotal)}
        </span>
      </div>

      {/* Shipping */}
      {summary.shipping !== undefined && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {summary.shipping === 0 ? "Free" : formatCurrency(summary.shipping)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Total */}
      <div className="flex justify-between text-base font-semibold">
        <span className="text-gray-900 dark:text-gray-100">Total</span>
        <span className="text-gray-900 dark:text-gray-100">
          {formatCurrency(summary.total)}
        </span>
      </div>
    </div>
  );
};
