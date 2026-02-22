"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  generatePublicFileName,
  validateImageUpload,
} from "@/lib/validations/file-upload";
import { revalidatePath } from "next/cache";

/**
 * Upload product image
 */
export const uploadProductImage = withErrorHandling(
  async (
    productId: string,
    file: File,
    isPrimary: boolean = false
  ): Promise<ActionResponse<{ url: string; imageId: string }>> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Validate file
    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return error(validation.error!, ErrorCode.VALIDATION_ERROR);
    }

    // Verify product exists
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (!product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    // Generate filename
    const fileName = `products/${generatePublicFileName(file.name)}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(fileName, file, {
        cacheControl: "31536000", // 1 year
        upsert: false,
      });

    if (uploadError) {
      return error(
        "Failed to upload image: " + uploadError.message,
        ErrorCode.SERVER_ERROR
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("files")
      .getPublicUrl(fileName);

    // If setting as primary, unset other primary images
    if (isPrimary) {
      await supabase
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", productId);
    }

    // Save to database
    const { data: imageRecord, error: dbError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: urlData.publicUrl,
        is_primary: isPrimary,
        sort_order: 0,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage.from("files").remove([fileName]);
      return error("Failed to save image record", ErrorCode.SERVER_ERROR);
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/products");

    return success({
      url: urlData.publicUrl,
      imageId: imageRecord.id,
    });
  }
);

/**
 * Delete product image
 */
export const deleteProductImage = withErrorHandling(
  async (imageId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get image record
    const { data: image } = await supabase
      .from("product_images")
      .select("url, product_id")
      .eq("id", imageId)
      .single();

    if (!image) {
      return error("Image not found", ErrorCode.NOT_FOUND);
    }

    // Extract storage path from URL (everything after /files/)
    const urlParts = image.url.split("/files/");
    const storagePath = urlParts.length > 1 ? urlParts[1] : null;
    if (storagePath) {
      await supabase.storage.from("files").remove([storagePath]);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      return error("Failed to delete image", ErrorCode.SERVER_ERROR);
    }

    revalidatePath(`/admin/products/${image.product_id}`);
    revalidatePath("/products");

    return success(null, "Image deleted successfully");
  }
);

/**
 * Set image as primary
 */
export const setPrimaryImage = withErrorHandling(
  async (imageId: string, productId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Unset all primary images for this product
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);

    // Set this image as primary
    const { error: updateError } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imageId);

    if (updateError) {
      return error("Failed to set primary image", ErrorCode.SERVER_ERROR);
    }

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath("/products");

    return success(null, "Primary image updated");
  }
);

/**
 * Upload payment proof
 */
export const uploadPaymentProof = withErrorHandling(
  async (
    orderId: string,
    file: File,
    referenceNumber?: string
  ): Promise<ActionResponse<{ proofId: string }>> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Validate file
    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return error(validation.error!, ErrorCode.VALIDATION_ERROR);
    }

    // Verify order exists and belongs to user
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    if (order.customer_id !== user.id) {
      return error("This order does not belong to you", ErrorCode.FORBIDDEN);
    }

    // Generate filename
    const fileName = `payment-proofs/${user.id}/${generatePublicFileName(file.name)}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return error(
        "Failed to upload payment proof: " + uploadError.message,
        ErrorCode.SERVER_ERROR
      );
    }

    // Get URL
    const { data: urlData } = supabase.storage
      .from("files")
      .getPublicUrl(fileName);

    // Create payment proof record
    const { data: proof, error: dbError } = await supabase
      .from("payment_proofs")
      .insert({
        order_id: orderId,
        customer_id: user.id,
        image_url: urlData.publicUrl,
        reference_number: referenceNumber,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from("files").remove([fileName]);
      return error("Failed to save payment proof", ErrorCode.SERVER_ERROR);
    }

    // Update order payment status
    await supabase
      .from("orders")
      .update({ payment_status: "pending" })
      .eq("id", orderId);

    revalidatePath(`/orders/${orderId}`);

    return success(
      { proofId: proof.id },
      "Payment proof uploaded successfully. Await verification."
    );
  }
);

/**
 * Upload review images
 */
export const uploadReviewImage = withErrorHandling(
  async (file: File): Promise<ActionResponse<{ url: string }>> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Validate file
    const validation = validateImageUpload(file);
    if (!validation.valid) {
      return error(validation.error!, ErrorCode.VALIDATION_ERROR);
    }

    // Generate filename
    const fileName = `reviews/${user.id}/${generatePublicFileName(file.name)}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(fileName, file, { cacheControl: "31536000", upsert: false });

    if (uploadError) {
      return error(
        "Failed to upload image: " + uploadError.message,
        ErrorCode.SERVER_ERROR
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("files")
      .getPublicUrl(fileName);

    return success({ url: urlData.publicUrl });
  }
);
