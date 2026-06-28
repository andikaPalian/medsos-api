import { rateLimit, Options, RateLimitExceededEventHandler } from "express-rate-limit";
import { RedisStore, SendCommandFn } from "rate-limit-redis";
import { Request, Response } from "express";
import { redisClient } from "./redis.js";
import { logger } from "../common/utils/logger.js";
// Namespace global Redis keys for rate limiting to avoid collisions with other Redis usage in the application
const REDIS_KEY_PREFIX = "rl:" as const;

interface CreateLimiterOptions {
  windowMins: number;
  maxAttempts: number;
  message: string;
  limiterName: string;
}

// Function to create a rate limiter instance
export const createLimiter = ({
  windowMins,
  maxAttempts,
  message,
  limiterName,
}: CreateLimiterOptions): RateLimitExceededEventHandler => {
  // Fail fast
  if (!limiterName) {
    throw new Error("CRITICAL: limiterName is required to create a rate limiter instance.");
  }

  if (!windowMins || !maxAttempts) {
    throw new Error(
      "CRITICAL: windowMins and maxAttempts are required to create a rate limiter instance.",
    );
  }

  // Use parseInt with radix 10 for security parse
  const windowMs = windowMins * 60 * 1000;

  const sendCommand: SendCommandFn = (...args: string[]) =>
    redisClient.call(args[0], ...args.slice(1)) as ReturnType<SendCommandFn>;

  const limiterOptions: Partial<Options> = {
    windowMs,
    max: maxAttempts,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      statusCode: 429,
      error: "TOO_MANY_REQUESTS",
      message,
    },
    // Integrate Redis
    store: new RedisStore({
      prefix: `${REDIS_KEY_PREFIX}${limiterName}:`,
      sendCommand,
    }),
    // If Redis is down, prioritize application continuity
    passOnStoreError: true,
    keyGenerator: (req: Request): string => req.ip ?? "unknown",
    handler: (req: Request, res: Response, _next, options) => {
      logger.warn(
        `[RATE LIMIT] Limiter: ${limiterName} | IP: ${req.ip ?? "unknown"} | Path: ${req.originalUrl}`,
      );
      res.status(options.statusCode).json(options.message);
    },
  };

  return rateLimit(limiterOptions);
};
