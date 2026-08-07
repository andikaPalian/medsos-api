// ============================================================
// Environment configuration with Zod validation
// All environment variables are validated at startup
// ============================================================

import { z } from "zod";
import { SignOptions } from "jsonwebtoken";
import { HEX_REGEX } from "@core/constants/regex.constants.js";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  APP_NAME: z.string().default("social-media-api"),

  // URLs
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL"),
  BACKEND_URL: z.string().url("BACKEND_URL must be a valid URL").default("http://localhost:3000"),
  RESET_PASSWORD_URL: z.string().url("RESET_PASSWORD_URL must be a valid URL"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // JWT
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_SECRET_REFRESH: z.string().min(1, "JWT_SECRET_REFRESH is required"),
  JWT_ACCESS_EXPIRES: z.string().default("15m") as z.ZodType<SignOptions["expiresIn"]>,
  JWT_REFRESH_EXPIRES: z.string().default("7d") as z.ZodType<SignOptions["expiresIn"]>,
  JWT_REGISTER_EXPIRES: z.string().default("1d") as z.ZodType<SignOptions["expiresIn"]>,

  // Email (SMTP)
  EMAIL_HOST: z.string().min(1, "EMAIL_HOST is required"),
  EMAIL_HOST_PORT: z.coerce.number().default(587),
  EMAIL_LOGIN: z.string().min(1, "EMAIL_LOGIN is required"),
  EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
  FROM_EMAIL: z.string().email("FROM_EMAIL must be a valid email"),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Rate Limiting
  AUTH_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(15),
  AUTH_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(10),
  EMAIL_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(5),
  EMAIL_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(3),
  GLOBAL_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(1),
  GLOBAL_LIMIT_MAX_ATTEMPTS: z.coerce.number().positive().default(100),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url("GOOGLE_CALLBACK_URL must be a valid URL")
    .default("http://localhost:3000/api/v1/auth/google/callback"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAMES: z.string().min(1, "CLOUDINARY_CLOUD_NAMES is required"),
  CLOUDINARY_API_KEYS: z.string().min(1, "CLOUDINARY_API_KEYS is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  // Encryption Keys
  MESSAGE_ENCRYPTION_KEY: z
    .string()
    .length(64, "MESSAGE_ENCRYPTION_KEY must be 64 characters hex string")
    .regex(HEX_REGEX, "MESSAGE_ENCRYPTION_KEY must be a valid hexadecimal"),
  FILE_ENCRYPTION_KEY: z
    .string()
    .length(64, "FILE_ENCRYPTION_KEY must be 64 characters hex string")
    .regex(HEX_REGEX, "FILE_ENCRYPTION_KEY must be a valid hexadecimal"),
});

// Synchronous parsing — fails fast at startup
const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

export const env = parseResult.data;
export type Env = z.infer<typeof envSchema>;
