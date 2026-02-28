"use client";

import type { Json } from "@/database.types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProductVariant {
  id: string;
  sku: string;
  price: number | null;
  compare_at_price?: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
  attributes: Json;
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onVariantChange: (variantId: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VariantSelector = ({
  variants,
  selectedVariantId,
  onVariantChange,
  disabled = false,
  className,
}: VariantSelectorProps) => {
  if (variants.length === 0) {
    return null;
  }

  // Extract unique attribute keys
  const attributeKeys = Array.from(
    new Set(
      variants.flatMap((variant) => {
        const attrs = variant.attributes as Record<string, string> | null;
        return attrs ? Object.keys(attrs) : [];
      })
    )
  );

  // Group variants by attribute for each key
  const getAttributeOptions = (attributeKey: string) => {
    const options = new Map<string, ProductVariant[]>();

    variants.forEach((variant) => {
      const attrs = variant.attributes as Record<string, string> | null;
      const value = attrs?.[attributeKey];
      if (value) {
        if (!options.has(value)) {
          options.set(value, []);
        }
        options.get(value)!.push(variant);
      }
    });

    return Array.from(options.entries()).map(([value, variantList]) => ({
      value,
      variants: variantList,
      isAvailable: variantList.some(
        (v) =>
          v.is_active && (v.stock_quantity === null || v.stock_quantity > 0)
      ),
      // Price from the first active variant for this option
      price: variantList.find((v) => v.is_active)?.price ?? null,
    }));
  };

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const selectedAttrs = selectedVariant?.attributes as Record<
    string,
    string
  > | null;

  return (
    <div className={cn("space-y-6", className)}>
      {attributeKeys.map((attributeKey) => {
        const options = getAttributeOptions(attributeKey);
        const selectedValue = selectedAttrs?.[attributeKey];

        return (
          <div key={attributeKey} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium capitalize">
                {attributeKey.replace(/_/g, " ")}
              </label>
              {selectedValue && (
                <span className="text-sm text-muted-foreground">
                  {selectedValue}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map(({ value, isAvailable, price }) => {
                const isSelected = selectedValue === value;
                const isDisabled = disabled || !isAvailable;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (!isDisabled) {
                        // Find first available variant with this attribute value
                        const variant = variants.find((v) => {
                          const vAttrs = v.attributes as Record<
                            string,
                            string
                          > | null;
                          return (
                            vAttrs?.[attributeKey] === value &&
                            v.is_active &&
                            (v.stock_quantity === null || v.stock_quantity > 0)
                          );
                        });
                        if (variant) {
                          onVariantChange(variant.id);
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "relative min-w-15 rounded-md border-2 px-4 py-2 text-sm font-medium transition-all",
                      "hover:border-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground"
                    )}
                  >
                    <span>{value}</span>
                    {price !== null && (
                      <span className="block text-[10px] font-normal opacity-70 leading-none mt-0.5">
                        ₱{price.toLocaleString()}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="absolute right-1 top-1 h-3 w-3" />
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-px w-full rotate-45 bg-destructive" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="rounded-md border bg-muted/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Selected Variant</p>
            </div>
            {selectedVariant.stock_quantity !== null && (
              <div className="text-right">
                <p className="text-sm font-medium">
                  {selectedVariant.stock_quantity > 0
                    ? `${selectedVariant.stock_quantity} in stock`
                    : "Out of stock"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
