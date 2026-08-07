import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { redisClient } from "./redis.config.js";
import { logger } from "@core/utils/logger.js";
import { REDIS } from "@core/constants/app.constants.js";

interface CreateLimiterOptions {
  windowMins: number;
  maxAttempts: number;
  message: string;
  limiterName: string;
}

export const createLimiter = ({
  windowMins,
  maxAttempts,
  message,
  limiterName,
}: CreateLimiterOptions): RequestHandler => {
  const duration = windowMins * 60;

  const limiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: `${REDIS.RATE_LIMIT_PREFIX}${limiterName}`,
    points: maxAttempts,
    duration,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix: `${REDIS.RATE_LIMIT_PREFIX}${limiterName}:insurance`,
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
          `[RATE LIMITER] ${limiterName} | IP: ${key} | Path: ${req.originalUrl} | Retry after: ${retryAfterSecs}s`,
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
        `[RATE LIMITER] Unexpected error in ${limiterName}: ${(error as Error).message}`,
      );
      next(error);
    }
  };
};
