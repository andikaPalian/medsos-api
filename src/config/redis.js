import Redis from "ioredis";
import logger from "../utils/logger.js";

// Fail fast if REDIS_URL is not defined
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("CRITICAL: REDIS_URL is not defined in environment variables.");
}

// Initialize singleton Redis instance
const redisClient = new Redis(redisUrl, {
  // Disable automatic retries to prevent overwhelming the server during outages
  maxRetriesPerRequest: null,
  // Disable ready check to allow connection attempts even if the server is not fully ready
  enableReadyCheck: false,
  // Implement exponential backoff for reconnection attempts
  retryStrategy: (times) => {
    const delay = Math.min(Math.pow(2, times) * 50, 2000);
    logger.warn(`[REDIS] Connection lost. Attempting reconnect #${times} in ${delay}ms...`);
    return delay;
  },
  // Handle failover scenarios by reconnecting to the new master if a READONLY error is detected
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      logger.warn(`[REDIS] Detected READONLY node change. Reconnecting to new Master...`);
      return true;
    }
    return false;
  },
  // Set a reasonable connection timeout to avoid hanging connections
  keepAlive: 10000,
});

redisClient.on("connect", () => {
  logger.info("[REDIS] Hanshake initiated. Connecting to Cloud instance...");
});

redisClient.on("ready", () => {
  logger.info("[REDIS] Connection fully established. Client is ready to process commands.");
});

redisClient.on("error", (err) => {
  logger.error(`[REDIS] Connection error: ${err.message}`);
});

// Graceful shutdown handler to close Redis connection cleanly on application exit
export const handleGracefulShutdown = async (signal) => {
  logger.info(`[REDIS] Received ${signal}. Closing Redis connection...`);
  try {
    await redisClient.quit();
    logger.info("[REDIS] Connection closed cleanly. Safe to exit.");
  } catch (error) {
    logger.error(`[REDIS] Error during graceful disconnect: ${error.message}`);
  }
};

// Listen for termination signals to trigger graceful shutdown
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

export default redisClient;
