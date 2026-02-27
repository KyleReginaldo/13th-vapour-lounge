"use server";

import {
  applyPagination,
  error,
  ErrorCode,
  getPaginationMeta,
  success,
  withErrorHandling,
  type ActionResponse,
  type PaginatedResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sanitizeHTML } from "@/lib/validations/sanitize";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const submitReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(5).max(200),
  comment: z.string().min(10).max(2000),
  imageIds: z.array(z.string().uuid()).max(5).optional(),
});

/**
 * Customer submits a review for a purchased product
 */
export const submitReview = withErrorHandling(
  async (
    input: z.infer<typeof submitReviewSchema>
  ): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const validated = submitReviewSchema.parse(input);

    // Check if user purchased this product
    const { data: userOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_id", user.id)
      .eq("payment_status", "paid");

    const orderIds = userOrders?.map((order) => order.id) || [];

    if (orderIds.length === 0) {
      return error(
        "You can only review products you have purchased",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", validated.productId)
      .in("order_id", orderIds);

    if (!count || count === 0) {
      return error(
        "You can only review products you have purchased",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check for duplicate review
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", validated.productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return error(
        "You have already reviewed this product",
        ErrorCode.CONFLICT
      );
    }

    // Create review
    const { data: review, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: validated.productId,
        user_id: user.id,
        rating: validated.rating,
        title: sanitizeHTML(validated.title),
        comment: sanitizeHTML(validated.comment),
        images: validated.imageIds || [],
        is_approved: false, // Requires moderation
      })
      .select()
      .single();

    if (insertError) {
      return error("Failed to submit review", ErrorCode.SERVER_ERROR);
    }

    revalidatePath(`/products/${validated.productId}`);

    return success(
      review,
      "Review submitted successfully. It will be visible after moderation."
    );
  }
);

/**
 * Get approved reviews for a product (customer-facing)
 */
export const getProductReviews = withErrorHandling(
  async (
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    const supabase = createServiceClient();

    const offset = (page - 1) * limit;

    const {
      data,
      count,
      error: fetchError,
    } = await supabase
      .from("product_reviews")
      .select(
        `
        *,
        users!user_id (
          first_name,
          last_name
        )
      `,
        { count: "exact" }
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return error("Failed to fetch reviews", ErrorCode.SERVER_ERROR);
    }

    // Calculate average rating (approved, visible reviews only)
    const { data: stats } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .eq("is_hidden", false);

    const avgRating =
      stats && stats.length > 0
        ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length
        : 0;

    return success({
      data: data || [],
      pagination: getPaginationMeta(page, limit, count || 0),
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: count || 0,
    });
  }
);

/**
 * Vote review as helpful (Feature disabled - review_helpfulness table not in schema)
 */
export const voteReviewHelpful = withErrorHandling(
  async (reviewId: string, helpful: boolean): Promise<ActionResponse> => {
    return error("Feature not available", ErrorCode.SERVER_ERROR);

    /* Commented out - review_helpfulness table doesn't exist in schema
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from("review_helpfulness")
      .select("id, is_helpful")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVote) {
      // Update existing vote
      if (existingVote.is_helpful === helpful) {
        // Remove vote if same
        await supabase
          .from("review_helpfulness")
          .delete()
          .eq("id", existingVote.id);
        return success(null, "Vote removed");
      } else {
        // Change vote
        await supabase
          .from("review_helpfulness")
          .update({ is_helpful: helpful })
          .eq("id", existingVote.id);
        return success(null, "Vote updated");
      }
    }

    // Insert new vote
    const { error: insertError } = await supabase
      .from("review_helpfulness")
      .insert({
        review_id: reviewId,
        user_id: user.id,
        is_helpful: helpful,
      });

    if (insertError) {
      return error("Failed to record vote", ErrorCode.SERVER_ERROR);
    }

    return success(null, "Vote recorded");
    */
  }
);

/**
 * Get review helpfulness counts (Feature disabled - review_helpfulness table not in schema)
 */
export const getReviewHelpfulness = withErrorHandling(
  async (reviewId: string): Promise<ActionResponse> => {
    return success({
      helpfulCount: 0,
      notHelpfulCount: 0,
    });

    /* Commented out - review_helpfulness table doesn't exist in schema
    const supabase = await createClient();

    const { count: helpfulCount } = await supabase
      .from("review_helpfulness")
      .select("id", { count: "exact", head: true })
      .eq("review_id", reviewId)
      .eq("is_helpful", true);

    const { count: notHelpfulCount } = await supabase
      .from("review_helpfulness")
      .select("id", { count: "exact", head: true })
      .eq("review_id", reviewId)
      .eq("is_helpful", false);

    return success({
      helpfulCount: helpfulCount || 0,
      notHelpfulCount: notHelpfulCount || 0,
    });
    */
  }
);

/**
 * Get reviews with pagination and filters
 */
export const getReviews = withErrorHandling(
  async (
    page: number = 1,
    pageSize: number = 20,
    filters?: { is_approved?: boolean; is_hidden?: boolean }
  ): Promise<ActionResponse<PaginatedResponse<any>>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    let query = supabase.from("product_reviews").select(
      `
        *,
        user:user_id(first_name, last_name, email),
        product:product_id(id, name, images, category)
      `,
      { count: "exact" }
    );

    if (filters?.is_approved !== undefined) {
      query = query.eq("is_approved", filters.is_approved);
    }
    if (filters?.is_hidden !== undefined) {
      query = query.eq("is_hidden", filters.is_hidden);
    }

    query = applyPagination(query, page, pageSize);
    query = query.order("created_at", { ascending: false });

    const { data, error: fetchError, count } = await query;

    if (fetchError) return error(fetchError.message);

    return success({
      data: data || [],
      pagination: getPaginationMeta(count || 0, page, pageSize),
    });
  }
);

