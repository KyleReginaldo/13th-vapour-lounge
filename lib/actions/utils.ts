import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { z } from "zod";

/**
 * Standard API response format
 */
export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: ErrorCode;
};

/**
 * Error codes for standardized error handling
 */
export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  SERVER_ERROR = "SERVER_ERROR",
}

/**
 * Paginated response type
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

/**
 * Create a success response
 */
export function success<T>(data?: T, message?: string): ActionResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error response
 */
export function error(
  message: string,
  code: ErrorCode = ErrorCode.SERVER_ERROR
): ActionResponse {
  return {
    success: false,
    error: message,
    code,
  };
}

/**
 * Wrap server action with error handling
 * Includes structured logging and production-safe error messages
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<ActionResponse<R>>
) {
  return async (...args: T): Promise<ActionResponse<R>> => {
    try {
      return await fn(...args);
    } catch (err) {
      // Structured error logging
      const errorLog = {
        function: fn.name || "anonymous",
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        args: process.env.NODE_ENV === "development" ? args : undefined,
      };

      console.error("Server action error:", errorLog);

      // TODO: In production, send to monitoring service (e.g., Sentry)
      // if (process.env.NODE_ENV === "production") {
      //   Sentry.captureException(err, { extra: errorLog });
      // }

      // Handle Zod validation errors
      if (err instanceof z.ZodError) {
        const validationErrors = err.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        return error(validationErrors, ErrorCode.VALIDATION_ERROR);
      }

      // Production-safe error messages (don't expose internal details)
      const userMessage =
        process.env.NODE_ENV === "production"
          ? "An error occurred. Please try again later."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred";

      return error(userMessage, ErrorCode.SERVER_ERROR);
    }
  };
}

/**
 * Validate input data against a Zod schema
 */
export function validateInput<T>(schema: z.Schema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(
  query: PostgrestFilterBuilder<any, any, any, T>,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize;
  return query.range(offset, offset + pageSize - 1);
}

/**
 * Build a search query for multiple fields
 */
export function buildSearchFilter<T>(
  query: PostgrestFilterBuilder<any, any, any, T>,
  searchTerm: string,
  fields: string[]
) {
  if (!searchTerm || fields.length === 0) return query;

  const orConditions = fields
    .map((field) => `${field}.ilike.%${searchTerm}%`)
    .join(",");
  return query.or(orConditions);
}

/**
 * Format currency for display with Philippine peso sign and comma separators
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculate pagination metadata with next/prev flags
 */
export function getPaginationMeta(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
