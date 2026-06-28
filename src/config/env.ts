import { z } from "zod";
import { SignOptions } from "jsonwebtoken";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().url("CLIENT_URL must be a valid url"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_SECRET_REFRESH: z.string().min(1, "JWT_SECRET_REFRESH is required"),

  JWT_ACCESS_EXPIRES: z.string().default("15m") as z.ZodType<SignOptions["expiresIn"]>,
  JWT_REFRESH_EXPIRES: z.string().default("7d") as z.ZodType<SignOptions["expiresIn"]>,
  JWT_REGISTER_EXPIRES: z.string().default("1d") as z.ZodType<SignOptions["expiresIn"]>,

  EMAIL_HOST: z.string().min(1, "EMAIL_HOST is required"),
  EMAIL_HOST_PORT: z.coerce.number().default(587),
  EMAIL_LOGIN: z.string().min(1, "EMAIL_LOGIN is required"),
  EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),
  FROM_EMAIL: z.string().email("FROM_EMAIL must be a valid email"),
  RESET_PASSWORD_URL: z.string().url("RESET_PASSWORD_URL must be a valid url"),

  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  AUTH_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(15),
  AUTH_LIMIT_MAX_ATTEMPS: z.coerce.number().positive().default(10),
  EMAIL_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(5),
  EMAIL_LIMIT_MAX_ATTEMPS: z.coerce.number().positive().default(3),
  GLOBAL_LIMIT_WINDOW_MINS: z.coerce.number().positive().default(1),
  GLOBAL_LIMIT_MAX_ATTEMPS: z.coerce.number().positive().default(100),
});

// Synchronus Parsing
const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
  console.error("Invalid environment configuration.");
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

export const env = parseResult.data;