/**
 * Approve review
 */
export const approveReview = withErrorHandling(
  async (reviewId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: review, error: updateError } = await supabase
      .from("product_reviews")
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    await logAudit({
      action: "update",
      entityType: "product", // Using existing entity type
      entityId: reviewId,
      newValue: { is_approved: true },
    });

    revalidatePath("/admin/reviews");
    return success(review, "Review approved");
  }
);

/**
 * Hide review
 */
export const hideReview = withErrorHandling(
  async (reviewId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: review, error: updateError } = await supabase
      .from("product_reviews")
      .update({ is_hidden: true, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/reviews");
    return success(review, "Review hidden");
  }
);

/**
 * Unhide review
 */
export const unhideReview = withErrorHandling(
  async (reviewId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data: review, error: updateError } = await supabase
      .from("product_reviews")
      .update({ is_hidden: false, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/reviews");
    return success(review, "Review unhidden");
  }
);

/**
 * Delete review
 */
export const deleteReview = withErrorHandling(
  async (reviewId: string): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data: review } = await supabase
      .from("product_reviews")
      .select()
      .eq("id", reviewId)
      .single();

    if (!review) {
      return error("Review not found", ErrorCode.NOT_FOUND);
    }

    const { error: deleteError } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) return error(deleteError.message);

    await logAudit({
      action: "delete",
      entityType: "product", // Using existing entity type
      entityId: reviewId,
      oldValue: review,
    });

    revalidatePath("/admin/reviews");
    return success(null, "Review deleted");
  }
);

/**
 * Bulk approve reviews
 */
export const bulkApproveReviews = withErrorHandling(
  async (reviewIds: string[]): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    const { data, error: updateError } = await supabase
      .from("product_reviews")
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .in("id", reviewIds)
      .select();

    if (updateError) return error(updateError.message);

    revalidatePath("/admin/reviews");
    return success(data, `${reviewIds.length} reviews approved`);
  }
);

/**
 * Get completed/delivered orders that have unreviewed items (for review prompt)
 */
export const getUnreviewedOrders = withErrorHandling(
  async (): Promise<
    ActionResponse<
      {
        orderId: string;
        orderNumber: string;
        completedAt: string | null;
        items: {
          productId: string;
          productName: string;
          productSlug: string | null;
        }[];
      }[]
    >
  > => {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return success([]);

    // Get completed/delivered orders
    const { data: orders } = await supabase
      .from("orders")
      .select(
        `id, order_number, created_at,
         order_items(product_id, product_name, products(slug))`
      )
      .eq("customer_id", user.id)
      .in("status", ["completed", "delivered"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (!orders || orders.length === 0) return success([]);

    // Get already-reviewed (product_id, order_id) pairs for this user
    const { data: reviewed } = await serviceSupabase
      .from("product_reviews")
      .select("product_id, order_id")
      .eq("user_id", user.id);

    // Compound key: "<productId>:<orderId>"
    const reviewedKeys = new Set(
      (reviewed || [])
        .filter((r) => r.product_id && r.order_id)
        .map((r) => `${r.product_id}:${r.order_id}`)
    );

    const result = orders
      .map((order: any) => {
        const unreviewedItems = (order.order_items || [])
          .filter(
            (item: any) =>
              item.product_id &&
              !reviewedKeys.has(`${item.product_id}:${order.id}`)
          )
          .map((item: any) => ({
            productId: item.product_id,
            productName: item.product_name,
            productSlug: item.products?.slug ?? null,
          }));
        return {
          orderId: order.id,
          orderNumber: order.order_number,
          completedAt: order.created_at,
          items: unreviewedItems,
        };
      })
      .filter((o: any) => o.items.length > 0);

    return success(result);
  }
);

export const submitProductReview = withErrorHandling(
  async (input: {
    productId: string;
    orderId: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return error("You must be logged in", ErrorCode.UNAUTHORIZED);

    // Check the order belongs to this user and is completed/delivered
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", input.orderId)
      .eq("customer_id", user.id)
      .in("status", ["completed", "delivered"])
      .maybeSingle();

    if (!order) {
      return error(
        "Order not found or not yet completed",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Check for duplicate review for this specific order + product
    const { data: existing } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", input.productId)
      .eq("user_id", user.id)
      .eq("order_id", input.orderId)
      .maybeSingle();

    if (existing) {
      return error(
        "You have already reviewed this product for this order",
        ErrorCode.CONFLICT
      );
    }

    const { error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: input.productId,
        user_id: user.id,
        order_id: input.orderId,
        rating: input.rating,
        title: input.title.trim(),
        review_text: input.comment.trim(),
        verified_purchase: true,
        is_approved: true,
        images: input.images?.length ? input.images : null,
      });

    if (insertError) {
      return error(
        `Failed to submit review: ${insertError.message}`,
        ErrorCode.SERVER_ERROR
      );
    }

    revalidatePath("/profile");
    revalidatePath("/");
    revalidatePath("/products", "layout");
    return success(null, "Review submitted successfully!");
  }
);
