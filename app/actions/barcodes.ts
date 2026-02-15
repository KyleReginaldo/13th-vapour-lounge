"use server";

import {
  error,
  ErrorCode,
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
// import bwipjs from "bwip-js"; // Commented out - module not installed
import QRCode from "qrcode";

/**
 * Generate QR code for a product
 */
export const generateProductQRCode = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, slug, name, sku")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    // Generate product URL
    const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(productUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return success({
      qrCode: qrCodeDataUrl,
      productUrl,
      productName: product.name,
      sku: product.sku,
    });
  }
);

/**
 * Generate barcode for a product SKU
 */
export const generateProductBarcode = withErrorHandling(
  async (productId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get product
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, sku, name")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      return error("Product not found", ErrorCode.NOT_FOUND);
    }

    if (!product.sku) {
      return error("Product does not have a SKU", ErrorCode.VALIDATION_ERROR);
    }

    // Feature disabled - bwip-js module not installed
    return error("Barcode generation not available", ErrorCode.SERVER_ERROR);

    /* Commented out - bwip-js module not installed
    try {
      // Generate Code128 barcode as PNG buffer
      const png = await bwipjs.toBuffer({
        bcid: "code128", // Barcode type
        text: product.sku, // Text to encode
        scale: 3, // 3x scaling factor
        height: 10, // Bar height, in millimeters
        includetext: true, // Show human-readable text
        textxalign: "center", // Center the text
      });

      // Convert buffer to base64 data URL
      const barcodeDataUrl = `data:image/png;base64,${png.toString("base64")}`;

      return success({
        barcode: barcodeDataUrl,
        sku: product.sku,
        productName: product.name,
      });
    } catch (err) {
      return error("Failed to generate barcode", ErrorCode.SERVER_ERROR);
    }
    */
  }
);

/**
 * Generate QR code for order (for pickup/verification)
 */
export const generateOrderQRCode = withErrorHandling(
  async (orderId: string): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Get order (check ownership or admin/staff)
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, total, status")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return error("Order not found", ErrorCode.NOT_FOUND);
    }

    // Check if user owns the order or is admin/staff (Note: role column may not exist in users table)
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    const isAdminOrStaff = ["admin", "staff"].includes(
      (userProfile as any)?.role || ""
    );
    if (order.customer_id !== user.id && !isAdminOrStaff) {
      return error(
        "You don't have permission to access this order",
        ErrorCode.FORBIDDEN
      );
    }

    // Generate verification code (order number + last 4 digits of total)
    const verificationCode = `${order.order_number}-${Math.floor(
      order.total * 100
    )
      .toString()
      .slice(-4)}`;

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(verificationCode, {
      width: 400,
      margin: 2,
    });

    return success({
      qrCode: qrCodeDataUrl,
      verificationCode,
      orderNumber: order.order_number,
    });
  }
);

/**
 * Generate QR code for payment verification
 */
export const generatePaymentQRCode = withErrorHandling(
  async (paymentProofId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get payment proof
    const { data: proof, error: fetchError } = await supabase
      .from("payment_proofs")
      .select(
        `
        id,
        reference_number,
        orders!inner (
          order_number
        )
      `
      )
      .eq("id", paymentProofId)
      .single();

    if (fetchError || !proof) {
      return error("Payment proof not found", ErrorCode.NOT_FOUND);
    }

    if (!proof.reference_number) {
      return error(
        "Payment reference number not extracted yet",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Generate QR code with reference number
    const qrCodeDataUrl = await QRCode.toDataURL(proof.reference_number, {
      width: 300,
      margin: 2,
    });

    return success({
      qrCode: qrCodeDataUrl,
      referenceNumber: proof.reference_number,
      orderNumber: proof.orders.order_number,
    });
  }
);

/**
 * Generate multiple product QR codes for printing
 */
export const bulkGenerateProductQRCodes = withErrorHandling(
  async (productIds: string[]): Promise<ActionResponse> => {
    const admin = await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, slug, name, sku")
      .in("id", productIds);

    if (fetchError) {
      return error("Failed to fetch products", ErrorCode.SERVER_ERROR);
    }

    if (!products || products.length === 0) {
      return error("No products found", ErrorCode.NOT_FOUND);
    }

    // Generate QR codes for all products
    const qrCodes = await Promise.all(
      products.map(async (product) => {
        const productUrl = `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`;
        const qrCode = await QRCode.toDataURL(productUrl, {
          width: 200,
          margin: 1,
        });
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          qrCode,
          productUrl,
        };
      })
    );

    // Log audit
    await logAudit({
      action: "bulk_generate_qr_codes",
      entityType: "product",
      entityId: "bulk",
      userId: admin.id,
      newValue: { productIds },
    });

    return success(qrCodes);
  }
);

/**
 * Generate barcode for variant SKU
 */
export const generateVariantBarcode = withErrorHandling(
  async (variantId: string): Promise<ActionResponse> => {
    await requireRole(["admin", "staff"]);
    const supabase = await createClient();

    // Get variant
    const { data: variant, error: fetchError } = await supabase
      .from("product_variants")
      .select(
        `
        id,
        sku,
        attributes,
        products (
          name
        )
      `
      )
      .eq("id", variantId)
      .single();

    if (fetchError || !variant) {
      return error("Variant not found", ErrorCode.NOT_FOUND);
    }

    if (!variant.sku) {
      return error("Variant does not have a SKU", ErrorCode.VALIDATION_ERROR);
    }

    // Feature disabled - bwip-js module not installed
    return error("Barcode generation not available", ErrorCode.SERVER_ERROR);

    /* Commented out - bwip-js module not installed
    try {
      const png = await bwipjs.toBuffer({
        bcid: "code128",
        text: variant.sku,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
      });

      const barcodeDataUrl = `data:image/png;base64,${png.toString("base64")}`;

      // Build variant description from attributes
      const attrDesc = variant.attributes
        ? Object.entries(variant.attributes)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "";

      return success({
        barcode: barcodeDataUrl,
        sku: variant.sku,
        productName: variant.products?.name,
        variantDescription: attrDesc,
      });
    } catch (err) {
      return error("Failed to generate barcode", ErrorCode.SERVER_ERROR);
    }
    */
  }
);
