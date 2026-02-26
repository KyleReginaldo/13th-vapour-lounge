/**
 * HTML Sanitization Utilities
 * Prevents XSS attacks by sanitizing user-generated content
 * Pure JS implementation — no jsdom/dompurify dependency (Vercel ESM compatible)
 */

const SAFE_TAGS = new Set([
  "b",
  "i",
  "em",
  "strong",
  "u",
  "p",
  "br",
  "ul",
  "ol",
  "li",
]);

/**
 * Sanitize HTML content by removing all HTML tags and attributes
 * Use this for user inputs that should be plain text only
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Sanitize HTML but allow safe formatting tags
 * Use this for rich text content like product descriptions
 */
export function sanitizeRichText(input: string): string {
  // Remove script/style blocks entirely
  const stripped = input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove all tags except those in SAFE_TAGS (also strips all attributes)
  return stripped.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
    (match, tag) => {
      if (SAFE_TAGS.has(tag.toLowerCase())) {
        // Keep the tag but strip all attributes
        const isClosing = match.startsWith("</");
        return isClosing ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`;
      }
      return "";
    }
  );
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
