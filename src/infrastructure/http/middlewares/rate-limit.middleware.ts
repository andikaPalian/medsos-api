import { createLimiter } from "@core/config/rate-limit.config.js";
import { RATE_LIMIT } from "@core/constants/app.constants.js";

export const authLimiter = createLimiter({
  windowMins: RATE_LIMIT.AUTH_LIMIT_WINDOW_MINS,
  maxAttempts: RATE_LIMIT.AUTH_LIMIT_MAX_ATTEMPTS,
  message: "Too many authentication attempts. Please try again later.",
  limiterName: "auth",
});

export const emailLimiter = createLimiter({
  windowMins: RATE_LIMIT.EMAIL_LIMIT_WINDOW_MINS,
  maxAttempts: RATE_LIMIT.EMAIL_LIMIT_MAX_ATTEMPTS,
  message: "Too many email requests. Please wait before requesting another email.",
  limiterName: "email",
});

export const globalLimiter = createLimiter({
  windowMins: RATE_LIMIT.GLOBAL_LIMIT_WINDOW_MINS,
  maxAttempts: RATE_LIMIT.GLOBAL_LIMIT_MAX_ATTEMPTS,
  message: "Rate limit exceeded. Please slow down your requests.",
  limiterName: "global",
});
