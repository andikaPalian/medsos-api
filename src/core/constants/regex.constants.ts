// ============================================================
// Shared regex patterns used across validation schemas
// ============================================================

/** Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/** Alphanumeric and underscores only */
export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

/** Valid hexadecimal string */
export const HEX_REGEX = /^[0-9a-fA-F]+$/;

/** UUID v4 format */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
