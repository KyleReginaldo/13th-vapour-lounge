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
import { createServiceClient } from "@/lib/supabase/service";
import {
  generateSecureFileName,
  validateDocumentUpload,
} from "@/lib/validations/file-upload";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ageVerificationSchema = z.object({
  consentToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  consentToPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy",
  }),
});

/**
 * Submit age verification with ID document upload
 */
export const submitAgeVerification = withErrorHandling(
  async (
    formData: FormData
  ): Promise<ActionResponse<{ verificationId: string }>> => {
    const supabase = await createClient();
    const service = createServiceClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    // Check if already verified
    const { data: existingUser } = await service
      .from("users")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (existingUser?.is_verified) {
      return error("You are already verified", ErrorCode.CONFLICT);
    }

    // Validate consent checkboxes
    const consentToTerms = formData.get("consentToTerms") === "true";
    const consentToPrivacy = formData.get("consentToPrivacy") === "true";

    const validated = ageVerificationSchema.parse({
      consentToTerms,
      consentToPrivacy,
    });

    // Get uploaded file
    const file = formData.get("idDocument") as File;
    if (!file || file.size === 0) {
      return error(
        "Please upload your ID document",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Validate file
    const validation = validateDocumentUpload(file);
    if (!validation.valid) {
      return error(validation.error!, ErrorCode.VALIDATION_ERROR);
    }

    // Generate secure filename
    const fileName = generateSecureFileName(file.name, user.id);

    // Upload to Supabase Storage (service client bypasses RLS)
    const { error: uploadError } = await service.storage
      .from("files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return error(
        `Failed to upload document: ${uploadError.message}`,
        ErrorCode.SERVER_ERROR
      );
    }

    // Get URL
    const { data: urlData } = service.storage
      .from("files")
      .getPublicUrl(fileName);

    // Get user's IP and user agent
    const ipAddress = ""; // Would get from headers in production
    const userAgent = ""; // Would get from headers in production

    // Create verification record (service client bypasses RLS)
    const { data: verification, error: dbError } = await service
      .from("age_verifications")
      .insert({
        user_id: user.id,
        id_verification_url: urlData.publicUrl,
        consent_to_terms: validated.consentToTerms,
        consent_to_privacy: validated.consentToPrivacy,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await service.storage.from("files").remove([fileName]);
      console.error("DB insert error:", dbError);
      return error(
        `Failed to save verification: ${dbError.message}`,
        ErrorCode.SERVER_ERROR
      );
    }

    // Log audit trail
    await logAudit({
      action: "submit_age_verification",
      entityType: "age_verification",
      entityId: verification.id,
      userId: user.id,
    });

    return success(
      { verificationId: verification.id },
      "Age verification submitted successfully. Please wait for admin approval."
    );
  }
);

/**
 * Get pending age verifications (Admin only)
 */
export const getPendingVerifications = withErrorHandling(
  async (): Promise<ActionResponse> => {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { data, error: fetchError } = await supabase
      .from("age_verifications")
      .select(
        `
        *,
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          date_of_birth
        )
      `
      )
      .is("verified_at", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return error("Failed to fetch verifications", ErrorCode.SERVER_ERROR);
    }

    return success(data);
  }
);

/**
 * Approve age verification (Admin only)
 */
export const approveAgeVerification = withErrorHandling(
  async (verificationId: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get verification record
    const { data: verification } = await supabase
      .from("age_verifications")
      .select("user_id")
      .eq("id", verificationId)
      .single();

    if (!verification) {
      return error("Verification not found", ErrorCode.NOT_FOUND);
    }

    // Update verification record
    const { error: updateError } = await supabase
      .from("age_verifications")
      .update({
        verified_at: new Date().toISOString(),
        verified_by: admin.id,
      })
      .eq("id", verificationId);

    if (updateError) {
      return error("Failed to approve verification", ErrorCode.SERVER_ERROR);
    }

    // Update user's verified status
    const { error: userError } = await supabase
      .from("users")
      .update({ is_verified: true })
      .eq("id", verification.user_id ?? "");

    if (userError) {
      return error("Failed to update user status", ErrorCode.SERVER_ERROR);
    }

    // Log audit trail
    await logAudit({
      action: "approve_age_verification",
      entityType: "age_verification",
      entityId: verificationId,
      userId: admin.id,
    });

    revalidatePath("/admin/verifications");

    return success(null, "Verification approved successfully");
  }
);

/**
 * Reject age verification (Admin only)
 */
export const rejectAgeVerification = withErrorHandling(
  async (verificationId: string, reason: string): Promise<ActionResponse> => {
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    if (!reason || reason.trim().length < 10) {
      return error(
        "Please provide a detailed rejection reason (minimum 10 characters)",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Update verification record
    const { error: updateError } = await supabase
      .from("age_verifications")
      .update({
        verified_at: new Date().toISOString(),
        verified_by: admin.id,
        rejection_reason: reason,
      })
      .eq("id", verificationId);

    if (updateError) {
      return error("Failed to reject verification", ErrorCode.SERVER_ERROR);
    }

    // Log audit trail
    await logAudit({
      action: "reject_age_verification",
      entityType: "age_verification",
      entityId: verificationId,
      userId: admin.id,
      newValue: { rejection_reason: reason },
    });

    revalidatePath("/admin/verifications");

    return success(null, "Verification rejected");
  }
);

/**
 * Get user's verification status
 */
export const getMyVerificationStatus = withErrorHandling(
  async (): Promise<ActionResponse> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return error("You must be logged in", ErrorCode.UNAUTHORIZED);
    }

    const { data } = await supabase
      .from("age_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return success(data);
  }
);
