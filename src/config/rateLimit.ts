import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { Request, Response, NextFunction, RequestHandler } from "express";
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
}: CreateLimiterOptions): RequestHandler => {
  // Use parseInt with radix 10 for security parse
  const duration = windowMins * 60;

  const limiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `${REDIS_KEY_PREFIX}${limiterName}`,
    points: maxAttempts,
    duration,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix: `${REDIS_KEY_PREFIX}${limiterName}:insurance`,
      points: maxAttempts,
      duration,
    }),
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.ip ?? "unknown";

    try {
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        const retryAfterSecs = Math.ceil(error.msBeforeNext / 1000);

        logger.warn(
          `[RATE LIMITER] Limiter: ${limiterName} | IP: ${key} | Path: ${req.originalUrl} | Retry after: ${retryAfterSecs}s`,
        );

        res.set({
          "Retry-After": String(retryAfterSecs),
          "X-RateLimit-Limit": String(maxAttempts),
          "X-RateLimit-Remaining": String(error.remainingPoints ?? 0),
          "X-RateLimit-Reset": String(Math.ceil((Date.now() + error.msBeforeNext) / 1000)),
        });

        res.status(429).json({
          success: false,
          statusCode: 429,
          error: "TOO_MANY_REQUESTS",
          message,
          retryAfter: retryAfterSecs,
        });
        return;
      }

      logger.warn(
        `[RATE LIMITER] Unexpected error in limiter ${limiterName}: ${(error as Error).message}`,
      );
      next(error);
    }
  };
};
