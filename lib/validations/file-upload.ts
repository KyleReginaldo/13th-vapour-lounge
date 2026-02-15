/**
 * File Upload Validation Utilities
 * Ensures uploaded files are safe and meet requirements
 */

import { fileTypeFromBuffer } from "file-type";

// Allowed MIME types for different upload purposes
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validate image file (for product images, review images)
 */
export function validateImageUpload(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`,
    };
  }

  // Check MIME type from file object
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  return { valid: true };
}

/**
 * Validate document file (for ID verification, payment proofs)
 */
export function validateDocumentUpload(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB.`,
    };
  }

  // Check MIME type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and PDF files are allowed.",
    };
  }

  return { valid: true };
}

/**
 * Validate file against actual file content (more secure than just checking extension)
 * Use this for critical uploads like payment proofs and ID verification
 */
export async function validateFileContent(
  buffer: ArrayBuffer,
  allowedTypes: readonly string[]
): Promise<ValidationResult> {
  try {
    const fileType = await fileTypeFromBuffer(new Uint8Array(buffer));

    if (!fileType) {
      return {
        valid: false,
        error: "Unable to determine file type. File may be corrupted.",
      };
    }

    if (!allowedTypes.includes(fileType.mime)) {
      return {
        valid: false,
        error: `Invalid file type detected: ${fileType.mime}. Expected: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to validate file content.",
    };
  }
}

/**
 * Generate secure filename for uploads
 * Format: {userId}/{timestamp}-{random}.{extension}
 */
export function generateSecureFileName(
  originalName: string,
  userId: string
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Generate secure filename without userId (for public uploads)
 * Format: {timestamp}-{random}.{extension}
 */
export function generatePublicFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Check if file is an image based on MIME type
 */
export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type as any);
}

/**
 * Validate multiple files at once
 */
export function validateMultipleImages(
  files: File[],
  maxFiles: number = 5
): ValidationResult {
  if (files.length > maxFiles) {
    return {
      valid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed.`,
    };
  }

  for (const file of files) {
    const result = validateImageUpload(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}
