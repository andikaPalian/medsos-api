import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redisClient from "./redis.js";
import logger from "../utils/logger.js";

// Namespace global Redis keys for rate limiting to avoid collisions with other Redis usage in the application
const REDIS_KEY_PREFIX = "rl:";

// Function to create a rate limiter instance
export const createLimiter = ({ windowMins, maxAttempts, message, limiterName }) => {
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
  const windowMs = parseInt(windowMins, 10) * 60 * 1000;
  const max = parseInt(maxAttempts, 10);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      statusCode: 429,
      error: "TOO_MANY_REQUESTS",
      message: message || "Too many requests from this IP, please try again later.",
    },
    // Integrate Redis
    store: new RedisStore({
      prefix: `${REDIS_KEY_PREFIX}${limiterName}:`,
      sendCommand: (...args) => redisClient.call(args[0], ...args.slice(1)),
    }),
    // If Redis is down, prioritize application continuity
    passOnStoreError: true,
    keyGenerator: (req) => {
      return req.ip;
    },
    handler: (req, res, next, options) => {
      const ip = req.ip;
      logger.warn(
        `[RATE LIMIT] Limiter: ${limiterName} | Blocker IP: ${ip} | Path: ${req.originalUrl}`,
      );
      res.status(options.statusCode).json(options.message);
    },
  });
};
