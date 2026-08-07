import { redisClient } from "@core/config/redis.config.js";
import { logger } from "@core/utils/logger.js";
import { REDIS } from "@core/constants/app.constants.js";

const ONLINE_KEY = `${REDIS.PRESENCE_PREFIX}online_users`;
const USER_SOCKETS_PREFIX = `${REDIS.PRESENCE_PREFIX}user_sockets:`;

export const addPresence = async (userId: string, socketId: string): Promise<boolean> => {
  try {
    const userSocketsKey = `${USER_SOCKETS_PREFIX}${userId}`;
    const pipeline = redisClient.pipeline();

    pipeline.sadd(userSocketsKey, socketId);
    pipeline.sadd(ONLINE_KEY, userId);

    const results = await pipeline.exec();
    const addedCount = (results?.[0]?.[1] as number) ?? 0;

    return addedCount > 0;
  } catch (error) {
    const err = error as Error;
    logger.error(`[PRESENCE] Error adding presence for user ${userId}: ${err.message}`);
    return false;
  }
};

export const removePresence = async (userId: string, socketId: string): Promise<boolean> => {
  try {
    const userSocketsKey = `${USER_SOCKETS_PREFIX}${userId}`;
    await redisClient.srem(userSocketsKey, socketId);

    const remainingCount = await redisClient.scard(userSocketsKey);

    if (remainingCount === 0) {
      await redisClient.srem(ONLINE_KEY, userId);
      return true;
    }

    return false;
  } catch (error) {
    const err = error as Error;
    logger.error(`[PRESENCE] Error removing presence for user ${userId}: ${err.message}`);
    return false;
  }
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  try {
    return (await redisClient.sismember(ONLINE_KEY, userId)) === 1;
  } catch {
    return false;
  }
};

export const getOnlineUsers = async (): Promise<string[]> => {
  try {
    return await redisClient.smembers(ONLINE_KEY);
  } catch {
    return [];
  }
};
