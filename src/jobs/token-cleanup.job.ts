import cron from "node-cron";
import { prisma } from "@core/config/database.config.js";
import { logger } from "@core/utils/logger.js";

export const autoCleanUpExpiredTokens = async (): Promise<void> => {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      logger.info(`[JOB: TOKEN CLEANUP] Deleted ${result.count} expired refresh tokens.`);
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`[JOB: TOKEN CLEANUP] Error during cleanup: ${err.message}`);
  }
};

export const initTokenCleanupCron = (): cron.ScheduledTask => {
  return cron.schedule("0 0 * * *", async () => {
    logger.info("[JOB: TOKEN CLEANUP] Cron triggered: cleaning up expired refresh tokens...");
    await autoCleanUpExpiredTokens();
  });
};
