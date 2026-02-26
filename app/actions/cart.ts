"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive().max(100),
});

/**
 * Add item to cart
 */
export const addToCart = withErrorHandling(
  async (input: z.infer<typeof addToCartSchema>): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error(
        "You must be logged in to add items to cart",
        ErrorCode.UNAUTHORIZED
      );
    }

    const validated = addToCartSchema.parse(input);

    // Check product exists and get stock info
    const { data: product } = await supabase
      .from("products")
      .select("id, name, has_variants, stock_quantity")
      .eq("id", validated.productId)
      .single();

    if (!product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    // If product has variants, variant ID is required
    if (product.has_variants && !validated.variantId) {
      return error(
        "Please select a product variant",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check stock availability
    let availableStock = 0;
    if (product.has_variants && validated.variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", validated.variantId)
        .single();

      if (!variant) {
        return error("Product variant not found", ErrorCode.NOT_FOUND);
      }
      availableStock = variant.stock_quantity ?? 0;
    } else {
      availableStock = product.stock_quantity ?? 0;
    }

    if (availableStock < validated.quantity) {
      return error(
        `Only ${availableStock} items available in stock`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check if item already in cart
    let existingItemQuery = supabase
      .from("carts")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", validated.productId);

    if (validated.variantId) {
      existingItemQuery = existingItemQuery.eq(
        "variant_id",
        validated.variantId
      );
    } else {
      existingItemQuery = existingItemQuery.is("variant_id", null);
    }

    const { data: existingItem } = await existingItemQuery.maybeSingle();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + validated.quantity;
      if (newQuantity > availableStock) {
        return error(
          `Cannot add ${validated.quantity} more. Only ${availableStock - existingItem.quantity} available`,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const { error: updateError } = await supabase
        .from("carts")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id);

      if (updateError) {
        return error("Failed to update cart", ErrorCode.SERVER_ERROR);
      }
    } else {
      // Insert new cart item
      const { error: insertError } = await supabase.from("carts").insert({
        user_id: user.id,
        product_id: validated.productId,
        variant_id: validated.variantId,
        quantity: validated.quantity,
      });

      if (insertError) {
        return error("Failed to add to cart", ErrorCode.SERVER_ERROR);
      }
    }

    revalidatePath("/cart");
    return success(null, "Added to cart successfully");
  }
);

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = withErrorHandling(
  async (cartItemId: string, quantity: number): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    if (quantity < 1 || quantity > 100) {
      return error(
        "Quantity must be between 1 and 100",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Get cart item with product info
    const { data: cartItem } = await supabase
      .from("carts")
      .select(
        `
        id,
        product_id,
        variant_id,
        products!inner (has_variants, stock_quantity),
        product_variants (stock_quantity)
      `
      )
      .eq("id", cartItemId)
      .eq("user_id", user.id)
      .single();

    if (!cartItem) {
      return error("Cart item not found", ErrorCode.NOT_FOUND);
    }

    // Check stock
    const availableStock = cartItem.product_variants
      ? cartItem.product_variants.stock_quantity
      : cartItem.products.stock_quantity;

    if (quantity > (availableStock ?? 0)) {
      return error(
        `Only ${availableStock} items available`,
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from("carts")
      .update({ quantity })
      .eq("id", cartItemId);

    if (updateError) {
      return error("Failed to update cart", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/cart");
    return success(null, "Cart updated");
  }
);

/**
 * Remove item from cart
 */
export const removeFromCart = withErrorHandling(
  async (cartItemId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const { error: deleteError } = await supabase
      .from("carts")
      .delete()
      .eq("id", cartItemId)
      .eq("user_id", user.id);

    if (deleteError) {
      return error("Failed to remove item", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/cart");
    return success(null, "Item removed from cart");
  }
);

/**
 * Get user's cart with product details
 */
export const getCart = withErrorHandling(async (): Promise<ActionResponse> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return error("You must be logged in", ErrorCode.UNAUTHORIZED);
  }

  const { data, error: fetchError } = await supabase
    .from("carts")
    .select(
      `
        id,
        quantity,
        created_at,
        products!inner (
          id,
          name,
          slug,
          base_price,
          has_variants,
          stock_quantity,
          product_images!inner (url, is_primary)
        ),
        product_variants (
          id,
          sku,
          price,
          stock_quantity,
          attributes
        )
      `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) {
    return error("Failed to fetch cart", ErrorCode.SERVER_ERROR);
  }

  // Calculate cart totals
  const subtotal = data.reduce((sum, item) => {
    const price = item.product_variants?.price || item.products.base_price;
    return sum + price * item.quantity;
  }, 0);

  const total = subtotal;

  return success({
    items: data,
    summary: {
      subtotal,
      tax: 0,
      total,
      itemCount: data.reduce((sum, item) => sum + item.quantity, 0),
    },
  });
});

/**
 * Merge guest cart items into authenticated user's cart
 */
export const mergeGuestCart = withErrorHandling(
  async (
    guestItems: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>
  ): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    for (const item of guestItems) {
      // Check available stock
      let availableStock = 0;
      if (item.variantId) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.variantId)
          .single();
        availableStock = variant?.stock_quantity ?? 0;
      } else {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.productId)
          .single();
        if (!product) continue;
        availableStock = product.stock_quantity ?? 0;
      }

      if (availableStock <= 0) continue;

      // Check if already in DB cart
      let existingQuery = supabase
        .from("carts")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", item.productId);

      if (item.variantId) {
        existingQuery = existingQuery.eq("variant_id", item.variantId);
      } else {
        existingQuery = existingQuery.is("variant_id", null);
      }

      const { data: existing } = await existingQuery.maybeSingle();
      const desiredQty = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        availableStock
      );

      if (existing) {
        await supabase
          .from("carts")
          .update({ quantity: desiredQty })
          .eq("id", existing.id);
      } else {
        await supabase.from("carts").insert({
          user_id: user.id,
          product_id: item.productId,
          variant_id: item.variantId ?? null,
          quantity: desiredQty,
        });
      }
    }

    revalidatePath("/cart");
    return success(null, "Cart merged successfully");
  }
);

/**
 * Clear user's cart
 */
export const clearCart = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const { error: deleteError } = await supabase
      .from("carts")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return error("Failed to clear cart", ErrorCode.SERVER_ERROR);
    }

    revalidatePath("/cart");
    return success(null, "Cart cleared");
  }
);
