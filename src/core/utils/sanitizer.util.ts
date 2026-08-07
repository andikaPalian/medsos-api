// ============================================================
// XSS Sanitizer Utility
// Sanitizes and escapes HTML/Script injection in user inputs
// Preserves sensitive auth fields (passwords, tokens, emails, URLs)
// ============================================================

import validator from "validator";

// Keys that must remain untouched (not HTML-escaped) for raw cryptographic or matching operations
const SENSITIVE_RAW_KEYS = new Set([
  "password",
  "newPassword",
  "oldPassword",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "verificationToken",
  "resetPasswordToken",
  "authorization",
  "email",
  "url",
  "fileUrl",
  "urlPublicId",
  "profilePublicId",
]);

/**
 * Escapes HTML characters in a string to prevent Stored & Reflected XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return input;
  return validator.escape(input.trim());
};

/**
 * Sanitizes an object recursively by escaping user-generated text string fields
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const val = sanitized[key];

      // Skip sensitive raw keys like passwords and tokens
      if (SENSITIVE_RAW_KEYS.has(key)) {
        continue;
      }

      if (typeof val === "string") {
        (sanitized as any)[key] = sanitizeHtml(val);
      } else if (Array.isArray(val)) {
        (sanitized as any)[key] = val.map((item: any) =>
          typeof item === "string" ? sanitizeHtml(item) : typeof item === "object" ? sanitizeObject(item) : item,
        );
      } else if (typeof val === "object" && val !== null) {
        (sanitized as any)[key] = sanitizeObject(val);
      }
    }
  }

  return sanitized;
};
