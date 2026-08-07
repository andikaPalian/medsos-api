import { Redis, RedisOptions } from "ioredis";
import { env } from "./env.config.js";
import { logger } from "@core/utils/logger.js";

const REDIS_KEY_NAMESPACE = env.APP_NAME;

const isTlsNeeded = env.REDIS_URL.startsWith("rediss://");

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 5000,
  keepAlive: 30000,
  keyPrefix: `${REDIS_KEY_NAMESPACE}:`,
  ...(isTlsNeeded && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
  retryStrategy: (times: number): number | null => {
    if (times > 5) {
      logger.error("[REDIS] Cannot connect to Redis host (ETIMEDOUT / Offline). Reconnection paused.");
      return null;
    }

    const delay = Math.min(times * 1000, 3000);
    logger.warn(`[REDIS] Connection lost or timing out. Reconnect attempt #${times} in ${delay}ms...`);
    return delay;
  },
  reconnectOnError: (err: Error): boolean => {
    const shouldReconnect = err.message.includes("READONLY");
    if (shouldReconnect) {
      logger.warn("[REDIS] READONLY error detected. Reconnecting to master...");
    }
    return shouldReconnect;
  },
};

const createRedisInstance = (): Redis => {
  try {
    return new Redis(env.REDIS_URL, redisOptions);
  } catch (error) {
    const err = error as Error;
    logger.error(`[REDIS CONFIG] Invalid REDIS_URL in .env: "${env.REDIS_URL}". Error: ${err.message}`);
    return new Redis("redis://localhost:6379", redisOptions);
  }
};

export const redisClient = createRedisInstance();

let hasLoggedError = false;

redisClient.on("connect", () => {
  hasLoggedError = false;
  logger.info("[REDIS] Connecting to Redis instance...");
});

redisClient.on("ready", () => {
  hasLoggedError = false;
  logger.info("[REDIS] Connection fully established. Client is ready.");
});

redisClient.on("error", (err: Error) => {
  if (!hasLoggedError) {
    logger.error(`[REDIS] Connection error (${err.message}). Check network connection or REDIS_URL in .env.`);
    hasLoggedError = true;
  }
});

redisClient.on("close", () => {
  logger.warn("[REDIS] Connection closed.");
});

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
