"use client";

import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/lib/queries/cart";
import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity: number;
  disabled?: boolean;
  className?: string;
}

export const AddToCartButton = ({
  productId,
  variantId = null,
  quantity,
  disabled = false,
  className,
}: AddToCartButtonProps) => {
  const addToCart = useAddToCart();
  const { openCart } = useCartStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleClick = async () => {
    if (disabled) return;

    try {
      await addToCart.mutateAsync({
        productId,
        variantId: variantId || undefined,
        quantity,
      });

      // Show success state
      setIsSuccess(true);

      // Open cart drawer after a short delay
      setTimeout(() => {
        openCart();
      }, 500);

      // Reset success state
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleClick}
      disabled={disabled || addToCart.isPending}
      className={cn(
        "w-full transition-all",
        isSuccess && "bg-green-600 hover:bg-green-700",
        className
      )}
    >
      {addToCart.isPending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Adding to cart...
        </>
      ) : isSuccess ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Added to cart
        </>
      ) : (
        <>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to cart
        </>
      )}
    </Button>
  );
};
