"use client";

import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItemQuantity,
} from "@/app/actions/cart";
import { queryKeys } from "@/lib/queries/keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Get user's cart with items and summary
 */
export const useCart = () => {
  return useQuery({
    queryKey: queryKeys.cart.detail(),
    queryFn: async () => {
      const result = await getCart();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch cart");
      }
      return result.data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Add item to cart with optimistic update
 */
export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      quantity,
    }: {
      productId: string;
      variantId?: string;
      quantity: number;
    }) => {
      const result = await addToCart({ productId, variantId, quantity });
      if (!result.success) {
        throw new Error(result.error || "Failed to add to cart");
      }
      return result.data;
    },
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail() });

      // Snapshot previous value
      const previousCart = queryClient.getQueryData(queryKeys.cart.detail());

      // Optimistically update cart count
      queryClient.setQueryData(queryKeys.cart.detail(), (old: any) => {
        if (!old) return old;

        return {
          ...old,
          summary: {
            ...old.summary,
            itemCount: old.summary.itemCount + newItem.quantity,
          },
        };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.detail(), context.previousCart);
      }
      toast.error(error.message || "Failed to add to cart");
    },
    onSuccess: () => {
      toast.success("Added to cart");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
};

/**
 * Update cart item quantity
 */
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cartItemId,
      quantity,
    }: {
      cartItemId: string;
      quantity: number;
    }) => {
      const result = await updateCartItemQuantity(cartItemId, quantity);
      if (!result.success) {
        throw new Error(result.error || "Failed to update cart");
      }
      return result.data;
    },
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail() });
      const previousCart = queryClient.getQueryData(queryKeys.cart.detail());

      // Optimistically update
      queryClient.setQueryData(queryKeys.cart.detail(), (old: any) => {
        if (!old) return old;

        const items = old.items.map((item: any) => {
          if (item.id === cartItemId) {
            return { ...item, quantity };
          }
          return item;
        });

        const itemCount = items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );

        return {
          ...old,
          items,
          summary: {
            ...old.summary,
            itemCount,
          },
        };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.detail(), context.previousCart);
      }
      toast.error(error.message || "Failed to update quantity");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
};

/**
 * Remove item from cart
 */
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const result = await removeFromCart(cartItemId);
      if (!result.success) {
        throw new Error(result.error || "Failed to remove item");
      }
      return result.data;
    },
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.detail() });
      const previousCart = queryClient.getQueryData(queryKeys.cart.detail());

      // Optimistically remove item
      queryClient.setQueryData(queryKeys.cart.detail(), (old: any) => {
        if (!old) return old;

        const items = old.items.filter((item: any) => item.id !== cartItemId);
        const itemCount = items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );

        return {
          ...old,
          items,
          summary: {
            ...old.summary,
            itemCount,
          },
        };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.detail(), context.previousCart);
      }
      toast.error(error.message || "Failed to remove item");
    },
    onSuccess: () => {
      toast.success("Item removed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
    },
  });
};

/**
 * Clear entire cart
 */
export const useClearCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await clearCart();
      if (!result.success) {
        throw new Error(result.error || "Failed to clear cart");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
      toast.success("Cart cleared");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clear cart");
    },
  });
};
