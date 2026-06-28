import { Redis, RedisOptions } from "ioredis";
import { env } from "./env.js";
import { logger } from "../common/utils/logger.js";

const REDIS_KEY_NAMESPACE = env.APP_NAME ?? "app";

// Fail fast if REDIS_URL is not defined
const redisUrl = env.REDIS_URL;
if (!redisUrl) {
  throw new Error("CRITICAL: REDIS_URL is not defined in environment variables.");
}

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times: number): number | null => {
    if (times > 10) {
      logger.error("[REDIS] Max reconnection attempts reached. Giving up.");
      return null;
    }

    const delay = Math.min(Math.pow(2, times) * 100, 5000);
    logger.warn(`[REDIS] Connection lost. Reconnect attempt #${times} in ${delay}ms...`);
    return delay;
  },
  reconnectOnError: (err: Error): boolean => {
    const shouldReconnect = err.message.includes("READONLY");
    if (shouldReconnect) {
      logger.warn("[REDIS] READONLY error detected. Reconnecting to new master...");
    }
    return shouldReconnect;
  },
  keepAlive: 30000,
  connectTimeout: 10000,
  keyPrefix: `${REDIS_KEY_NAMESPACE}:`,
};

// Initialize singleton Redis instance
const redisClient = new Redis(redisUrl, redisOptions);

redisClient.on("connect", () => {
  logger.info("[REDIS] Hanshake initiated. Connecting to Cloud instance...");
});

redisClient.on("ready", () => {
  logger.info("[REDIS] Connection fully established. Client is ready to process commands.");
});

redisClient.on("error", (err: Error) => {
  logger.error(`[REDIS] Connection error: ${err.message}`);
});

redisClient.on("close", () => {
  logger.warn("[REDIS] Connection closed.");
});

redisClient.on("reconnecting", () => {});

// Graceful shutdown handler to close Redis connection cleanly on application exit
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info("[REDIS] Connection closed cleanly.");
  } catch (error) {
    const err = error as Error;
    logger.error(`[REDIS] Error during disconnection: ${err.message}`);
    redisClient.disconnect();
  }
};

export { redisClient };
