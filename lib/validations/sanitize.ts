/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks by sanitizing user-generated content
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content by removing all HTML tags and attributes
 * Use this for user inputs that should be plain text only
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * Sanitize HTML but allow safe formatting tags
 * Use this for rich text content like product descriptions
 */
export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize product input data
 */
export function sanitizeProductInput<T extends Record<string, any>>(
  data: T
): T {
  return {
    ...data,
    name: data.name ? sanitizeHTML(data.name) : data.name,
    description: data.description
      ? sanitizeRichText(data.description)
      : data.description,
  };
}

/**
 * Sanitize review input data
 */
export function sanitizeReviewInput<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    title: data.title ? sanitizeHTML(data.title) : data.title,
    review_text: data.review_text
      ? sanitizeRichText(data.review_text)
      : data.review_text,
  };
}

/**
 * Sanitize order notes and customer input
 */
export function sanitizeOrderInput<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    customer_notes: data.customer_notes
      ? sanitizeHTML(data.customer_notes)
      : data.customer_notes,
    delivery_instructions: data.delivery_instructions
      ? sanitizeHTML(data.delivery_instructions)
      : data.delivery_instructions,
  };
}

/**
 * Sanitize supplier/staff notes
 */
export function sanitizeNotesInput(notes: string | undefined): string {
  return notes ? sanitizeHTML(notes) : "";
}
