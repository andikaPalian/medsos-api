import { logger } from "../../common/utils/logger.js";
import { redisClient } from "../../config/redis.js";

// Multi-device/multi-browser-support - return true if user was the first connection
export const markUserOnline = async (userId: string, socketId: string): Promise<boolean> => {
  const key = `presence:user:${userId}`;
  try {
    const result = await redisClient.multi().sadd(key, socketId).scard(key).exec();
    if (!result) return false;

    const count = result[1][1] as number;
    return count === 1;
  } catch (error) {
    logger.error(
      `[PRESENCE STATE] Error marking user online for user ${userId}: ${(error as Error).message}`,
    );
    return false;
  }
};

// Multi-device/multi-browser-support - return true if user was the last connection (offline)
export const markUserOffline = async (userId: string, socketId: string): Promise<boolean> => {
  const key = `presence:user:${userId}`;

  try {
    const results = await redisClient.multi().srem(key, socketId).scard(key).exec();
    if (!results) return false;

    const remainingSocket = results[1][1] as number;

    return remainingSocket === 0;
  } catch (error) {
    logger.error(
      `[PRESENCE STATE] Error marking user offline for user ${userId}: ${(error as Error).message}`,
    );
    return false;
  }
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  try {
    const key = `presence:user:${userId}`;
    const count = await redisClient.scard(key);
    return count > 0;
  } catch (error) {
    logger.error(
      `[PRESENCE STATE] Error checking online status for user ${userId}: ${(error as Error).message}`,
    );
    return false;
  }
};
