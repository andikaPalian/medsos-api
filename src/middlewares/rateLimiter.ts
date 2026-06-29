import { env } from "../config/env.js";
import { createLimiter } from "../config/rateLimit.js";

export const authLimiter = createLimiter({
  windowMins: env.AUTH_LIMIT_WINDOW_MINS,
  maxAttempts: env.AUTH_LIMIT_MAX_ATTEMPTS,
  message: "Too many authentication attempts from this IP. Please try again after 15 minutes",
  limiterName: "auth",
});

export const emailLimiter = createLimiter({
  windowMins: env.EMAIL_LIMIT_WINDOW_MINS,
  maxAttempts: env.EMAIL_LIMIT_MAX_ATTEMPTS,
  message: "Too many email requests. Please wait 5 minutes before requesting another code.",
  limiterName: "email",
});

export const globalLimiter = createLimiter({
  windowMins: env.GLOBAL_LIMIT_WINDOW_MINS,
  maxAttempts: env.GLOBAL_LIMIT_MAX_ATTEMPTS,
  message: "Too many requests from this IP. Please try again in a minute.",
  limiterName: "global",
});
